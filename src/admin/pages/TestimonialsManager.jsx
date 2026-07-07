import { useEffect, useState } from "react";
import {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../../firebase/firestore";
import TestimonialForm from "../components/TestimonialForm";

export default function TestimonialsManager() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setItems(null);
    getTestimonials()
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load testimonials."));
  };

  useEffect(load, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing?.id) await updateTestimonial(editing.id, data);
      else await addTestimonial(data);
      setEditing(null);
      load();
    } catch (err) {
      alert(`Could not save: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete testimonial from "${item.name}"?`)) return;
    try {
      await deleteTestimonial(item.id);
      load();
    } catch (err) {
      alert(`Could not delete: ${err.message || err}`);
    }
  };

  if (editing !== null) {
    return (
      <div>
        <div className="admin-page-head">
          <h1 className="admin-h1">{editing.id ? "Edit testimonial" : "New testimonial"}</h1>
          <button className="admin-btn" onClick={() => setEditing(null)}>Cancel</button>
        </div>
        <TestimonialForm
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
        <h1 className="admin-h1">Testimonials</h1>
        <button className="admin-btn admin-btn--primary" onClick={() => setEditing({})}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> New testimonial
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!items && !error && <p className="admin-muted">Loading…</p>}
      {items && items.length === 0 && <p className="admin-muted">No testimonials yet.</p>}

      {items && items.length > 0 && (
        <div className="admin-cards">
          {items.map((t) => (
            <article key={t.id} className="admin-card">
              <header className="admin-card__head">
                <div>
                  <strong>{t.name}</strong>
                  {t.role && <span className="admin-muted"> · {t.role}</span>}
                </div>
                <span className="admin-stars">{"★".repeat(Math.max(1, Math.min(5, Math.round(t.rating ?? 5))))}</span>
              </header>
              <p className="admin-card__quote">“{t.quote}”</p>
              <footer className="admin-row-actions">
                {t.featured && <span className="admin-badge admin-badge--active">Featured</span>}
                <button className="admin-btn admin-btn--sm" onClick={() => setEditing(t)}>Edit</button>
                <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(t)}>Delete</button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
