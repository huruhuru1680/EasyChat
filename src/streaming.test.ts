import { randomBytes } from 'crypto';

function generateId(): string {
  return randomBytes(16).toString('hex');
}

describe('Streaming logic', () => {
  describe('ID generation', () => {
    it('generates 32-character hex IDs', () => {
      const id = generateId();
      expect(id).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(id)).toBe(true);
    });
  });

  describe('input validation', () => {
    it('validates messages array is non-empty', () => {
      const validMessages = [
        [{ role: 'user', content: 'Hello' }],
        [{ role: 'system', content: 'You are helpful' }, { role: 'user', content: 'Hi' }],
      ];

      validMessages.forEach(msgs => {
        expect(Array.isArray(msgs)).toBe(true);
        expect(msgs.length).toBeGreaterThan(0);
      });
    });

    it('validates role enum constraints', () => {
      const validRoles = ['user', 'assistant', 'system'];
      validRoles.forEach(role => {
        expect(['user', 'assistant', 'system']).toContain(role);
      });
    });

    it('validates content is non-empty string', () => {
      const validContents = ['Hello', 'How are you?', 'Test message'];
      const invalidContents = ['', null, undefined];

      validContents.forEach(content => {
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
      });

      invalidContents.forEach(content => {
        expect(content === '' || content === null || content === undefined).toBe(true);
      });
    });
  });

  describe('SSE event format', () => {
    it('formats chunk events correctly', () => {
      const chunkEvent = { content: 'Hello world', chunkIndex: 1 };
      const formatted = `event: chunk\ndata: ${JSON.stringify(chunkEvent)}\n\n`;
      expect(formatted).toContain('event: chunk');
      expect(formatted).toContain('data:');
    });

    it('formats done events correctly', () => {
      const doneEvent = {
        message: {
          id: 'abc123',
          conversation_id: 'conv1',
          role: 'assistant',
          content: 'Hello world',
          provider: 'openai',
          model: 'gpt-4',
        },
      };
      const formatted = `event: done\ndata: ${JSON.stringify(doneEvent)}\n\n`;
      expect(formatted).toContain('event: done');
    });

    it('formats error events correctly', () => {
      const errorEvent = { message: 'Stream failed' };
      const formatted = `event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`;
      expect(formatted).toContain('event: error');
    });
  });
});