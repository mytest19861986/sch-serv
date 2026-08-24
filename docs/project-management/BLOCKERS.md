# Blockers

## Current

No product blocker for Discovery Gate.

## Environment Gaps

- `school_service_master_pipeline_prompts_v3_scale_ready.zip` is not mounted in the current workspace. It must not be cited as verified evidence until readable.
- The local workspace is not yet connected to the verified remote repository; worktree relationship and remote branch/ref inventory remain unverified. Remote read/write capability and default branch are verified.

## Resolved Environment Issues

- GitHub CLI access to `mytest19861986/sch-serv` was verified read/write on 2026-08-25 using GitHub CLI 2.98.0 and authenticated account `mytest19861986`. A direct controlled test created then deleted only `.codex_write_permission_test.txt`; default branch `main` was verified. The CLI is installed but not on this process PATH; direct executable use succeeds.
- Local repository initialization, `origin/main` connection, remote ref inventory, and foundation-only push are verified for Phase 12.

## Phase 12 Governance Decision Needed

- GitHub `main` branch protection/ruleset and repository-wide Actions restrictions are external governance settings. They are not changed without explicit Commander authorization. Their absence does not block creation of the foundation artifacts, but it must be resolved before implementation governance is considered complete.
# Phase 10 Security Design

- No blocker for the documentation Gate after second-pass review. Implementation and production security evidence remain blocked on executing the §108.1 acceptance matrix and resolving deferred session, retention, jurisdiction, offline-authority, and break-glass decisions.
