import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { authenticate } from './auth';

export const messagesRouter = Router();

messagesRouter.use(authenticate);

const createMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  provider: z.string().optional(),
  model: z.string().optional(),
  tokens: z.number().int().positive().optional(),
});

function generateId(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(16).toString('hex');
}

messagesRouter.post('/', (req, res) => {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const { userId } = (req as any).user;
  const db = getDb();

  const conversation = db.prepare(
    'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.body.conversation_id, userId);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const id = generateId();
  const { role, content, provider, model, tokens } = parsed.data;

  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, provider, model, tokens)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.body.conversation_id, role, content, provider || null, model || null, tokens || null);

  db.prepare(`
    UPDATE conversations SET updated_at = datetime('now') WHERE id = ?
  `).run(req.body.conversation_id);

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;

  res.status(201).json({ message: formatMessage(message) });
});

messagesRouter.get('/by-conversation/:conversationId', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const conversation = db.prepare(
    'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.conversationId, userId);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const limit = Math.min(parseInt(String(req.query.limit || '100')), 500);
  const offset = Math.max(parseInt(String(req.query.offset || '0')), 0);

  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
    LIMIT ? OFFSET ?
  `).all(req.params.conversationId, limit, offset) as any[];

  const countResult = db.prepare(
    'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?'
  ).get(req.params.conversationId) as { total: number };

  res.json({
    messages: messages.map(formatMessage),
    total: countResult.total,
    limit,
    offset,
  });
});

messagesRouter.get('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const message = db.prepare(`
    SELECT m.* FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE m.id = ? AND c.user_id = ?
  `).get(req.params.id, userId) as any;

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  res.json({ message: formatMessage(message) });
});

messagesRouter.delete('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const message = db.prepare(`
    SELECT m.*, c.user_id as owner FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE m.id = ? AND c.user_id = ?
  `).get(req.params.id, userId) as any;

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);

  db.prepare(`
    UPDATE conversations SET updated_at = datetime('now') WHERE id = ?
  `).run(message.conversation_id);

  res.status(204).send();
});

function formatMessage(message: any): any {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    role: message.role,
    content: message.content,
    provider: message.provider,
    model: message.model,
    tokens: message.tokens,
    created_at: message.created_at,
  };
}