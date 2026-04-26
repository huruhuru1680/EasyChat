# EasyChat SOUL.md

## What We Are Building

A clean, provider-agnostic AI chat interface with ChatGPT-quality UX and a pluggable multi-provider backend.

## Core Principles

### 1. Provider Agnosticism
- All provider integrations go through a unified `IProviderAdapter` interface
- No provider-specific logic in core business logic
- New providers added via adapters, not core changes

### 2. Stable Streaming
- SSE-based streaming with consistent event format across providers
- Graceful degradation when provider streaming fails
- Visual streaming indicators for user feedback

### 3. Conversation Continuity
- Message history persisted locally and optionally synced
- Conversation context maintained across sessions
- Provider-agnostic conversation format

### 4. Debuggable Failures
- Structured error responses with provider attribution
- Request/response logging for debugging
- Clear user-facing error messages

### 5. Security First
- API keys stored in environment variables, never in code
- No credentials in frontend or logs
- Secrets rotation support

## Technical Boundaries

### Backend Owns
- Provider adapter interface contracts
- Streaming response normalization
- Message/conversation persistence
- API key management
- Auth/session handling

### Frontend Owns
- Chat UI/UX implementation
- Provider selection interface
- Local state management
- User experience polishing

### Shared Contracts
- Provider adapter interface (`/packages/provider-core`)
- Chat message schema
- Streaming event schema

## Non-Goals

- No built-in provider; always pluggable
- No database opinion; adapter-based persistence
- No opinionated auth; pluggable auth strategy

## Success Definition

- User can chat with any configured provider
- Streaming feels native and responsive
- Conversations persist across sessions
- Adding a new provider requires only an adapter
- No provider outage takes down the app

## Architecture Notes

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
├─────────────────────────────────────────┤
│        Provider Selection UI            │
│        Chat Interface                   │
└──────────────────┬──────────────────────┘
                   │ HTTP/SSE
┌──────────────────▼──────────────────────┐
│          Backend (Node.js)              │
├─────────────────────────────────────────┤
│    ProviderRouter (selects adapter)     │
│    StreamingHandler (normalizes SSE)    │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ OpenAI  │ │ Anthropic│ │  Gemini │   │
│  │ Adapter │ │ Adapter │ │ Adapter │   │
│  └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────┘
```

## Provider Adapter Contract

```typescript
interface IProviderAdapter {
  name: string;
  capabilities: ProviderCapabilities;

  // Send a chat completion request
  complete(request: ChatRequest): Promise<ChatResponse>;

  // Stream a chat completion
  stream(request: ChatRequest): AsyncGenerator<StreamEvent>;

  // Validate API key
  validateKey(apiKey: string): Promise<boolean>;

  // Map provider-specific errors to standard error types
  mapError(error: ProviderError): StandardError;
}

interface ChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
}

interface StreamEvent {
  type: 'content' | 'done' | 'error';
  delta?: string;
  error?: StandardError;
}
```

## Error Handling Strategy

1. Provider errors caught at adapter level
2. Mapped to `StandardError` with provider attribution
3. Frontend receives consistent error shape
4. User sees friendly message; details logged server-side

## Security Model

- API keys: env vars only, never logged
- User messages: stored per conversation settings
- Provider responses: logged for debugging (PII stripped)
- Session tokens: signed JWTs with short expiry