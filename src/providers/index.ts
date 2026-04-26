import { AIProvider, ProviderConfig, SDKType, ProviderAdapter } from "../core/provider-contract";
import { AnthropicAdapter } from "./anthropic";
import { OpenAIAdapter } from "./openai";
import { GoogleGenAIAdapter } from "./google";

export { AnthropicAdapter } from "./anthropic";
export { OpenAIAdapter } from "./openai";
export { GoogleGenAIAdapter } from "./google";

const adapterMap: Record<SDKType, ProviderAdapter> = {
  anthropic: AnthropicAdapter,
  openai: OpenAIAdapter,
  google: GoogleGenAIAdapter,
};

export function createProviderAdapter(config: ProviderConfig): AIProvider {
  const Adapter = adapterMap[config.sdkType];
  if (!Adapter) {
    throw new Error(`Unsupported SDK type: ${config.sdkType}`);
  }
  return new Adapter(config);
}

export function isValidSDKType(type: string): type is SDKType {
  return type === "anthropic" || type === "openai" || type === "google";
}