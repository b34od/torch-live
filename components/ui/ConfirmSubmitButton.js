"use client";

export default function ConfirmSubmitButton({
  label,
  className = "button button-secondary",
  confirmMessage = "Are you sure you want to continue?",
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}
