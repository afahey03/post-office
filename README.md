# Post Office

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Functionality](#functionality)
- [Running Locally](#running-locally)
- [Contribution Instructions](#contribution-instructions)
- [Examples](#examples)

## Description

Post Office is a browser-based developer tool that combines a JSON formatter and an HTTP API tester in one place. It is designed to be fast, keyboard-friendly, and dependency-light - no account required, no data sent to third-party servers.

## Tech Stack

- Next.js
- TypeScript
- Tailwind

## Functionality

### JSON Formatter
- Paste raw JSON -> instant format with syntax highlighting
- Indent control
- Minify mode
- Sort keys toggle
- Strip empty fields toggle
- Parse error display with clear messaging
- JSON stats: key count, nesting depth, byte size
- One-click copy
- Keyboard shortcuts for minify/copy

### API Tester
- All HTTP methods
- Query params editor with live URL preview
- Custom headers
- Request body editor
- Auth: Bearer Token, Basic Auth, API Key
- Response view: formatted JSON body, headers, request info
- Response controls: copy, download, raw/pretty toggle
- Response time + size metrics
- Quick-load presets
- Request timeout control (direct + proxy)
- cURL import and cURL export
- Recent request history (session)
- Saved requests collections (local)
- Keyboard shortcut to send request

## Running Locally

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Other available commands:

| Command | Description |
|---|---|
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checks |
| `npm test` | Run tests |

## Contribution Instructions

1. Fork the repository and create a feature branch from `main`.
2. Install dependencies with `npm install`.
3. Make your changes and ensure all checks pass:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. Open a pull request against `main` with a clear description of what was changed and why.

Please keep pull requests focused - one feature or fix per PR.

## Examples

### JSON Formatter

1. Validate and format API payload

Paste:

```json
{"user":{"id":42,"name":"Aidan"},"active":true,"tags":["dev","qa"]}
```

Set indent to `2 spaces` and get readable output with syntax highlighting and stats.

2. Normalize object structure before sharing

Paste JSON with mixed key order, then enable:
- `Sort keys`
- `Strip empty`

This is useful for clean diffs in PRs and consistent snapshots in tests.

3. Compact large JSON for transport

Use `Minify` to convert pretty JSON into a compact one-line payload for query params, logs, or lightweight storage.

4. Keyboard-driven workflow

- `Ctrl/Cmd + Shift + M`: toggle minify
- `Ctrl/Cmd + Shift + C`: copy output

### API Tester

1. Quick GET request with query params

- Method: `GET`
- URL: `https://jsonplaceholder.typicode.com/posts`
- Params:
	- `userId = 1`

Review formatted response body, headers, status, response time, and size.

2. Authenticated POST JSON request

- Method: `POST`
- URL: `https://httpbin.org/post`
- Headers: `X-Trace-Id: demo-001`
- Auth: `Bearer Token`
- Body Content-Type: `application/json`
- Body:

```json
{
	"title": "Post Office Demo",
	"priority": "high"
}
```

3. Use proxy mode for CORS-blocked endpoints

Enable `Use server proxy` when direct browser requests fail due to CORS. The proxy keeps localhost/private-network safeguards in place.

4. cURL import/export

Import:

```bash
curl -X POST -H "Content-Type: application/json" --data-raw '{"name":"demo"}' https://httpbin.org/post
```

Then use `Copy cURL` to export the current request state back to terminal-friendly format.

5. Timeout tuning for unstable endpoints

Set `Timeout (ms)` (for example `10000`) before sending. Useful for quickly identifying slow or non-responsive APIs.

6. Reuse requests with history and collections

- `Recent history`: reload recently sent requests (session-scoped)
- `Save request as...`: persist named requests in local collections

This makes repeated debugging and regression checks much faster.

7. Response tools

- `Copy body`
- `Download`
- `Pretty/Raw` toggle for JSON responses

Great for sharing payloads in tickets, reproducing issues, and comparing response shapes.

8. Keyboard shortcut to send

- `Ctrl/Cmd + Enter`: send request