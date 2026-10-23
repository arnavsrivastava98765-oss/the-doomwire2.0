# Full-Stack Architecture Reference

## Standard Directory Structure
```text
src/
├── client/          # Frontend application (React, Vue, or Vanilla)
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Custom data-fetching & state hooks
│   ├── pages/       # Route views
│   └── styles/      # Global styles and design tokens
├── server/          # Backend application (Node/Express or FastAPI)
│   ├── routes/      # Endpoint routing definitions
│   ├── controllers/ # Request/response orchestration
│   ├── services/    # Pure business logic
│   └── models/      # Data models and database schemas
└── shared/          # Shared types, Zod/Pydantic schemas, constants
```

## State & Data Flow Principles
- Single source of truth for shared state.
- Validate inputs at boundaries (HTTP requests, URL params, forms).
- Never leak database connection details or server environment variables to client bundles.
