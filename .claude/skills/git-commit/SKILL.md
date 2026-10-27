---

name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation. Use when the user asks to commit changes, create a git commit, or mentions "/commit". Supports: (1) Auto-detecting type and scope from changes, (2) Generating conventional commit messages from diff, (3) Interactive commit with optional type/scope/description overrides, (4) Intelligent file staging for logical grouping'
license: MIT
allowed-tools: Bash
-------------------

# Git Commit with Conventional Commits

## Overview

Create standardized, semantic Git commits using the Conventional Commits specification. Always inspect the actual changes before generating the commit message.

The goal is to create **one clean, logical commit** containing only the changes relevant to the requested work.

## Conventional Commit Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Purpose                                        |
| ---------- | ---------------------------------------------- |
| `feat`     | New feature                                    |
| `fix`      | Bug fix                                        |
| `docs`     | Documentation only                             |
| `style`    | Formatting/style changes with no logic changes |
| `refactor` | Code refactor with no feature or bug fix       |
| `perf`     | Performance improvement                        |
| `test`     | Add or update tests                            |
| `build`    | Build system or dependency changes             |
| `ci`       | CI/CD configuration changes                    |
| `chore`    | Maintenance or miscellaneous changes           |
| `revert`   | Revert a previous commit                       |

## Breaking Changes

Use `!` after the type or scope when the change is breaking:

```text
feat!: remove deprecated endpoint
```

Or use a footer:

```text
feat: change authentication response format

BREAKING CHANGE: authentication responses no longer include `token`.
```

## Workflow

### 1. Inspect Repository Status

Always check the repository status first:

```bash
git status --short
```

Then inspect the appropriate diff:

```bash
git diff --staged
git diff
```

If necessary, inspect individual files to understand the changes.

### 2. Determine What Should Be Committed

Before staging anything:

* Identify files related to the requested change.
* Separate unrelated changes from the requested work.
* Do not automatically include every modified or untracked file.
* Preserve unrelated user changes.
* If the repository already contains staged changes, inspect them carefully before modifying the staging area.

If the requested change is clearly represented by specific files, stage only those files:

```bash
git add path/to/file1 path/to/file2
```

For related file patterns:

```bash
git add src/components/*
```

Use interactive staging when changes within a file need to be separated:

```bash
git add -p
```

### 3. Never Commit Secrets

Never stage or commit sensitive files or credentials, including:

* `.env`
* `.env.*` files containing real secrets
* API keys
* access tokens
* passwords
* private keys
* certificates containing private material
* `credentials.json`
* cloud/provider credentials
* database credentials

If a secret is already staged, do not commit it. Remove it from the staging area without deleting the user's file:

```bash
git restore --staged path/to/file
```

### 4. Analyze the Diff

After staging, inspect the final staged changes:

```bash
git diff --staged
```

Use the staged diff as the source of truth for the commit message.

Determine:

* **Type** — What kind of change is this?
* **Scope** — What module, feature, or area is affected?
* **Description** — What does the commit do?
* **Breaking change** — Does it change an existing public API or behavior incompatibly?

Do not guess the commit type from filenames alone. Base it on the actual changes.

### 5. Generate the Commit Message

The subject must:

* Follow Conventional Commits.
* Use present tense.
* Use imperative wording.
* Be concise.
* Normally stay under 72 characters.
* Describe the actual change rather than the motivation.
* Avoid unnecessary punctuation at the end.

Good:

```text
fix(auth): handle missing Redis rate-limit values
feat(users): add session revocation endpoint
refactor(auth): extract token validation service
test(auth): add rate-limit service tests
```

Bad:

```text
fixed the authentication bug
Added some new functionality
updates
changes to auth stuff
```

### 6. Execute the Commit

For a simple commit:

```bash
git commit -m "<type>[scope]: <description>"
```

For a commit with a body:

```bash
git commit -m "$(cat <<'EOF'
<type>[scope]: <description>

<body>
EOF
)"
```

Do not add unnecessary commit bodies for small changes.

### 7. Verify the Commit

After a successful commit:

```bash
git status --short
git log -1 --oneline
```

Confirm that:

* The commit was created successfully.
* The commit contains the intended changes.
* Unrelated user changes were not accidentally committed.
* No secrets were committed.

### File-by-File Commit Rule

**Commit changes one file at a time.**

For every modified or untracked file that belongs to the requested work:

1. Inspect the file's diff.
2. Stage only that file.
3. Generate a Conventional Commit message specifically describing that file's changes.
4. Commit the file.
5. Verify the commit succeeded.
6. Move to the next file.

Example:

```bash
git add src/app/services/auth/rate_limit.py
git diff --staged
git commit -m "fix(auth): handle missing Redis rate-limit values"

git add src/app/services/auth/service.py
git diff --staged
git commit -m "refactor(auth): simplify authentication service"

git add tests/services/auth/test_rate_limit.py
git diff --staged
git commit -m "test(auth): add rate-limit service tests"
```

### Important File-by-File Rules

* **Never combine multiple files into one commit** when they can be committed independently.
* Each commit should contain **one file only** unless a file cannot logically be committed independently.
* Before each commit, verify that only the intended file is staged:

```bash
git diff --staged --name-only
```

The output should contain only the file being committed.

* After each commit, verify:

```bash
git status --short
git log -1 --oneline
```

* If a file contains unrelated changes, use interactive staging:

```bash
git add -p path/to/file
```

* Do not stage or commit unrelated files.
* Do not combine unrelated changes merely because they are part of the same feature.
* If two or more files are technically inseparable and committing one would create a broken/incomplete change, they may be committed together. This should be the exception, not the default.
* Never commit a file containing secrets or credentials.
* Never use `--no-verify` unless explicitly requested.
* Never amend a previous commit unless explicitly requested.
* Never add `Co-Authored-By`, `Co-authored-by`, or any equivalent co-author trailer.
* Never add AI attribution or AI-generated-by trailers unless explicitly requested.

## Existing Staged Changes

If files are already staged:

1. Inspect `git diff --staged`.
2. Determine whether the staged changes match the user's request.
3. Do not blindly unstage or modify the user's existing staged work.
4. If staged and unstaged changes represent different logical changes, preserve the distinction.
5. Commit only the changes that belong to the requested commit.

## Git Safety Protocol

* **NEVER update Git configuration.**
* **NEVER run destructive commands unless explicitly requested.**
* **NEVER run `git reset --hard`.**
* **NEVER delete user changes.**
* **NEVER use `git clean` unless explicitly requested.**
* **NEVER force push.**
* **NEVER force push to `main` or `master`.**
* **NEVER skip Git hooks with `--no-verify` unless explicitly requested.**
* **NEVER amend an existing commit unless explicitly requested.**
* If a commit fails because of a hook, fix the underlying problem and create a **new commit** rather than amending.
* **NEVER commit secrets, credentials, private keys, or real environment files.**
* **NEVER add `Co-Authored-By` to a commit message.**
* **NEVER add `Co-authored-by`, `Co-Authored-By`, or any equivalent co-author trailer to a commit message.**
* **NEVER add an AI attribution, AI-generated-by trailer, or similar attribution to a commit message unless the user explicitly requests it.**
* Do not add metadata that was not requested by the user.

