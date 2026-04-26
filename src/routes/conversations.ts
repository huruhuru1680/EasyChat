import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { authenticate } from './auth';

export const conversationsRouter = Router();

conversationsRouter.use(authenticate);

const createConversationSchema = z.object({
  title: z.string().min(1).max(256),
});

const updateConversationSchema = z.object({
  title: z.string().min(1).max(256),
});

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

conversationsRouter.post('/', (req, res) => {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const { userId } = (req as any).user;
  const db = getDb();

  const id = generateId();
  const { title } = parsed.data;

  db.prepare(`
    INSERT INTO conversations (id, user_id, title)
    VALUES (?, ?, ?)
  `).run(id, userId, title);

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;

  res.status(201).json({ conversation: formatConversation(conversation) });
});

conversationsRouter.get('/', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const limit = Math.min(parseInt(String(req.query.limit || '50')), 100);
  const offset = Math.max(parseInt(String(req.query.offset || '0')), 0);

  const conversations = db.prepare(`
    SELECT * FROM conversations
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as any[];

  const countResult = db.prepare(
    'SELECT COUNT(*) as total FROM conversations WHERE user_id = ?'
  ).get(userId) as { total: number };

  res.json({
    conversations: conversations.map(formatConversation),
    total: countResult.total,
    limit,
    offset,
  });
});

conversationsRouter.get('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const conversation = db.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId) as any;

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).all(req.params.id) as any[];

  res.json({
    conversation: formatConversation(conversation),
    messages: messages.map(formatMessage),
  });
});

conversationsRouter.put('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const parsed = updateConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const db = getDb();

  const existing = db.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  db.prepare(`
    UPDATE conversations
    SET title = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(parsed.data.title, req.params.id, userId);

  const updated = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id) as any;

  res.json({ conversation: formatConversation(updated) });
});

conversationsRouter.delete('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const existing = db.prepare(
    'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);

  if (!existing) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(req.params.id, userId);

  res.status(204).send();
});

conversationsRouter.post('/:id/messages', (req, res) => {
  const { userId } = (req as any).user;
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const db = getDb();

  const conversation = db.prepare(
    'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const id = generateId();
  const { role, content, provider, model, tokens } = parsed.data;

  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, provider, model, tokens)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, role, content, provider || null, model || null, tokens || null);

  db.prepare(`
    UPDATE conversations SET updated_at = datetime('now') WHERE id = ?
  `).run(req.params.id);

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
  res.status(201).json({ message: formatMessage(message) });
});

conversationsRouter.get('/:id/messages', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const conversation = db.prepare(
    'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);

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
  `).all(req.params.id, limit, offset) as any[];

  const countResult = db.prepare(
    'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?'
  ).get(req.params.id) as { total: number };

  res.json({
    messages: messages.map(formatMessage),
    total: countResult.total,
    limit,
    offset,
  });
});

function formatConversation(conversation: any): any {
  return {
    id: conversation.id,
    user_id: conversation.user_id,
    title: conversation.title,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
  };
}

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