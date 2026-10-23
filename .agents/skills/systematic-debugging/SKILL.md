---
name: systematic-debugging
description: High-speed root-cause isolation, reproducible test harness, stack trace deconstruction, and non-destructive resolution. Use when investigating errors or failing tests.
---

# Systematic Debugging

Rigorous procedure for resolving bugs and runtime failures efficiently without guessing.

## 5-Step Resolution Cycle

1. **Reproduce & Capture**:
   - Run the exact failing command or reproduce via script/browser.
   - Capture the exact error message, stack trace, and failing assertion.

2. **Isolate Boundary**:
   - Identify whether the fault is in client logic, network transport, API handler, database, or build configuration.
   - Check input parameters immediately preceding the point of failure.

3. **Single Falsifiable Hypothesis**:
   - Formulate one specific reason why the error occurred.
   - Verify using `grep_search` or targeted line inspection.

4. **Surgical Fix**:
   - Apply the minimal necessary patch using `replace_file_content`.
   - Do not refactor surrounding unrelated code while fixing a bug.

5. **Verify & Regression Check**:
   - Re-run the reproducer command to verify the error is eliminated.
   - Run adjacent tests to confirm zero regressions.
