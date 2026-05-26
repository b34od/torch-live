"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  className = "button button-primary",
  idleLabel = "Submit",
  pendingLabel = "Submitting...",
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export default function EmailSignInForm({ action, defaultEmail }) {
  return (
    <form action={action} className="stack">
      <div className="field">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          className="input"
          defaultValue={defaultEmail || ""}
          required
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="email"
          spellCheck="false"
        />
      </div>
      <FormSubmitButton idleLabel="Send sign-in email" pendingLabel="Sending sign-in email..." />
    </form>
  );
}
