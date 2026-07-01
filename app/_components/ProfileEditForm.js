"use client";

import { useState } from "react";

export default function ProfileEditForm({ profile }) {
  const [fullName,    setFullName]    = useState(profile.full_name ?? "");
  const [showSocial,  setShowSocial]  = useState(profile.show_social  ?? true);
  const [showInDir,   setShowInDir]   = useState(profile.show_in_directory ?? true);
  const [linkedIn,    setLinkedIn]    = useState(profile.linkedin_url ?? "");
  const [pronouns,    setPronouns]    = useState(profile.pronouns ?? "");
  const [cotlColor,   setCotlColor]   = useState(profile.cotl_color ?? "");
  const [superpower,  setSuperpower]  = useState(profile.superpower ?? "");
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
        full_name:         fullName.trim(),
        show_social:       showSocial,
        show_in_directory: showInDir,
        linkedin_url:      linkedIn.trim() || null,
        pronouns:          pronouns.trim() || null,
        cotl_color:        cotlColor || null,
        superpower:        superpower.trim() || null,
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
        <label className="label" htmlFor="pe-name">Name</label>
        <input
          id="pe-name"
          type="text"
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={120}
          required
        />
      </div>

      {profile.room_number ? (
        <div className="field">
          <span className="label">Room</span>
          <p className="profile-edit-readonly">{profile.room_number}</p>
          <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
            {profile.role === "student"
              ? "Only visible to you. Contact staff if this looks wrong."
              : "Contact an admin if this looks wrong."}
          </p>
        </div>
      ) : null}

      <div className="field">
        <label className="label" htmlFor="pe-pronouns">Pronouns (optional)</label>
        <input
          id="pe-pronouns"
          type="text"
          className="input"
          placeholder="she/her, they/them, he/him…"
          value={pronouns}
          onChange={(e) => setPronouns(e.target.value)}
          maxLength={60}
        />
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
          Visible to everyone in the directory.
        </p>
      </div>

      <div className="field">
        <label className="label" htmlFor="pe-cotl">Color Outside the Lines color (optional)</label>
        <select
          id="pe-cotl"
          className="select"
          value={cotlColor}
          onChange={(e) => setCotlColor(e.target.value)}
        >
          <option value="">— Not sharing —</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="gold">Gold</option>
          <option value="orange">Orange</option>
        </select>
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
          Share your assessment color with the group.
        </p>
      </div>

      <div className="field">
        <label className="label" htmlFor="pe-superpower">Leadership superpower (optional)</label>
        <input
          id="pe-superpower"
          type="text"
          className="input"
          placeholder="e.g. Connector, Deep Listener, Visionary…"
          value={superpower}
          onChange={(e) => setSuperpower(e.target.value)}
          maxLength={30}
        />
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
          One word or short phrase — shown as a badge on your directory card.
        </p>
      </div>

      <div className="field">
        <label className="label" htmlFor="pe-linkedin">LinkedIn Profile (optional)</label>
        <input
          id="pe-linkedin"
          type="url"
          className="input"
          placeholder="https://www.linkedin.com/in/your-name"
          value={linkedIn}
          onChange={(e) => setLinkedIn(e.target.value)}
          maxLength={240}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
          When shared, clicking your name in the directory opens your LinkedIn profile.
        </p>
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
          <span>Show my LinkedIn profile</span>
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
