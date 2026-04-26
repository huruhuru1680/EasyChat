import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { authenticate } from './auth';

export const providersRouter = Router();

providersRouter.use(authenticate);

const providerConfigSchema = z.object({
  provider: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  api_key: z.string().optional(),
  base_url: z.string().url().optional().or(z.literal('')),
  model: z.string().optional(),
  priority: z.number().int().min(0).max(1000).default(0),
  enabled: z.boolean().default(true),
});

const updateProviderConfigSchema = providerConfigSchema.partial();

function generateId(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(16).toString('hex');
}

providersRouter.post('/', (req, res) => {
  const parsed = providerConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const { userId } = (req as any).user;
  const db = getDb();

  const existing = db.prepare(
    'SELECT id FROM provider_configs WHERE user_id = ? AND provider = ? AND name = ?'
  ).get(userId, parsed.data.provider, parsed.data.name);

  if (existing) {
    res.status(409).json({ error: 'Provider config with this name already exists' });
    return;
  }

  const id = generateId();
  const { api_key, base_url, model, priority, enabled } = parsed.data;

  db.prepare(`
    INSERT INTO provider_configs (id, user_id, provider, name, api_key, base_url, model, priority, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, parsed.data.provider, parsed.data.name, api_key || null, base_url || null, model || null, priority, enabled ? 1 : 0);

  const config = db.prepare('SELECT * FROM provider_configs WHERE id = ?').get(id) as any;

  res.status(201).json({ provider_config: formatConfig(config) });
});

providersRouter.get('/', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const configs = db.prepare(
    'SELECT * FROM provider_configs WHERE user_id = ? ORDER BY priority DESC, created_at DESC'
  ).all(userId) as any[];

  res.json({ provider_configs: configs.map(formatConfig) });
});

providersRouter.get('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const config = db.prepare(
    'SELECT * FROM provider_configs WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId) as any;

  if (!config) {
    res.status(404).json({ error: 'Provider config not found' });
    return;
  }

  res.json({ provider_config: formatConfig(config) });
});

providersRouter.put('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const parsed = updateProviderConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const db = getDb();

  const existing = db.prepare(
    'SELECT * FROM provider_configs WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ error: 'Provider config not found' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (parsed.data.provider !== undefined) {
    fields.push('provider = ?');
    values.push(parsed.data.provider);
  }
  if (parsed.data.name !== undefined) {
    fields.push('name = ?');
    values.push(parsed.data.name);
  }
  if (parsed.data.api_key !== undefined) {
    fields.push('api_key = ?');
    values.push(parsed.data.api_key || null);
  }
  if (parsed.data.base_url !== undefined) {
    fields.push('base_url = ?');
    values.push(parsed.data.base_url || null);
  }
  if (parsed.data.model !== undefined) {
    fields.push('model = ?');
    values.push(parsed.data.model || null);
  }
  if (parsed.data.priority !== undefined) {
    fields.push('priority = ?');
    values.push(parsed.data.priority);
  }
  if (parsed.data.enabled !== undefined) {
    fields.push('enabled = ?');
    values.push(parsed.data.enabled ? 1 : 0);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  fields.push("updated_at = datetime('now')");
  values.push(req.params.id, userId);

  db.prepare(`
    UPDATE provider_configs SET ${fields.join(', ')} WHERE id = ? AND user_id = ?
  `).run(...values);

  const updated = db.prepare('SELECT * FROM provider_configs WHERE id = ?').get(req.params.id) as any;

  res.json({ provider_config: formatConfig(updated) });
});

providersRouter.delete('/:id', (req, res) => {
  const { userId } = (req as any).user;
  const db = getDb();

  const existing = db.prepare(
    'SELECT id FROM provider_configs WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);

  if (!existing) {
    res.status(404).json({ error: 'Provider config not found' });
    return;
  }

  db.prepare('DELETE FROM provider_configs WHERE id = ? AND user_id = ?').run(req.params.id, userId);

  res.status(204).send();
});

function formatConfig(config: any): any {
  return {
    id: config.id,
    user_id: config.user_id,
    provider: config.provider,
    name: config.name,
    api_key: config.api_key,
    base_url: config.base_url,
    model: config.model,
    priority: config.priority,
    enabled: !!config.enabled,
    created_at: config.created_at,
    updated_at: config.updated_at,
  };
}