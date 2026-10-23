---
name: git-github-workflow
description: Clean version control, atomic commits, branch protection, and GitHub automation via gh CLI. Use when managing git repositories, creating pull requests, or resolving branches.
---

# Git & GitHub Workflow

Automated procedures for clean, professional version control and GitHub operations.

## Conventional Commits
Format commit messages with clear types and scope:
- `feat(scope): add user profile editing`
- `fix(scope): resolve race condition in token refresh`
- `perf(scope): memoize heavy calculation in dashboard`
- `refactor(scope): extract database connection pool`
- `test(scope): add integration tests for auth routes`

## Safe Git Operations
- Use HTTPS for remote repository operations (SSH is unsupported in automated sandbox environments).
- Check working tree state before commits: `git status -s`.
- Create feature branches: `git checkout -b feature/<name>`.
- Use atomic commits containing only changes related to a single task.

## GitHub CLI (`gh`) Automation
- Verify auth: `gh auth status`.
- Create pull requests: `gh pr create --title "..." --body "..."`.
- Check CI/CD status: `gh pr checks`.
- List or inspect issues: `gh issue list --limit 10`.
