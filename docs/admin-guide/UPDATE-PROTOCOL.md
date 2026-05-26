# Admin Guide Update Protocol

Last updated: May 26, 2026

## Why This Exists

TORCH Live changes quickly. Documentation must stay usable for both:
1. Portal operators (non-technical)
2. Technical owners (backend/deploy/legal-risk)

## Update Triggers

Update docs whenever any of the following changes:
1. Admin portal workflow or button behavior
2. Data model, migration, or access-control behavior
3. Auth/login, URL config, SMTP, or email template behavior
4. Deployment workflow
5. Legal/risk language or public disclosures

## Required Updates by Audience

### If portal workflow changed
1. Update `PORTAL-QUICKSTART.md` if daily operator behavior changed.
2. Update Portal Operator sections in `SOP-RUNBOOKS.md`.

### If technical behavior changed
1. Update `ADMIN-OPERATIONS-GUIDE.md`.
2. Update Technical Owner sections in `SOP-RUNBOOKS.md`.

### If legal/risk changed
1. Update `../legal-risk-checklist.md`.

### Always
1. Append one row in `CHANGELOG.md`.
2. Run verification and note evidence in changelog.

## Verification Standard

Never write only "tests pass." Include what was verified:
1. Build result
2. Admin flow(s) tested
3. Auth/email flow tested if relevant
4. Remaining risk/TODO

## Ownership

1. Primary owner: implementation agent/developer
2. Secondary owner: TORCH technical owner
