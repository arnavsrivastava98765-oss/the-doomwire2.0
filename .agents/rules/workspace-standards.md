# Antigravity Global Performance & Execution Standards

These performance directives govern all agent operations to maximize development speed, minimize context consumption, and eliminate unnecessary model calls.

## 1. Targeted File & Context Inspection
- **Never dump entire files** unless strictly necessary. Use `grep_search` to find exact symbols, functions, or patterns.
- When viewing files, always specify `StartLine` and `EndLine` slices around the target context.
- Never repeatedly read unchanged files within the same session. Cache file structures and mental models in reasoning.
- Use `list_dir` to inspect directory hierarchies before traversing subdirectories.

## 2. Minimal & Surgical Code Changes
- Use `replace_file_content` or `multi_replace_file_content` for precise, contiguous diffs.
- Avoid rewriting entire files or reconstructing working components from scratch.
- Preserve existing logic, comments, formatting, and docstrings unless explicitly asked to modify them.
- Reuse existing architecture, utility functions, components, and installed dependencies.

## 3. Tool & Command Execution Efficiency
- Avoid redundant web searches when solutions rely on standard library patterns or existing codebase conventions.
- When executing terminal commands, set appropriate `WaitMsBeforeAsync` values:
  - Quick commands (linting, tests, git status): 5000-10000ms to complete synchronously.
  - Long-running dev servers or daemons: set `IsDaemon: true` with small initial wait (500ms).
- Never poll `manage_task` status in loops; the reactive wakeup system resumes execution automatically when tasks finish.

## 4. Subagent & Concurrency Discipline
- Spawn subagents (`browser_subagent` or parallel tasks) ONLY for genuinely independent, parallelizable workflows.
- Never spawn subagents for trivial operations, sequential edits, or simple single-step lookups.
- Avoid multi-agent overhead when a direct tool call achieves the result in one turn.

## 5. Verification & Testing Hierarchy
- For localized changes, run targeted unit tests first (e.g., `npx vitest run path/to/file.test.ts` or `pytest path/to/test.py`).
- Escalate to broader integration tests and production builds (`npm run build`) only when milestones are completed.
- When fixing errors, formulate a single falsifiable hypothesis and test it; do not apply random trial-and-error mutations.
- Report all test outcomes, edge cases, and unexpected behaviors honestly and accurately.
