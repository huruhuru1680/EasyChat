import { z } from 'zod';

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

describe('Conversations schema validation', () => {
  describe('createConversationSchema', () => {
    it('accepts valid title', () => {
      const result = createConversationSchema.safeParse({ title: 'My Chat' });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createConversationSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects title over 256 chars', () => {
      const result = createConversationSchema.safeParse({ title: 'a'.repeat(257) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateConversationSchema', () => {
    it('accepts valid title', () => {
      const result = updateConversationSchema.safeParse({ title: 'Updated Chat' });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = updateConversationSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('createMessageSchema', () => {
    it('accepts valid message with required fields only', () => {
      const result = createMessageSchema.safeParse({ role: 'user', content: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('accepts message with all optional fields', () => {
      const result = createMessageSchema.safeParse({
        role: 'assistant',
        content: 'Hi there',
        provider: 'openai',
        model: 'gpt-4',
        tokens: 42,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const result = createMessageSchema.safeParse({ role: 'admin', content: 'Hello' });
      expect(result.success).toBe(false);
    });

    it('rejects empty content', () => {
      const result = createMessageSchema.safeParse({ role: 'user', content: '' });
      expect(result.success).toBe(false);
    });

    it('rejects negative tokens', () => {
      const result = createMessageSchema.safeParse({ role: 'user', content: 'Hi', tokens: -1 });
      expect(result.success).toBe(false);
    });
  });
});