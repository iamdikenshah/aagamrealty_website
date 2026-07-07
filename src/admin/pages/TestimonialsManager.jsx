import { useEffect, useState } from "react";
import {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../../firebase/firestore";
import TestimonialForm from "../components/TestimonialForm";
import { initials, avatarGradient } from "../format";

function Stars({ rating }) {
  const r = Math.max(1, Math.min(5, Math.round(rating ?? 5)));
  return (
    <span className="admin-stars" aria-label={`${r} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`fa-${n <= r ? "solid" : "regular"} fa-star`} aria-hidden="true" />
      ))}
    </span>
  );
}

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
            <article key={t.id} className={`admin-tcard${t.featured ? " is-featured" : ""}`}>
              {t.featured && (
                <span className="admin-tcard__ribbon"><i className="fa-solid fa-star" aria-hidden="true" /> Featured</span>
              )}
              <i className="fa-solid fa-quote-right admin-tcard__mark" aria-hidden="true" />
              <p className="admin-tcard__quote">{t.quote}</p>
              <div className="admin-tcard__foot">
                <span className="admin-avatar" style={{ background: avatarGradient(t.name) }}>{initials(t.name)}</span>
                <div className="admin-tcard__who">
                  <span className="admin-tcard__name">{t.name}</span>
                  {t.role && <span className="admin-tcard__role">{t.role}</span>}
                  <Stars rating={t.rating} />
                </div>
              </div>
              <footer className="admin-tcard__actions">
                <button className="admin-btn admin-btn--sm" onClick={() => setEditing(t)}>
                  <i className="fa-solid fa-pen" aria-hidden="true" /> Edit
                </button>
                <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(t)}>
                  <i className="fa-solid fa-trash" aria-hidden="true" /> Delete
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
