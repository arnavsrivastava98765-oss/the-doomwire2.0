---
name: codebase-analysis
description: Zero-waste context exploration, fast symbol searching, dependency mapping, and minimal-overhead file inspection. Use when exploring or understanding codebases.
---

# Codebase Analysis

Procedures for rapidly grasping unfamiliar codebases with minimal token consumption.

## Fast Discovery Protocol
1. **Directory Structure**:
   - Use `list_dir` on root or major subdirectories to understand component layout.
   - Inspect `package.json`, `pyproject.toml`, or `Cargo.toml` for architecture and dependencies.

2. **Symbol & Definition Tracing**:
   - Use `grep_search` with exact function/class names rather than reading entire source files.
   - Use `MatchPerLine: true` to view snippets and line numbers directly from the search output.

3. **Targeted Reading**:
   - When viewing matching files, use `view_file` with explicit `StartLine` and `EndLine` parameters covering only the target function or block.
   - Never dump files larger than 100 lines unless a complete architectural rewrite is required.

4. **Mental Model Synthesis**:
   - Trace data flow from entry points (e.g., `main.ts`, `index.html`, `server.ts`) to controllers, services, and storage.
