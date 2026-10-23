---
name: browser-verification
description: Automated browser testing, visual regression checking, console error interception, and responsive layout verification using the browser subagent. Use when testing web applications.
---

# Browser Verification & UI Testing

Procedure for end-to-end verification of running web applications using `browser_subagent`.

## Workflow

1. **Launch Dev Server**:
   - Start local dev server via `run_command` with `IsDaemon: true` and `WaitMsBeforeAsync: 1000`.
   - Record the TaskId and verify the local URL (e.g., `http://localhost:3000` or `http://localhost:5173`).

2. **Run Browser Subagent**:
   - Invoke `browser_subagent` with clear, actionable tasks:
     - Check page navigation and initial render.
     - Inspect console errors and network requests.
     - Test interactive buttons, inputs, and modals.
     - Verify layout across desktop (1440x900) and mobile (375x812) viewports.
   - Provide a meaningful `RecordingName` (e.g., `ui_verification_test`).

3. **Evaluate Output**:
   - Confirm zero unhandled JavaScript exceptions or 4xx/5xx network errors.
   - Review DOM tree and screenshot to confirm visual correctness.

4. **Clean Up**:
   - When finished, terminate the dev server task using `manage_task` (`Action: 'kill'`).
