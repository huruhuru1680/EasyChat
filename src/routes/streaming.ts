import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { authenticate } from './auth';
import { createProviderAdapter } from '../providers';
import { SDKType } from '../core/provider-contract';

export const streamingRouter = Router();

streamingRouter.use(authenticate);

const streamRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1),
  })).min(1),
  provider: z.string().optional(),
  model: z.string().optional(),
});

function generateId(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(16).toString('hex');
}

streamingRouter.post('/conversations/:conversationId/stream', (req, res) => {
  const parsed = streamRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const { userId } = (req as any).user;
  const db = getDb();

  const conversation = db.prepare(
    'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.conversationId, userId);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let accumulatedContent = '';
  let chunkCount = 0;
  let providerName: string | undefined;
  let modelName: string | undefined;

  const sendEvent = (eventName: string, data: object) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const endStream = (finalContent: string, provider?: string, model?: string) => {
    const id = generateId();
    const { conversationId } = req.params;

    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, provider, model, tokens)
      VALUES (?, ?, 'assistant', ?, ?, ?, ?)
    `).run(id, conversationId, finalContent, provider || null, model || null, null);

    db.prepare(`
      UPDATE conversations SET updated_at = datetime('now') WHERE id = ?
    `).run(conversationId);

    sendEvent('done', {
      message: {
        id,
        conversation_id: conversationId,
        role: 'assistant',
        content: finalContent,
        provider: provider || null,
        model: model || null,
        created_at: new Date().toISOString(),
      },
    });

    res.end();
  };

  const runStream = async () => {
    const { messages, provider, model } = parsed.data;
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const prompt = lastUserMessage?.content || '';

    let providerConfig: any;

    if (provider) {
      const configs = db.prepare(`
        SELECT * FROM provider_configs
        WHERE user_id = ? AND provider = ? AND enabled = 1
        ORDER BY priority DESC
        LIMIT 1
      `).get(userId, provider) as any;

      if (!configs) {
        sendEvent('error', { message: `No enabled provider config found for: ${provider}` });
        res.end();
        return;
      }
      providerConfig = configs;
    } else {
      const defaultConfig = db.prepare(`
        SELECT * FROM provider_configs
        WHERE user_id = ? AND enabled = 1
        ORDER BY priority DESC
        LIMIT 1
      `).get(userId) as any;

      if (!defaultConfig) {
        sendEvent('error', { message: 'No enabled provider config found' });
        res.end();
        return;
      }
      providerConfig = defaultConfig;
    }

    const sdkType = providerConfig.provider as SDKType;
    providerName = sdkType;
    modelName = model || providerConfig.model || undefined;

    const adapter = createProviderAdapter({
      id: providerConfig.id,
      userId: providerConfig.user_id,
      name: providerConfig.name,
      sdkType,
      baseURL: providerConfig.base_url,
      apiKey: providerConfig.api_key,
      defaultModel: providerConfig.model,
      createdAt: new Date(providerConfig.created_at),
      updatedAt: new Date(providerConfig.updated_at),
    });

    const chatMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    try {
      for await (const chunk of adapter.streamChat(chatMessages, { model: modelName })) {
        if (chunk.type === 'content' && chunk.content) {
          accumulatedContent += chunk.content;
          chunkCount++;
          sendEvent('chunk', { content: chunk.content, chunkIndex: chunkCount });
        } else if (chunk.type === 'done' && chunk.finalState) {
          modelName = chunk.finalState.model;
          if (!res.writableEnded) {
            endStream(accumulatedContent, providerName, modelName);
            return;
          }
        } else if (chunk.type === 'error' || chunk.errorMessage) {
          sendEvent('error', { message: chunk.errorMessage || 'Stream failed' });
          res.end();
          return;
        }
      }

      endStream(accumulatedContent, providerName, modelName);
    } catch (err: any) {
      sendEvent('error', { message: err?.message || 'Stream failed' });
      res.end();
    }
  };

  runStream().catch(() => {
    if (!res.writableEnded) {
      sendEvent('error', { message: 'Stream failed' });
      res.end();
    }
  });

  req.on('close', () => {
    if (!res.writableEnded) {
      res.end();
    }
  });
});