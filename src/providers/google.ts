import {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ProviderConfig,
  StreamChunk,
} from "../core/provider-contract";
import { GoogleGenerativeAI, GenerateContentStreamResult, Part } from "@google/generative-ai";

export class GoogleGenAIAdapter implements AIProvider {
  private readonly client: GoogleGenerativeAI;
  private readonly defaultModel: string;

  constructor(config: ProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.defaultModel = config.defaultModel || "gemini-1.5-flash";
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse> {
    const model = opts?.model || this.defaultModel;
    const contents = this.translateMessages(messages);

    const result = await this.client.getGenerativeModel({ model }).generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: opts?.maxTokens,
        temperature: opts?.temperature,
      },
    });

    const response = result.response;
    const text = response.text();
    const usageMetadata = response.usageMetadata;

    return {
      content: text,
      model,
      provider: "google",
      usage: usageMetadata
        ? {
            inputTokens: usageMetadata.promptTokenCount || 0,
            outputTokens: usageMetadata.candidatesTokenCount || 0,
          }
        : undefined,
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    opts?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const model = opts?.model || this.defaultModel;
    const contents = this.translateMessages(messages);

    const result: GenerateContentStreamResult = await this.client
      .getGenerativeModel({ model })
      .generateContentStream({
        contents,
        generationConfig: {
          maxOutputTokens: opts?.maxTokens,
          temperature: opts?.temperature,
        },
      });

    let finalState: StreamChunk["finalState"] | undefined;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { type: "content", content: text };
      }
      const usageMetadata = chunk.usageMetadata;
      if (usageMetadata) {
        finalState = {
          model,
          usage: {
            inputTokens: usageMetadata.promptTokenCount || 0,
            outputTokens: usageMetadata.candidatesTokenCount || 0,
          },
        };
      }
    }

    const finalResult = await result.response;
    const finalUsage = finalResult.usageMetadata;
    if (finalUsage) {
      finalState = {
        model,
        usage: {
          inputTokens: finalUsage.promptTokenCount || 0,
          outputTokens: finalUsage.candidatesTokenCount || 0,
        },
      };
    }

    yield { type: "done", finalState };
  }

  private translateMessages(messages: ChatMessage[]): Array<{ role: string; parts: Part[] }> {
    const contents: Array<{ role: string; parts: Part[] }> = [];
    for (const msg of messages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
    return contents;
  }
}