# EasyChat TOOLS.md

## Development Tools

### Prerequisites
- Node.js 18+
- npm or pnpm

### Core Stack
- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Node.js 18+ (Express or Hono)
- **Language**: TypeScript throughout

### Key Libraries
- `ai` (Vercel) - Provider abstraction and streaming utilities
- `sse` - Server-sent events for streaming
- `zod` - Schema validation
- `jose` - JWT handling

## Project Structure

```
easychat/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Node.js backend
├── packages/
│   ├── provider-core/    # Provider adapter interfaces
│   ├── ui/               # Shared UI components
│   └── types/            # Shared TypeScript types
├── HEARTBEAT.md          # Project status
├── SOUL.md               # Architecture & principles
├── TOOLS.md              # This file
└── README.md
```

## Commands

```bash
# Install dependencies
npm install

# Development
npm run dev              # All apps
npm run dev:web          # Frontend only
npm run dev:api          # Backend only

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode

# Linting
npm run lint             # ESLint + type check

# Build
npm run build            # Production build
```

## Provider Development

### Adding a New Provider

1. Create adapter in `packages/provider-adapters/`
2. Implement `IProviderAdapter` interface
3. Add tests in `__tests__/`
4. Register in provider registry

```typescript
// packages/provider-adapters/my-provider/index.ts
export class MyProviderAdapter implements IProviderAdapter {
  name = 'my-provider';

  async complete(request: ChatRequest): Promise<ChatResponse> {
    // Implementation
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamEvent> {
    // Implementation
  }
}
```

## Environment Variables

```env
# API Keys (never commit these)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your-secret-here
```

## Code Standards

- TypeScript strict mode
- No `any` types
- All functions typed
- Tests required for adapters
- ESLint + Prettier enforced

## Review Checklist

- [ ] Provider adapter tests pass
- [ ] Streaming works end-to-end
- [ ] No API keys in logs
- [ ] Error messages are user-friendly
- [ ] TypeScript compiles without errors
- [ ] Accessibility: keyboard nav, screen reader