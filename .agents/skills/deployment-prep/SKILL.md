---
name: deployment-prep
description: Zero-downtime production builds, containerization, environment checklists, and CI/CD automation. Use when preparing code for deployment or release.
---

# Deployment Preparation

Checklists and verification procedures for taking applications to production.

## Pre-Deployment Verification Checklist
1. **Production Build**:
   - Run `npm run build` or `python -m build`. Ensure exit code 0 and zero TypeScript/lint errors.
2. **Environment Configuration**:
   - Verify all variables referenced in code exist in `.env.example`.
   - Ensure development URLs (`localhost`) are not hardcoded in production bundles.
3. **Containerization (Docker)**:
   - Use multi-stage builds to minimize image footprint.
   - Run as non-root user (`USER node` or `USER appuser`).
   - Use `.dockerignore` to exclude `node_modules`, `.git`, `.env`.
4. **Health Checks**:
   - Ensure an active `/health` or `/api/health` endpoint returns `{ status: "ok" }`.
