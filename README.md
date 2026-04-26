# EasyChat

A clean, provider-agnostic AI chat interface with ChatGPT-quality UX and a pluggable multi-provider backend.

## Quick Start

```bash
npm install
npm run dev
```

## Project Documentation

- [HEARTBEAT.md](./HEARTBEAT.md) - Project status and milestones
- [SOUL.md](./SOUL.md) - Architecture and core principles
- [TOOLS.md](./TOOLS.md) - Development tools and commands

## Architecture

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

## Providers

Bring your own API key. EasyChat supports:

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google Gemini

## Development

See [TOOLS.md](./TOOLS.md) for detailed development commands and standards.