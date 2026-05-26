# Supabase Auth Email Templates

## Magic link template

Use [`magic-link.html`](./magic-link.html) in Supabase Dashboard:

1. Open `Authentication -> Email Templates -> Magic Link`.
2. Paste the full HTML from `magic-link.html`.
3. Ensure the sign-in link uses the token-hash confirm route (`/auth/confirm?token_hash=...&type=email`), not `{{ .ConfirmationURL }}`.
4. Save changes and send a test magic link from the live app.

This template is styled to align with TORCH brand colors and naming conventions.
