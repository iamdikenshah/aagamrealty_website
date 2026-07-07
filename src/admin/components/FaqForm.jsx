import { useState } from "react";

const EMPTY = { question: "", answer: "" };

export default function FaqForm({ initial, saving, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!values.question.trim()) errs.question = "Question is required.";
    if (!values.answer.trim()) errs.answer = "Answer is required.";
    setErrors(errs);
    if (Object.keys(errs).some((k) => errs[k])) return;

    onSubmit({ question: values.question.trim(), answer: values.answer.trim() });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-grid">
        <label className={`admin-field admin-field--wide${errors.question ? " admin-field--invalid" : ""}`}>
          <span>Question *</span>
          <input
            type="text"
            value={values.question}
            aria-invalid={!!errors.question}
            onChange={(e) => set("question", e.target.value)}
            placeholder="Is this property RERA registered?"
          />
          {errors.question && <small className="admin-field__err">{errors.question}</small>}
        </label>
        <label className={`admin-field admin-field--wide${errors.answer ? " admin-field--invalid" : ""}`}>
          <span>Answer *</span>
          <textarea
            rows="4"
            value={values.answer}
            aria-invalid={!!errors.answer}
            onChange={(e) => set("answer", e.target.value)}
          />
          {errors.answer && <small className="admin-field__err">{errors.answer}</small>}
        </label>
      </div>

      <div className="admin-form__actions">
        <button type="button" className="admin-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save FAQ"}
        </button>
      </div>
    </form>
  );
}
