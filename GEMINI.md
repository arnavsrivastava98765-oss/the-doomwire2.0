# Antigravity Workspace Guidelines: Dazyyy vr-3.4

These workspace rules optimize pair programming, execution speed, code quality, and testing for this project.

## 1. Speed & Targeted File Inspection
- Prioritize the fastest path to a correct, working, and verified solution.
- Inspect files with precision: use `grep_search` and targeted slices of `view_file`. Never dump entire files unless strictly necessary.
- Never repeatedly read unchanged files within the same session. Cache file structures and mental models in reasoning.
- Use `list_dir` to inspect directory hierarchies before traversing subdirectories.

## 2. Minimal & Surgical Code Changes
- Use `replace_file_content` or `multi_replace_file_content` for precise, contiguous diffs.
- Never rewrite entire files or reconstruct working components from scratch.
- Preserve existing logic, comments, formatting, and docstrings unless explicitly asked to modify them.
- Make decisive, high-confidence changes. Avoid prolonged or redundant planning for straightforward tasks.

## 3. Tool & Command Execution Efficiency
- Avoid redundant web searches when solutions rely on standard library patterns or existing codebase conventions.
- When executing terminal commands, set appropriate `WaitMsBeforeAsync` values:
  - Quick commands (linting, tests, git status): 5000-10000ms to complete synchronously.
  - Long-running dev servers or daemons: set `IsDaemon: true` with small initial wait (500ms).
- Never poll `manage_task` status in loops; the reactive wakeup system resumes execution automatically when tasks finish.

## 4. Frontend & Visual Excellence Standards
- Follow rich aesthetic guidelines: curated HSL/Hex color palettes, dark/light mode balance, modern typography (Inter/Plus Jakarta Sans/system-ui), glassmorphism, and smooth micro-interactions.
- Never use broken images or empty placeholders. Generate realistic visual assets using `generate_image` or clean inline SVGs.
- Build responsive layouts using modern CSS Flexbox and CSS Grid.
- Verify user interfaces using `browser_subagent` and capture session recordings to confirm visual quality.

## 5. Code Quality & Security Isolation
- Keep business logic decoupled from UI and transport layers.
- Strictly isolate secrets in `.env` and never commit credentials.
- Use explicit type annotations and handle errors gracefully with meaningful user feedback.
- Maintain threat modeling standards and OWASP defense-in-depth principles.

## 6. Verification & Testing Hierarchy
- For localized changes, run targeted unit tests first (`npm test`, `pytest`).
- Escalate to broader integration tests and production builds (`npm run build`) only when milestones are completed.
- When fixing errors, formulate a single falsifiable hypothesis and test it; do not apply random trial-and-error mutations.
