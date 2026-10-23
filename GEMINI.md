# Antigravity Workspace Guidelines: Dazyyy vr-3.4

These workspace rules optimize pair programming, execution speed, code quality, and testing for this project.

## 1. Speed & Execution Principles
- Prioritize the fastest path to a correct, working, and verified solution.
- Inspect files with precision: use `grep_search` and targeted slices of `view_file`.
- Never rewrite entire files when targeted edits with `replace_file_content` suffice.
- Make decisive, high-confidence changes. Avoid prolonged or redundant planning for straightforward tasks.

## 2. Frontend & Visual Excellence Standards
- Follow rich aesthetic guidelines: curated HSL/Hex color palettes, dark/light mode balance, modern typography (Inter/Plus Jakarta Sans/system-ui), glassmorphism, and smooth micro-interactions.
- Never use broken images or empty placeholders. Generate realistic visual assets using `generate_image` or clean inline SVGs.
- Build responsive layouts using modern CSS Flexbox and CSS Grid.
- Verify user interfaces using `browser_subagent` and capture session recordings to confirm visual quality.

## 3. Code Quality & Security
- Keep business logic decoupled from UI and transport layers.
- Strictly isolate secrets in `.env` and never commit credentials.
- Use explicit type annotations and handle errors gracefully with meaningful user feedback.
- Run targeted tests (`npm test`, `pytest`) to verify fixes and prevent regressions.
