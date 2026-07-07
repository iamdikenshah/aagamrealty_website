import { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { updateAdminProfile } from "../../firebase/auth";
import { initials, avatarGradient } from "../format";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Seed / re-seed the field when the user (and their displayName) loads.
  useEffect(() => {
    setName(user?.displayName || "");
  }, [user?.displayName]);

  const dirty = name.trim() !== (user?.displayName || "").trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateAdminProfile({ displayName: name });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Could not save your name.");
    } finally {
      setSaving(false);
    }
  };

  const preview = name.trim() || user?.email || "";

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">Settings</h1>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <section className="admin-form__section">
          <h2 className="admin-form__legend">Your profile</h2>

          <div className="admin-profile-row">
            <span className="admin-avatar" style={{ background: avatarGradient(preview) }}>
              {initials(preview)}
            </span>
            <div>
              <div className="admin-profile-row__name">{name.trim() || "—"}</div>
              <div className="admin-muted">{user?.email}</div>
            </div>
          </div>

          <div className="admin-grid" style={{ marginTop: 18 }}>
            <label className="admin-field admin-field--wide">
              <span>Display name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false); }}
                placeholder="e.g. Diken Shah"
                maxLength={60}
                autoComplete="name"
              />
              <small className="admin-field__hint-sm">Shown in the top bar, the dashboard greeting, and your avatar.</small>
            </label>

            <label className="admin-field admin-field--wide">
              <span>Email</span>
              <input type="email" value={user?.email || ""} disabled />
              <small className="admin-field__hint-sm">Your sign-in email can't be changed here.</small>
            </label>
          </div>

          {error && <p className="admin-error" style={{ marginTop: 14 }}>{error}</p>}
          {saved && !dirty && (
            <p className="admin-save-ok" style={{ marginTop: 14 }}>
              <i className="fa-solid fa-circle-check" aria-hidden="true" /> Saved.
            </p>
          )}
        </section>

        <div className="admin-form__actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
