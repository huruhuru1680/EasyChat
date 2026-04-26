export interface ProviderConfig {
  id: string;
  user_id: string;
  provider: 'openai' | 'anthropic' | 'google';
  name: string;
  api_key: string | null;
  base_url: string | null;
  model: string | null;
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderInput {
  provider: ProviderConfig['provider'];
  name: string;
  api_key?: string;
  base_url?: string;
  model?: string;
  priority?: number;
  enabled?: boolean;
}

export interface UpdateProviderInput extends Partial<CreateProviderInput> {}

export const PROVIDER_LABELS: Record<ProviderConfig['provider'], string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
};

export const PROVIDER_MODELS: Record<ProviderConfig['provider'], string[]> = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-latest'],
  google: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
};