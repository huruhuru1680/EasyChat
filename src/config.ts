import { z } from 'zod';

const configSchema = z.object({
  PORT: z.string().default('3001'),
  JWT_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z.string().default('12'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function getSecretFromEnvOrPaperclip(key: string): string | undefined {
  return process.env[key] || process.env[`PAPERCLIP_SECRETS_${key}`];
}

const rawEnv = {
  PORT: process.env.PORT,
  JWT_SECRET: getSecretFromEnvOrPaperclip('JWT_SECRET'),
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
  NODE_ENV: process.env.NODE_ENV,
};

const parsed = configSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;