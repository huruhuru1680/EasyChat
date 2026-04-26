import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDb } from '../db';
import { env } from '../config';

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

function generateId(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(16).toString('hex');
}

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }

  const { username, password } = parsed.data;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  const role = count.cnt === 0 ? 'admin' : 'user';
  const approved = count.cnt === 0 ? 1 : 0;

  const id = generateId();
  const passwordHash = bcrypt.hashSync(password, parseInt(env.BCRYPT_ROUNDS));

  db.prepare(
    'INSERT INTO users (id, username, password_hash, role, approved) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username, passwordHash, role, approved);

  const token = jwt.sign({ userId: id, role }, env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    user: { id, username, role, approved: !!approved },
    token,
  });
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const { username, password } = parsed.data;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
    id: string;
    username: string;
    password_hash: string;
    role: string;
    approved: number;
  } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!user.approved) {
    res.status(403).json({ error: 'Account pending approval' });
    return;
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    user: { id: user.id, username: user.username, role: user.role, approved: true },
    token,
  });
});

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

authRouter.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const { userId } = (req as any).user;
  const user = db.prepare('SELECT id, username, role, approved, created_at FROM users WHERE id = ?').get(userId) as {
    id: string;
    username: string;
    role: string;
    approved: number;
    created_at: string;
  } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user: { ...user, approved: !!user.approved } });
});