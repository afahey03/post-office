# Post Office

Post Office is a lightweight, browser-based developer tool for two daily tasks:

- Formatting and validating JSON
- Testing HTTP APIs without leaving your browser

It is fast, account-free, and local-first.

## Why I Made It

- No desktop client or login required
- JSON formatter and API tester in one UI
- Keyboard-friendly workflows
- Direct request mode and proxy mode for CORS-challenging endpoints
- Built with modern, typed web tooling

## Feature Snapshot

### JSON Formatter

- Pretty print and minify
- Sort keys and strip empty fields
- Syntax highlighting and parse errors
- JSON metrics: key count, depth, and byte size
- One-click copy and shortcuts

### API Tester

- Supports all HTTP methods
- Query params, headers, and body editor
- Auth support: Bearer, Basic, API Key
- Response viewer with body, headers, timing, and size
- cURL import/export
- Timeout control and request history
- Save reusable requests locally

## Quick Start

### Prerequisites

- Node.js 20+

### Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Common commands

| Command | Purpose |
|---|---|
| npm run dev | Start local dev server |
| npm run build | Build production app |
| npm run start | Run production build |
| npm run lint | Run ESLint |
| npm run typecheck | Run TypeScript checks |
| npm test | Run unit tests |

## Optional Analytics and Public Counters

Post Office can track public usage counters (formats, API tests, visits) with Upstash Redis.

1. Duplicate .env.local.example as .env.local.

2. Fill values in .env.local:

```bash
UPSTASH_REDIS_REST_URL="https://<your-db>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<your-upstash-token>"
UPSTASH_RATE_LIMIT_ENABLED="true"
```

3. Deploy with the same variables in your hosting provider.

Counters use these Redis keys:

- stats:json_formats
- stats:api_tests
- stats:site_visits

## Project Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest
- Upstash Redis

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
