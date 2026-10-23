---
name: performance-profiling
description: Latency reduction, bundle size optimization, query optimization, memory leak detection, and Core Web Vitals profiling. Use when optimizing application speed.
---

# Performance Profiling & Optimization

Techniques for profiling and speeding up frontend and backend applications.

## Frontend Optimization
- **Bundle Size**: Inspect output chunks from `npm run build`. Avoid importing whole utility libraries (`lodash` -> `lodash/get` or native methods).
- **Asset Loading**: Compress images, use WebP/AVIF formats, and lazy-load non-critical media.
- **Rendering**: Prevent unnecessary React re-renders with `React.memo`, `useMemo`, and stable callback references.
- **CLS & LCP**: Specify explicit `width` and `height` on images and reserve space for dynamic content to prevent layout shifts.

## Backend & Database Optimization
- **N+1 Queries**: Eager-load relational data with `include`/`select_related` instead of queries inside loops.
- **Indexing**: Ensure frequently filtered or joined columns have database indices.
- **Caching**: Implement HTTP cache-control headers (`stale-while-revalidate`) and in-memory caching for expensive queries.
- **Async Execution**: Offload heavy background work to async queues or background tasks.
