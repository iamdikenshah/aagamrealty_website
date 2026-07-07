import { useState } from "react";

const EMPTY = { name: "", role: "", quote: "", rating: 5, featured: false };

export default function TestimonialForm({ initial, saving, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...(initial || {}) }));

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!values.name.trim()) return alert("Name is required.");
    if (!values.quote.trim()) return alert("Quote is required.");
    onSubmit({
      name: values.name.trim(),
      role: values.role.trim(),
      quote: values.quote.trim(),
      rating: Math.max(1, Math.min(5, Number(values.rating) || 5)),
      featured: !!values.featured,
    });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-grid">
        <label className="admin-field">
          <span>Name *</span>
          <input type="text" value={values.name} onChange={(e) => set("name", e.target.value)} required />
        </label>
        <label className="admin-field">
          <span>Role</span>
          <input type="text" value={values.role} onChange={(e) => set("role", e.target.value)} placeholder="Homeowner, Ahmedabad" />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Quote *</span>
          <textarea rows="4" value={values.quote} onChange={(e) => set("quote", e.target.value)} required />
        </label>
        <label className="admin-field">
          <span>Rating (1–5)</span>
          <input type="number" min="1" max="5" value={values.rating} onChange={(e) => set("rating", e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Featured</span>
          <label className="admin-checkline">
            <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
            <span>Highlight this testimonial</span>
          </label>
        </label>
      </div>

      <div className="admin-form__actions">
        <button type="button" className="admin-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save testimonial"}
        </button>
      </div>
    </form>
  );
}
