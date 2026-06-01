# TORCH Live - Codex Security Closeout Addendum (2026-06-01)

This file captures tonight's closeout updates and the exact second-brain content blocks for any notes that could not be written directly due an external approval-credit gate.

## Applied directly in Obsidian

- `Projects/TORCH Live/Backlog.md`
  - Updated `updated:` date to `2026-06-01`.
  - Re-ranked launch priorities to include security fixes.
  - Added:
    - `TL-022` Auth callback hardening (remove query-token fallback)
    - `TL-023` Student guild assignment hardening
    - `TL-024` CSP script hardening

## Pending Obsidian appends (copy blocks below)

### Append to `Projects/TORCH Live/Release Readiness.md`

```md
## Week of 2026-06-01 (Codex defensive security assessment)

### Done

- Completed local + production defensive security assessment pass (source review, dependency audit, anonymous route probes, response-header checks).
- Added security remediation backlog items TL-022, TL-023, TL-024 with launch-priority framing.
- Captured closeout evidence and risk posture in PM artifacts.

### Verified

- Production unauth access controls still hold: `/admin` redirects to `/login`; protected surfaces remain gated.
- Production headers include CSP, HSTS, frame denial, and standard hardening headers.
- `npm audit --omit=dev` reported 0 known dependency vulnerabilities in the local lockfile context.
- Public health endpoint behavior is bounded (`GET` returns health JSON; unsupported methods return `405`).

### Left

- **TL-022:** Remove query-token auth callback/session fallback path.
- **TL-023:** Add strict server-side guild assignment validation on student self-selection.
- **TL-024:** Tighten CSP script policy away from broad `unsafe-inline`.
- **TL-004/TL-009/TL-010/TL-012/TL-008:** previously tracked operational readiness tasks remain open.

### Uncertain

- Authenticated production behavior after security fixes (requires post-implementation role smoke tests).
- Final CSP implementation shape vs. performance/SSR tradeoffs until implementation PR lands.
- Local auth/runtime smoke tests in this shell remain limited when env vars are absent.

### Launch risk score (security-adjusted)

**2.0 / 5: low-to-moderate, fixable before launch.**

Reason: No active exploit was executed and baseline controls are present, but three concrete hardening tasks are now identified and should be closed before broad user onboarding.
```

### Append to `Projects/TORCH Live/Change Log.md`

```md
## CHG-20260601-01

- Class: standard
- Summary: Defensive security assessment closeout and remediation-priority reset.
- Why now: Pre-launch validation identified specific auth/session and input-hardening fixes that should be closed before broader user onboarding.
- Scope: Local source review + dependency audit + production anonymous endpoint/header probes, then backlog reprioritization (TL-022, TL-023, TL-024).
- Impact: PM/governance artifacts and near-term implementation priorities.
- Risk level: low
- Rollout plan: Track remediation via TL-022/023/024, then re-run role-based smoke verification.
- Rollback plan: Remove this entry only if superseded by a higher-fidelity consolidated security closeout record.
- Verification evidence: `npm audit --omit=dev` = 0 vulnerabilities; production `/admin` unauth redirect behavior verified; production security headers and `/api/health` method boundaries verified.
- Approver: Bryan
- Status: implemented
```

### Create Session Log

Path:
`/Users/BryanODonnell/Documents/Obsidian Vault/Session Logs/2026-06-01 - TORCH Live Defensive Security Assessment (Codex).md`

```md
# 2026-06-01 - TORCH Live Defensive Security Assessment (Codex)

## Done

- Ran defensive assessment locally and against production anonymous surfaces.
- Reviewed auth/middleware/server action patterns, Supabase RLS migrations, and header posture.
- Added launch-priority remediation backlog items TL-022, TL-023, TL-024.

## Verified

- `npm audit --omit=dev`: 0 known vulnerabilities.
- Production `/admin` unauthenticated redirect to `/login` works.
- Production `/api/health` is publicly readable and rejects unsupported methods with `405`.
- Security headers present in production responses: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/CORP.

## Left

- Implement TL-022 auth callback hardening.
- Implement TL-023 guild assignment validation hardening.
- Implement TL-024 CSP script-policy hardening.
- Re-run authenticated role smoke tests after fixes.

## Uncertain

- Post-fix behavior until implementation lands and is verified.
- CSP nonce/performance tradeoff shape for final launch profile.

## Evidence

- Source-review references:
  - `app/auth/confirm/AuthConfirmClient.js`
  - `app/auth/confirm/page.js`
  - `app/auth/callback/route.js`
  - `app/student/guilds/page.js`
  - `middleware.js`
- Production probes:
  - `curl -sSI https://live.torchleadershipacademy.org/admin`
  - `curl -sSI https://live.torchleadershipacademy.org/api/health`
  - `curl -sSI -X POST https://live.torchleadershipacademy.org/api/health`
```
