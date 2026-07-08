import { useState } from "react";
import AdminSelect from "./AdminSelect";
import LocationMultiSelect from "../../components/LocationMultiSelect";
import PhoneInput from "../../components/PhoneInput";
import { isValidEmail, isValidPhone, toE164Phone } from "../../utils/validators";
import {
  segmentOptions,
  requirementOptions,
  propertyCategoryOptions,
  propertyCategoriesBySegment,
  bhkCategories,
  configurationOptions,
  buyBudgetOptions,
  rentBudgetOptions,
  purposeOptions,
  timelineOptions,
  furnishingOptions,
  sourceOptions,
} from "../../data/content";

// How an admin-logged lead reached us (stored as the Firestore `source`). Kept
// separate from "How did you find us?" (marketing attribution) below.
export const CHANNEL_OPTIONS = [
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
  segment: "",
  fullName: "",
  whatsapp: "",
  email: "",
  requirement: "",
  propertyCategory: "",
  configuration: "",
  budget: "",
  purpose: "",
  timeline: "",
  furnishing: "",
  foundVia: "",
  details: "",
  // Admin context
  channel: "phone",
  propertyId: "",
  followUpAt: "",
  status: "new",
};

// --- Conditional logic (mirrors the public Enquiry form) ---------------------
const categoryOptionsFor = (v) => (v.segment ? propertyCategoriesBySegment[v.segment] : propertyCategoryOptions);
const showConfiguration = (v) => bhkCategories.includes(v.propertyCategory);
const showFurnishing = (v) => v.requirement === "Rent";
const showPurpose = (v) => v.requirement !== "Pre-Lease";
const budgetOptionsFor = (v) => (v.requirement === "Rent" ? rentBudgetOptions : buyBudgetOptions);

// Flatten the structured selections into one readable message, the same way the
// website form does — so admin-logged and website leads read identically in the
// inbox.
function buildMessage(v, locations) {
  return [
    [v.segment, v.requirement].filter(Boolean).join(" ") &&
      `Requirement: ${[v.segment, v.requirement].filter(Boolean).join(" ")}`,
    v.propertyCategory && `Category: ${v.propertyCategory}`,
    v.configuration && `Configuration: ${v.configuration}`,
    v.budget && `Budget: ${v.budget}`,
    locations.length && `Locations: ${locations.join(", ")}`,
    v.timeline && `Timeline: ${v.timeline}`,
    v.furnishing && `Furnishing: ${v.furnishing}`,
    v.purpose && `Purpose: ${v.purpose}`,
    v.foundVia && `Found us via: ${v.foundVia}`,
    v.details.trim() && `Details: ${v.details.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function fieldError(name, v, locations) {
  switch (name) {
    case "segment": return v.segment ? "" : "Choose Residential or Commercial.";
    case "fullName":
      if (!v.fullName.trim()) return "Name is required.";
      if (v.fullName.trim().length < 2) return "Enter a valid name.";
      return "";
    case "whatsapp": {
      const raw = v.whatsapp.trim();
      if (!raw) return "Phone is required.";
      // Field holds only the 10 national digits (+91 is fixed in the UI).
      if (!isValidPhone(raw)) return "Enter a valid 10-digit number.";
      return "";
    }
    case "email":
      if (!v.email.trim()) return "";
      return isValidEmail(v.email) ? "" : "Enter a valid email.";
    case "requirement": return v.requirement ? "" : "Select a requirement type.";
    case "propertyCategory": return v.propertyCategory ? "" : "Select a category.";
    case "configuration":
      if (!showConfiguration(v)) return "";
      return v.configuration ? "" : "Select a configuration.";
    case "budget": return v.budget ? "" : "Select a budget range.";
    case "purpose":
      if (!showPurpose(v)) return "";
      return v.purpose ? "" : "Select a purpose.";
    case "locations": return locations.length ? "" : "Select at least one location.";
    case "timeline": return v.timeline ? "" : "Select a timeline.";
    case "furnishing":
      if (!showFurnishing(v)) return "";
      return v.furnishing ? "" : "Select a furnishing preference.";
    default: return "";
  }
}

const VALIDATED = [
  "segment", "fullName", "whatsapp", "email", "requirement", "propertyCategory",
  "configuration", "budget", "purpose", "locations", "timeline", "furnishing",
];

// Input/select fields use a <label> (clicking the label focuses the control).
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

// Custom controls (segmented radios, multi-select) use a <div> so clicking the
// label text doesn't forward a click into the first button.
function FieldBlock({ label, error, children, wide, hint }) {
  return (
    <div className={`admin-field${wide ? " admin-field--wide" : ""}${error ? " admin-field--invalid" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="admin-field__hint-sm">{hint}</small>}
      {error && <small className="admin-field__err">{error}</small>}
    </div>
  );
}

/**
 * Comprehensive admin enquiry form — mirrors the public site's enquiry form
 * (same fields, options and conditional logic) plus admin context (how the lead
 * reached us, interested listing, follow-up date, status).
 *
 * @param {Array<{id:string,title:string,locality?:string}>} props.properties
 * @param {boolean} props.saving
 * @param {(data:object)=>void} props.onSubmit
 * @param {()=>void} props.onCancel
 */
export default function EnquiryForm({ properties = [], saving, onSubmit, onCancel }) {
  const [values, setValues] = useState(EMPTY);
  const [locations, setLocations] = useState([]);
  const [errors, setErrors] = useState({});

  const clearErr = (name) => setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));
  const set = (name, value) => { setValues((v) => ({ ...v, [name]: value })); clearErr(name); };

  // Requirement drives budget bands, furnishing and purpose — reset dependents.
  const setRequirement = (value) => {
    setValues((v) => {
      const patch = { ...v, requirement: value };
      if ((v.requirement === "Rent") !== (value === "Rent")) patch.budget = "";
      if (value !== "Rent") patch.furnishing = "";
      if (value === "Pre-Lease") patch.purpose = "";
      return patch;
    });
    setErrors((e) => ({ ...e, requirement: "", budget: "", furnishing: "", purpose: "" }));
  };

  // Segment narrows category options — drop a now-invalid category (and BHK).
  const setSegment = (value) => {
    setValues((v) => {
      const patch = { ...v, segment: value };
      const allowed = propertyCategoriesBySegment[value] || [];
      if (v.propertyCategory && !allowed.includes(v.propertyCategory)) {
        patch.propertyCategory = "";
        patch.configuration = "";
      }
      return patch;
    });
    setErrors((e) => ({ ...e, segment: "", propertyCategory: "", configuration: "" }));
  };

  // Category drives whether Configuration (BHK) applies.
  const setPropertyCategory = (value) => {
    setValues((v) => ({ ...v, propertyCategory: value, configuration: bhkCategories.includes(value) ? v.configuration : "" }));
    setErrors((e) => ({ ...e, propertyCategory: "", configuration: "" }));
  };

  const setLocationsAndClear = (next) => { setLocations(next); clearErr("locations"); };

  const propertyOptions = [
    { value: "", label: "— Not specified —" },
    ...properties.map((p) => ({ value: p.id, label: p.locality ? `${p.title} · ${p.locality}` : p.title })),
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    VALIDATED.forEach((name) => {
      const msg = fieldError(name, values, locations);
      if (msg) next[name] = msg;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    const followUpAt = values.followUpAt ? new Date(`${values.followUpAt}T09:00:00`) : null;
    onSubmit({
      name: values.fullName,
      phone: toE164Phone(values.whatsapp),
      email: values.email,
      message: buildMessage(values, locations),
      budget: values.budget,
      source: values.channel,
      status: values.status,
      followUpAt,
      propertyId: values.propertyId || null,
    });
  };

  return (
    <form className="admin-form admin-enqform" onSubmit={handleSubmit} noValidate>
      {/* ---- Contact ---- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Contact</h2>
        <div className="admin-grid">
          <Field label="Full name *" error={errors.fullName}>
            <input type="text" value={values.fullName} onChange={(e) => set("fullName", e.target.value)}
              autoComplete="off" placeholder="e.g. Rohan Mehta" />
          </Field>
          <Field label="WhatsApp *" error={errors.whatsapp}>
            <PhoneInput variant="admin" value={values.whatsapp} onChange={(digits) => set("whatsapp", digits)}
              invalid={!!errors.whatsapp} placeholder="98765 43210" autoComplete="off" />
          </Field>
          <Field label="Email" error={errors.email} hint="Optional — for brochures & shortlists.">
            <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)}
              autoComplete="off" placeholder="e.g. rohan@email.com" />
          </Field>
          <Field label="Found us via">
            <AdminSelect value={values.foundVia} onChange={(v) => set("foundVia", v)}
              options={sourceOptions} placeholder="Select (optional)" ariaLabel="How did they find us" />
          </Field>
        </div>
      </section>

      {/* ---- Requirement: mirrors the public enquiry form ---- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Requirement</h2>
        <div className="admin-grid">
          <FieldBlock label="Looking for *" error={errors.segment} wide>
            <div className={`admin-segmented${errors.segment ? " is-invalid" : ""}`} role="radiogroup" aria-label="Segment">
              {segmentOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={values.segment === opt}
                  className={`admin-segmented__opt${values.segment === opt ? " active" : ""}`}
                  onClick={() => setSegment(opt)}
                >
                  <i className={`fa-solid ${opt === "Commercial" ? "fa-building" : "fa-house-chimney"}`} aria-hidden="true" />
                  {opt}
                </button>
              ))}
            </div>
          </FieldBlock>

          <Field label="Requirement *" error={errors.requirement}>
            <AdminSelect value={values.requirement} onChange={setRequirement}
              options={requirementOptions} placeholder="Select requirement" ariaLabel="Requirement type" />
          </Field>
          <Field label="Category *" error={errors.propertyCategory}>
            <AdminSelect value={values.propertyCategory} onChange={setPropertyCategory}
              options={categoryOptionsFor(values)} placeholder="Select category" ariaLabel="Property category" />
          </Field>
          {showConfiguration(values) && (
            <Field label="Configuration *" error={errors.configuration}>
              <AdminSelect value={values.configuration} onChange={(v) => set("configuration", v)}
                options={configurationOptions} placeholder="Select configuration" ariaLabel="Configuration" />
            </Field>
          )}
          <Field label="Budget *" error={errors.budget}>
            <AdminSelect value={values.budget} onChange={(v) => set("budget", v)}
              options={budgetOptionsFor(values)} placeholder="Select budget" ariaLabel="Budget range" />
          </Field>
          {showPurpose(values) && (
            <Field label="Purpose *" error={errors.purpose}>
              <AdminSelect value={values.purpose} onChange={(v) => set("purpose", v)}
                options={purposeOptions} placeholder="Select purpose" ariaLabel="Purpose" />
            </Field>
          )}
          <Field label="Timeline *" error={errors.timeline}>
            <AdminSelect value={values.timeline} onChange={(v) => set("timeline", v)}
              options={timelineOptions} placeholder="Select timeline" ariaLabel="Timeline" />
          </Field>
          {showFurnishing(values) && (
            <Field label="Furnishing *" error={errors.furnishing}>
              <AdminSelect value={values.furnishing} onChange={(v) => set("furnishing", v)}
                options={furnishingOptions} placeholder="Select furnishing" ariaLabel="Furnishing" />
            </Field>
          )}

          <FieldBlock label="Preferred location(s) *" error={errors.locations} wide
            hint="Select one or more preferred areas.">
            <LocationMultiSelect selected={locations} invalid={!!errors.locations} onChange={setLocationsAndClear} />
          </FieldBlock>
        </div>
      </section>

      {/* ---- Admin context ---- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Lead management</h2>
        <div className="admin-grid">
          <Field label="Received via *" hint="How this lead reached you.">
            <AdminSelect value={values.channel} onChange={(v) => set("channel", v)}
              options={CHANNEL_OPTIONS} ariaLabel="Received via" />
          </Field>
          <Field label="Interested in" hint="Link to a listing (optional).">
            <AdminSelect value={values.propertyId} onChange={(v) => set("propertyId", v)}
              options={propertyOptions} placeholder="— Not specified —" ariaLabel="Interested property" />
          </Field>
          <Field label="Follow-up date" hint="Set a callback reminder.">
            <input type="date" value={values.followUpAt} onChange={(e) => set("followUpAt", e.target.value)} />
          </Field>
          <Field label="Status">
            <AdminSelect value={values.status} onChange={(v) => set("status", v)}
              options={STATUS_OPTIONS} ariaLabel="Status" />
          </Field>
          <Field label="Notes" wide>
            <textarea rows="3" value={values.details} onChange={(e) => set("details", e.target.value)}
              placeholder="Specific society, amenities, urgency, notes from the call…" />
          </Field>
        </div>
      </section>

      <div className="admin-form__actions">
        <button type="button" className="admin-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save enquiry"}
        </button>
      </div>
    </form>
  );
}
