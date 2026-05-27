# Collaboration Guide

This document explains how we collaborate on Post Office so contributions stay
fast, friendly, and easy to review.

## Principles

- Keep changes focused and incremental
- Prefer clarity over cleverness
- Optimize for maintainability and testability
- Assume positive intent in reviews

## Branching

- Create a feature branch from main
- Use descriptive names, for example:
  - feat/json-error-summary
  - fix/proxy-timeout-validation
  - docs/readme-refresh

## Issue to PR Flow

1. Discuss scope in an issue when the change is larger than a quick fix.
2. Keep implementation aligned with agreed scope.
3. Open a pull request early if feedback would help.
4. Mark PR as ready when checks and description are complete.

## Review Expectations

- Review for behavior, correctness, and readability first
- Prefer actionable suggestions over broad criticism
- Keep PR conversations tied to code or user impact
- Approve when the change is safe and understandable

## Quality Bar

Before merge, contributors should run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentation

Update docs when you change:

- User-facing behavior
- Developer workflow
- Environment configuration

## Security and Privacy

- Never commit secrets
- Validate and sanitize user-provided input in routes
- Keep local-first behavior where possible and document analytics clearly

## Community

All collaboration follows CODE_OF_CONDUCT.md.