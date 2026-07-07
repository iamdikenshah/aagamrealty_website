import { useEffect, useState } from "react";
import { getFaqs, addFaq, updateFaq, deleteFaq } from "../../firebase/firestore";
import FaqForm from "../components/FaqForm";

export default function FaqsManager() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setItems(null);
    getFaqs()
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load FAQs."));
  };

  useEffect(load, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing?.id) await updateFaq(editing.id, data);
      else await addFaq(data);
      setEditing(null);
      load();
    } catch (err) {
      alert(`Could not save: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete this FAQ?\n\n"${item.question}"`)) return;
    try {
      await deleteFaq(item.id);
      load();
    } catch (err) {
      alert(`Could not delete: ${err.message || err}`);
    }
  };

  if (editing !== null) {
    return (
      <div>
        <div className="admin-page-head">
          <h1 className="admin-h1">{editing.id ? "Edit FAQ" : "New FAQ"}</h1>
          <button className="admin-btn" onClick={() => setEditing(null)}>Cancel</button>
        </div>
        <FaqForm
          initial={editing.id ? editing : null}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">FAQs</h1>
        <button className="admin-btn admin-btn--primary" onClick={() => setEditing({})}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> New FAQ
        </button>
      </div>
      <p className="admin-muted" style={{ marginTop: -8, marginBottom: 18 }}>
        Shown on the homepage FAQ section and on property detail pages, in the order added.
      </p>

      {error && <p className="admin-error">{error}</p>}
      {!items && !error && <p className="admin-muted">Loading…</p>}
      {items && items.length === 0 && <p className="admin-muted">No FAQs yet.</p>}

      {items && items.length > 0 && (
        <div className="admin-cards">
          {items.map((f) => (
            <article key={f.id} className="admin-card">
              <strong>{f.question}</strong>
              <p className="admin-card__quote">{f.answer}</p>
              <footer className="admin-row-actions">
                <button className="admin-btn admin-btn--sm" onClick={() => setEditing(f)}>Edit</button>
                <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(f)}>Delete</button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
