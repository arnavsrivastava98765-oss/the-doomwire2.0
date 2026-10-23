---
name: api-documentation
description: Real-time API verification, framework version checking (React 19, Next 15, Vite 6, Node 24, Python 3.15), and hallucination prevention. Use when referencing external libraries or APIs.
---

# API & Framework Documentation Research

Procedures for verifying API signatures and preventing outdated or hallucinated API usage.

## Verification Protocol
1. **Detect Version**:
   - Check `package.json` or `pyproject.toml` to identify the exact installed version of the target library.
   - Be aware of major API shifts (e.g., React 19 Actions/Hooks, Next.js 15 async Request APIs, Tailwind CSS v4 CSS-first config).

2. **Targeted Retrieval**:
   - Use `read_url_content` on authoritative documentation sites (e.g., MDN, official docs).
   - Use `search_web` with specific search terms: `"<library> <version> <function> example"` to confirm exact parameters.

3. **Zero Assumption Rule**:
   - Never guess optional parameters or method signatures for recent framework releases.
   - Verify against real typings in `node_modules/<package>/dist/index.d.ts` when available.
