import OpenAI from "openai";
import {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ProviderConfig,
  StreamChunk,
} from "../core/provider-contract";

export class OpenAIAdapter implements AIProvider {
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(config: ProviderConfig) {
    const baseURL = config.baseURL || "https://api.openai.com/v1";
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL,
    });
    this.defaultModel = config.defaultModel || "gpt-4o-mini";
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse> {
    const model = opts?.model || this.defaultModel;
    const response = await this.client.chat.completions.create({
      model,
      messages: this.translateMessages(messages),
      max_tokens: opts?.maxTokens,
      temperature: opts?.temperature,
    });

    const choice = response.choices[0];
    return {
      content: choice?.message?.content || "",
      model: response.model,
      provider: "openai",
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    opts?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const model = opts?.model || this.defaultModel;
    const stream = await this.client.chat.completions.create({
      model,
      messages: this.translateMessages(messages),
      max_tokens: opts?.maxTokens,
      temperature: opts?.temperature,
      stream: true,
    });

    let finalState: StreamChunk["finalState"] | undefined;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield { type: "content", content: delta };
      }
      if (chunk.usage) {
        finalState = {
          model: chunk.model,
          usage: {
            inputTokens: chunk.usage.prompt_tokens,
            outputTokens: chunk.usage.completion_tokens,
          },
        };
      }
    }

    yield { type: "done", finalState };
  }

  private translateMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })) as OpenAI.Chat.ChatCompletionMessageParam[];
  }
}