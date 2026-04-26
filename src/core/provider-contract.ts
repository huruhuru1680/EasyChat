/**
 * Provider-agnostic AI Provider Interface Contract
 *
 * This contract defines the shape of AI providers used by EasyChat.
 * Providers must not leak their own types into this interface.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface StreamChunk {
  type: "content" | "done" | "error";
  content?: string;
  finalState?: {
    model: string;
    usage?: { inputTokens: number; outputTokens: number };
  };
  errorMessage?: string;
}

export interface AIProvider {
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[], opts?: ChatOptions): AsyncGenerator<StreamChunk, void, unknown>;
}

export type SDKType = "anthropic" | "openai" | "google";

export interface ProviderConfig {
  id: string;
  userId: string;
  name: string;
  sdkType: SDKType;
  baseURL?: string;
  apiKey: string;
  defaultModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderAdapter {
  new (config: ProviderConfig): AIProvider;
}