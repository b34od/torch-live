"use client";

import { useState } from "react";

export default function ProfileEditForm({ profile }) {
  const [showSocial,  setShowSocial]  = useState(profile.show_social  ?? true);
  const [showInDir,   setShowInDir]   = useState(profile.show_in_directory ?? true);
  const [social,      setSocial]      = useState(profile.social_handle ?? "");
  const [status,      setStatus]      = useState(null); // "saving" | "saved" | "error"
  const [errorMsg,    setErrorMsg]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        show_social:       showSocial,
        show_in_directory: showInDir,
        social_handle:     social.trim() || null,
      }),
    });

    if (res.ok) {
      setStatus("saved");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="profile-edit-form">
      <div className="field">
        <label className="label">Name</label>
        <p className="profile-edit-readonly">{profile.full_name}</p>
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
          Contact an admin to update your name.
        </p>
      </div>

      <div className="field">
        <label className="label" htmlFor="pe-social">Instagram / Social Handle</label>
        <input
          id="pe-social"
          type="text"
          className="input"
          placeholder="@handle"
          value={social}
          onChange={(e) => setSocial(e.target.value)}
          maxLength={120}
        />
      </div>

      <fieldset className="profile-edit-privacy">
        <legend className="label">Directory Visibility</legend>

        <label className="profile-edit-toggle">
          <input
            type="checkbox"
            checked={showInDir}
            onChange={(e) => setShowInDir(e.target.checked)}
          />
          <span>Show me in the directory</span>
        </label>

        <label className="profile-edit-toggle">
          <input
            type="checkbox"
            checked={showSocial}
            onChange={(e) => setShowSocial(e.target.checked)}
            disabled={!showInDir}
          />
          <span>Show my social handle</span>
        </label>
      </fieldset>

      {status === "error" ? (
        <p className="alert alert-error">{errorMsg}</p>
      ) : status === "saved" ? (
        <p className="alert alert-success">Saved.</p>
      ) : null}

      <button
        type="submit"
        className="button button-primary"
        disabled={status === "saving"}
      >
        {status === "saving" ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
