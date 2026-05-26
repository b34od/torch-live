"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button button-primary" disabled={pending}>
      {pending ? "Sending sign-in email..." : "Send sign-in email"}
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
      <SubmitButton />
    </form>
  );
}
