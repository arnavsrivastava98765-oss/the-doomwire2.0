---
name: fullstack-dev
description: Rapid full-stack application lifecycle, architecture selection, clean separation of concerns, API routes, and database integrations. Use when building or refactoring full-stack features.
---

# Full-Stack Development

Accelerated procedure for implementing production-ready full-stack features.

## Workflow

1. **Architecture & Contract First**:
   - Define data schemas and API contracts (TypeScript interfaces, Zod schemas, or Pydantic models) before writing UI or database queries.
   - Maintain clear separation: Client UI -> API Routes/Controllers -> Service Layer -> Data Access.

2. **Backend Implementation**:
   - Implement handlers with input validation, explicit error handling, and appropriate HTTP status codes.
   - Keep route handlers thin; delegate business logic to modular service functions.

3. **Frontend Integration**:
   - Use typed API clients or hooks for data fetching.
   - Handle all states: Loading, Success, Empty, and Error with recovery options.

4. **Verification**:
   - Run API endpoint tests or run a quick curl/script verification.
   - Verify TypeScript compilation: `npx tsc --noEmit`.
   - Run build check: `npm run build`.

See [architecture.md](./references/architecture.md) for full-stack pattern references.
