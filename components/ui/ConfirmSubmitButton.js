"use client";

import { useFormStatus } from "react-dom";

export default function ConfirmSubmitButton({
  label,
  className = "button button-secondary",
  confirmMessage = "Are you sure you want to continue?",
  pendingLabel = "",
}) {
  const { pending } = useFormStatus();
  const loadingLabel = pendingLabel || `${label}...`;

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? loadingLabel : label}
    </button>
  );
}
