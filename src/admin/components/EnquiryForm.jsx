import { useState } from "react";
import AdminSelect from "./AdminSelect";

// Channels an admin-logged lead can come from. "website" is intentionally absent
// — those are created by the public form, not typed in here.
export const SOURCE_OPTIONS = [
  { value: "phone", label: "Phone call" },
  { value: "walk-in", label: "Walk-in" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

const EMPTY = {
  name: "", phone: "", email: "", source: "phone",
  propertyId: "", budget: "", followUpAt: "", status: "new", message: "",
};

function Field({ label, error, children, wide, hint }) {
  return (
    <label className={`admin-field${wide ? " admin-field--wide" : ""}${error ? " admin-field--invalid" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="admin-field__hint-sm">{hint}</small>}
      {error && <small className="admin-field__err">{error}</small>}
    </label>
  );
}

/**
 * Admin form to log an off-website enquiry (phone, walk-in, WhatsApp…).
 *
 * @param {object} props
 * @param {Array<{id:string,title:string,locality?:string}>} props.properties  for the "interested in" picker
 * @param {boolean} props.saving
 * @param {(data:object)=>void} props.onSubmit
 * @param {()=>void} props.onCancel
 */
export default function EnquiryForm({ properties = [], saving, onSubmit, onCancel }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const propertyOptions = [
    { value: "", label: "— Not specified —" },
    ...properties.map((p) => ({
      value: p.id,
      label: p.locality ? `${p.title} · ${p.locality}` : p.title,
    })),
  ];

  const validate = () => {
    const e = {};
    if (!values.name.trim()) e.name = "Name is required.";
    const phone = values.phone.trim();
    if (!phone) e.phone = "Phone is required.";
    else if (!/^[0-9+\s-]{7,15}$/.test(phone)) e.phone = "Enter a valid phone number.";
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      e.email = "Enter a valid email address.";
    return e;
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    // Parse the date input (yyyy-mm-dd) into a local Date, or null.
    const followUpAt = values.followUpAt ? new Date(`${values.followUpAt}T09:00:00`) : null;

    onSubmit({
      name: values.name,
      phone: values.phone,
      email: values.email,
      source: values.source,
      propertyId: values.propertyId || null,
      budget: values.budget,
      followUpAt,
      status: values.status,
      message: values.message,
    });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-form__section">
        <h2 className="admin-form__legend">Contact</h2>
        <div className="admin-grid">
          <Field label="Name *" error={errors.name}>
            <input type="text" value={values.name} onChange={(e) => set("name", e.target.value)}
              autoComplete="off" placeholder="Full name" />
          </Field>
          <Field label="Phone *" error={errors.phone}>
            <input type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)}
              autoComplete="off" placeholder="+91 " />
          </Field>
          <Field label="Email" error={errors.email}>
            <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)}
              autoComplete="off" placeholder="you@example.com" />
          </Field>
          <Field label="Source *">
            <AdminSelect value={values.source} onChange={(v) => set("source", v)}
              options={SOURCE_OPTIONS} ariaLabel="Enquiry source" />
          </Field>
        </div>
      </div>

      <div className="admin-form__section">
        <h2 className="admin-form__legend">Requirement</h2>
        <div className="admin-grid">
          <Field label="Interested in" wide hint="Link this lead to a listing (optional).">
            <AdminSelect value={values.propertyId} onChange={(v) => set("propertyId", v)}
              options={propertyOptions} placeholder="— Not specified —" ariaLabel="Interested property" />
          </Field>
          <Field label="Budget" hint="e.g. ₹80L – 1.2 Cr">
            <input type="text" value={values.budget} onChange={(e) => set("budget", e.target.value)}
              placeholder="Approx. budget" />
          </Field>
          <Field label="Follow-up date" hint="Set a reminder to call back.">
            <input type="date" value={values.followUpAt} onChange={(e) => set("followUpAt", e.target.value)} />
          </Field>
          <Field label="Status">
            <AdminSelect value={values.status} onChange={(v) => set("status", v)}
              options={STATUS_OPTIONS} ariaLabel="Enquiry status" />
          </Field>
          <Field label="Notes" wide>
            <textarea rows="4" value={values.message} onChange={(e) => set("message", e.target.value)}
              placeholder="What are they looking for? Any context from the call…" />
          </Field>
        </div>
      </div>

      <div className="admin-form__actions">
        <button type="button" className="admin-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save enquiry"}
        </button>
      </div>
    </form>
  );
}
