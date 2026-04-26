import { hashSync, compareSync } from 'bcrypt';
import { randomBytes } from 'crypto';

describe('Auth domain logic', () => {
  describe('password hashing', () => {
    it('hashes and verifies passwords correctly', () => {
      const password = 'testpassword123';
      const hash = hashSync(password, 4);
      expect(compareSync(password, hash)).toBe(true);
      expect(compareSync('wrongpassword', hash)).toBe(false);
    });

    it('generates unique hashes for same password', () => {
      const password = 'testpassword123';
      const hash1 = hashSync(password, 4);
      const hash2 = hashSync(password, 4);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('ID generation', () => {
    it('generates 32-character hex IDs', () => {
      const id = randomBytes(16).toString('hex');
      expect(id).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(id)).toBe(true);
    });
  });
});