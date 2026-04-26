import {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ProviderConfig,
  StreamChunk,
} from "../core/provider-contract";

export class AnthropicAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly defaultModel: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || "https://api.anthropic.com";
    this.defaultModel = config.defaultModel || "claude-3-5-haiku-20240307";
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse> {
    const model = opts?.model || this.defaultModel;
    const body = {
      model,
      messages: this.translateMessages(messages),
      max_tokens: opts?.maxTokens || 4096,
      temperature: opts?.temperature ?? 1.0,
    };

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await this.translateError(response);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      model: string;
      usage: { input_tokens: number; output_tokens: number };
    };

    return {
      content: data.content[0]?.text || "",
      model: data.model,
      provider: "anthropic",
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    opts?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const model = opts?.model || this.defaultModel;
    const body = {
      model,
      messages: this.translateMessages(messages),
      max_tokens: opts?.maxTokens || 4096,
      temperature: opts?.temperature ?? 1.0,
      stream: true,
    };

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await this.translateError(response);
    }

    if (!response.body) {
      throw new Error("No response body available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalState: StreamChunk["finalState"] | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              finalState = { model };
              yield { type: "done", finalState };
              continue;
            }

            try {
              const event = JSON.parse(data) as {
                type: string;
                index?: number;
                delta?: { type: string; text?: string };
                usage?: { input_tokens: number; output_tokens: number };
                model?: string;
              };

              if (event.type === "content_block_delta" && event.delta?.text) {
                yield { type: "content", content: event.delta.text };
              } else if (event.type === "message_delta" && event.usage) {
                finalState = {
                  model: event.model || model,
                  usage: {
                    inputTokens: event.usage.input_tokens,
                    outputTokens: event.usage.output_tokens,
                  },
                };
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      if (buffer.startsWith("data: ") && buffer.includes("[DONE]")) {
        yield { type: "done", finalState };
      } else if (finalState) {
        yield { type: "done", finalState };
      }
    } finally {
      reader.releaseLock();
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
  }

  private translateMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : m.role,
      content: m.content,
    }));
  }

  private async translateError(response: Response): Promise<Error> {
    let message = `Anthropic API error: ${response.status}`;
    try {
      const data = await response.json() as { error?: { message?: string } };
      if (data?.error?.message) {
        message = data.error.message;
      }
    } catch {
      // Use default message
    }
    return new Error(message);
  }
}