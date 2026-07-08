import { useState } from "react";
import LocationMultiSelect from "./LocationMultiSelect";
import PhoneInput from "./PhoneInput";
import { isValidEmail, isValidPhone, toE164Phone } from "../utils/validators";
import {
  GOOGLE_FORM,
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
} from "../data/content";
import { track } from "../analytics";

// Compress the structured selections + free text into a single readable message
// so the Firestore-backed admin inbox has the full context of the lead (the
// Google Form keeps each field in its own sheet column separately).
function buildEnquiryMessage(values, locations) {
  return [
    [values.segment, values.requirement].filter(Boolean).join(" ") &&
      `Requirement: ${[values.segment, values.requirement].filter(Boolean).join(" ")}`,
    values.propertyCategory && `Category: ${values.propertyCategory}`,
    values.configuration && `Configuration: ${values.configuration}`,
    values.budget && `Budget: ${values.budget}`,
    locations.length && `Locations: ${locations.join(", ")}`,
    values.timeline && `Timeline: ${values.timeline}`,
    values.furnishing && `Furnishing: ${values.furnishing}`,
    values.purpose && `Purpose: ${values.purpose}`,
    values.source && `Found us via: ${values.source}`,
    values.details.trim() && `Details: ${values.details.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const EMPTY_FORM = {
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
  source: "",
  details: "",
  consent: false,
};

// Property categories shown depend on the chosen segment (all until one is set).
const categoryOptionsFor = (values) =>
  values.segment ? propertyCategoriesBySegment[values.segment] : propertyCategoryOptions;

// --- Conditional-logic helpers ------------------------------------------------
// Configuration (BHK) only applies to residential-unit categories.
const showConfiguration = (values) =>
  bhkCategories.includes(values.propertyCategory);
// Furnishing preference only applies to rentals.
const showFurnishing = (values) => values.requirement === "Rent";
// Purpose is hidden for Pre-Lease (assumed to always be investment/business).
const showPurpose = (values) => values.requirement !== "Pre-Lease";
// Rent uses monthly-rent budget bands; Buy/Pre-Lease use sale-price bands.
const budgetOptionsFor = (values) =>
  values.requirement === "Rent" ? rentBudgetOptions : buyBudgetOptions;

// Returns a specific error message for a single field, or "" when it's valid.
function getFieldError(name, values, locations) {
  switch (name) {
    case "segment":
      return values.segment ? "" : "Please choose Residential or Commercial.";

    case "fullName":
      if (!values.fullName.trim()) return "Please enter your full name.";
      if (values.fullName.trim().length < 2)
        return "Please enter a valid name (at least 2 characters).";
      return "";

    case "whatsapp": {
      const raw = values.whatsapp.trim();
      if (!raw) return "Please enter your WhatsApp number.";
      // Field holds only the 10 national digits (+91 is fixed in the UI).
      if (!isValidPhone(raw)) return "Please enter a valid 10-digit mobile number.";
      return "";
    }

    case "email": {
      const raw = values.email.trim();
      if (!raw) return ""; // optional
      if (!isValidEmail(raw)) return "Please enter a valid email address.";
      return "";
    }

    case "requirement":
      return values.requirement ? "" : "Please select a requirement type.";

    case "propertyCategory":
      return values.propertyCategory ? "" : "Please select a property category.";

    case "configuration":
      if (!showConfiguration(values)) return "";
      return values.configuration ? "" : "Please select a configuration.";

    case "budget":
      return values.budget ? "" : "Please select a budget range.";

    case "purpose":
      if (!showPurpose(values)) return "";
      return values.purpose ? "" : "Please select a purpose.";

    case "locations":
      return locations.length > 0 ? "" : "Please select at least one location.";

    case "timeline":
      return values.timeline ? "" : "Please select a timeline.";

    case "furnishing":
      if (!showFurnishing(values)) return "";
      return values.furnishing ? "" : "Please select a furnishing preference.";

    case "consent":
      return values.consent
        ? ""
        : "Please agree to be contacted to continue.";

    default:
      return "";
  }
}

const VALIDATED_FIELDS = [
  "segment",
  "fullName",
  "whatsapp",
  "email",
  "requirement",
  "propertyCategory",
  "configuration",
  "budget",
  "purpose",
  "locations",
  "timeline",
  "furnishing",
  "consent",
];

export default function EnquiryForm() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [locations, setLocations] = useState([]);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Re-check a single field, but only surface the error if one already showed
  // for it (so we don't nag the user mid-typing before their first submit).
  const revalidateIfShown = (name, nextValues, nextLocations) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const message = getFieldError(name, nextValues, nextLocations);
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  // Apply a set of field changes, clear errors for any fields that are no
  // longer applicable/valid, then re-validate the touched fields.
  const applyChanges = (patch, touched) => {
    const nextValues = { ...values, ...patch };
    setValues(nextValues);
    setErrors((prev) => {
      const next = { ...prev };
      // Drop stale errors on fields that are conditionally hidden or reset.
      if (!showConfiguration(nextValues)) delete next.configuration;
      if (!showFurnishing(nextValues)) delete next.furnishing;
      if (!showPurpose(nextValues)) delete next.purpose;
      touched.forEach((name) => {
        if (!next[name]) return;
        const message = getFieldError(name, nextValues, locations);
        if (message) next[name] = message;
        else delete next[name];
      });
      return next;
    });
  };

  const setField = (name, value) => {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    revalidateIfShown(name, nextValues, locations);
  };

  // Requirement drives budget bands, furnishing and purpose visibility —
  // reset the dependent selections so a stale value can't be submitted.
  const setRequirement = (value) => {
    const wasRent = values.requirement === "Rent";
    const isRent = value === "Rent";
    const patch = { requirement: value };
    if (wasRent !== isRent) patch.budget = ""; // budget bands change
    if (!isRent) patch.furnishing = ""; // furnishing is rent-only
    if (value === "Pre-Lease") patch.purpose = ""; // purpose hidden
    applyChanges(patch, ["requirement", "budget"]);
  };

  // Segment (Residential/Commercial) narrows the property-category options —
  // drop a now-invalid category (and its BHK) so a stale value can't be sent.
  const setSegment = (value) => {
    const patch = { segment: value };
    const allowed = propertyCategoriesBySegment[value] || [];
    if (values.propertyCategory && !allowed.includes(values.propertyCategory)) {
      patch.propertyCategory = "";
      patch.configuration = "";
    }
    applyChanges(patch, ["segment", "propertyCategory"]);
  };

  // Category drives whether Configuration (BHK) applies.
  const setPropertyCategory = (value) => {
    const patch = { propertyCategory: value };
    if (!bhkCategories.includes(value)) patch.configuration = "";
    applyChanges(patch, ["propertyCategory"]);
  };

  const setLocationsAndRevalidate = (next) => {
    setLocations(next);
    revalidateIfShown("locations", values, next);
  };

  const validateAll = () => {
    const nextErrors = {};
    VALIDATED_FIELDS.forEach((name) => {
      const message = getFieldError(name, values, locations);
      if (message) nextErrors[name] = message;
    });
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const nextErrors = validateAll();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({
        type: "error",
        message: "Please fix the highlighted fields below and try again.",
      });
      return;
    }
    setErrors({});

    // Build the payload mapped to Google Form entry IDs — each field posts to
    // its own column. Conditionally-hidden fields are omitted so they land blank.
    const f = GOOGLE_FORM.fields;
    // The field holds only the 10 national digits; +91 is fixed in the UI.
    const fullPhone = toE164Phone(values.whatsapp);
    const data = new FormData();
    data.append(f.fullName, values.fullName);
    data.append(f.whatsapp, fullPhone);
    // Combine segment + requirement into one value, e.g. "Commercial Buy".
    data.append(f.requirement, [values.segment, values.requirement].filter(Boolean).join(" "));
    if (values.email.trim()) data.append(f.email, values.email.trim());
    data.append(f.propertyCategory, values.propertyCategory);
    if (showConfiguration(values)) data.append(f.configuration, values.configuration);
    data.append(f.budget, values.budget);
    if (showPurpose(values)) data.append(f.purpose, values.purpose);
    data.append(GOOGLE_FORM.locationEntry, locations.join(", "));
    data.append(f.timeline, values.timeline);
    if (showFurnishing(values)) data.append(f.furnishing, values.furnishing);
    if (values.source) data.append(f.source, values.source);
    data.append(f.consent, "Yes");
    const freeText = values.details.trim();
    if (freeText) data.append(GOOGLE_FORM.detailsEntry, freeText);

    setSubmitting(true);
    try {
      // no-cors: submission succeeds; the response is opaque.
      await fetch(GOOGLE_FORM.action, { method: "POST", mode: "no-cors", body: data });
      // Best-effort mirror to Firestore for the admin inbox — never block or fail
      // the user's submission on this (the Google Form sheet is the safety net).
      // Loaded on demand so the Firestore SDK stays off the critical bundle.
      import("../firebase/firestore")
        .then(({ addEnquiry }) =>
          addEnquiry({
            name: values.fullName.trim(),
            phone: fullPhone,
            email: values.email.trim(),
            message: buildEnquiryMessage(values, locations),
            propertyId: null,
          })
        )
        .catch((err) => console.error("[enquiry] Firestore mirror failed", err));
      track("enquiry_submitted", {
        source: "main_form",
        segment: values.segment || undefined,
        requirement: values.requirement || undefined,
        property_category: values.propertyCategory || undefined,
      });
      setStatus({
        type: "success",
        message: "Thank you! Your enquiry has been sent. We'll reach out shortly.",
      });
      setValues(EMPTY_FORM);
      setLocations([]);
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again or WhatsApp us directly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cls = (name) => (errors[name] ? "invalid" : undefined);

  // Inline error message under a field.
  const FieldError = ({ name }) =>
    errors[name] ? (
      <small className="field-error" role="alert">
        <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {errors[name]}
      </small>
    ) : null;

  const budgetOptions = budgetOptionsFor(values);
  const categoryOptions = categoryOptionsFor(values);

  return (
    <>
      <div className="enquiry-modal__head">
        <h2 className="enquiry-modal__title">Send Us an Enquiry</h2>
        <p className="enquiry-modal__sub">
          Tell us what you're looking for and we'll get back to you on WhatsApp.
        </p>
      </div>

      <form className="enquiry-form" id="enquiryForm" noValidate onSubmit={handleSubmit}>
        {/* Segment: Residential / Commercial */}
          <div className="form-group">
            <span className="group-label" id="segmentLabel">
              I'm looking for <span aria-hidden="true">*</span>
            </span>
            <div
              className={`segmented${errors.segment ? " invalid" : ""}`}
              role="radiogroup"
              aria-labelledby="segmentLabel"
            >
              {segmentOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={values.segment === opt}
                  className={`segmented__option${values.segment === opt ? " active" : ""}`}
                  onClick={() => setSegment(opt)}
                >
                  <i
                    className={`fa-solid ${opt === "Commercial" ? "fa-building" : "fa-house-chimney"}`}
                    aria-hidden="true"
                  />
                  {opt}
                </button>
              ))}
            </div>
            <FieldError name="segment" />
          </div>

          {/* Full Name + WhatsApp Number */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name <span aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="e.g. Rohan Mehta"
                autoComplete="name"
                className={cls("fullName")}
                aria-invalid={!!errors.fullName}
                value={values.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
              />
              <FieldError name="fullName" />
            </div>
            <div className="form-group">
              <label htmlFor="whatsapp">
                WhatsApp Number <span aria-hidden="true">*</span>
              </label>
              <PhoneInput
                variant="site"
                id="whatsapp"
                name="whatsapp"
                value={values.whatsapp}
                onChange={(digits) => setField("whatsapp", digits)}
                invalid={!!errors.whatsapp}
                placeholder="98765 43210"
              />
              <FieldError name="whatsapp" />
            </div>
          </div>

          {/* Email + Requirement Type */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="e.g. rohan@email.com"
                autoComplete="email"
                className={cls("email")}
                aria-invalid={!!errors.email}
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
              />
              {errors.email ? (
                <FieldError name="email" />
              ) : (
                <small className="field-hint">Optional — for brochures &amp; shortlists.</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="requirement">
                Requirement Type <span aria-hidden="true">*</span>
              </label>
              <select
                id="requirement"
                name="requirement"
                className={cls("requirement")}
                aria-invalid={!!errors.requirement}
                value={values.requirement}
                onChange={(e) => setRequirement(e.target.value)}
              >
                <option value="" disabled>Select requirement</option>
                {requirementOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError name="requirement" />
            </div>
          </div>

          {/* Property Category + Configuration (conditional) */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="propertyCategory">
                Property Category <span aria-hidden="true">*</span>
              </label>
              <select
                id="propertyCategory"
                name="propertyCategory"
                className={cls("propertyCategory")}
                aria-invalid={!!errors.propertyCategory}
                value={values.propertyCategory}
                onChange={(e) => setPropertyCategory(e.target.value)}
              >
                <option value="" disabled>Select category</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError name="propertyCategory" />
            </div>
            {showConfiguration(values) && (
              <div className="form-group">
                <label htmlFor="configuration">
                  Configuration <span aria-hidden="true">*</span>
                </label>
                <select
                  id="configuration"
                  name="configuration"
                  className={cls("configuration")}
                  aria-invalid={!!errors.configuration}
                  value={values.configuration}
                  onChange={(e) => setField("configuration", e.target.value)}
                >
                  <option value="" disabled>Select configuration</option>
                  {configurationOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <FieldError name="configuration" />
              </div>
            )}
          </div>

          {/* Budget Range + Purpose (conditional) */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="budget">
                Budget Range <span aria-hidden="true">*</span>
              </label>
              <select
                id="budget"
                name="budget"
                className={cls("budget")}
                aria-invalid={!!errors.budget}
                value={values.budget}
                onChange={(e) => setField("budget", e.target.value)}
              >
                <option value="" disabled>Select budget range</option>
                {budgetOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError name="budget" />
            </div>
            {showPurpose(values) && (
              <div className="form-group">
                <label htmlFor="purpose">
                  Purpose <span aria-hidden="true">*</span>
                </label>
                <select
                  id="purpose"
                  name="purpose"
                  className={cls("purpose")}
                  aria-invalid={!!errors.purpose}
                  value={values.purpose}
                  onChange={(e) => setField("purpose", e.target.value)}
                >
                  <option value="" disabled>Select purpose</option>
                  {purposeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <FieldError name="purpose" />
              </div>
            )}
          </div>

          {/* Preferred Property Location */}
          <div className="form-group">
            <span className="group-label" id="locationLabel">
              Preferred Property Location <span aria-hidden="true">*</span>
            </span>
            <LocationMultiSelect
              selected={locations}
              invalid={!!errors.locations}
              onChange={setLocationsAndRevalidate}
            />
            {errors.locations ? (
              <FieldError name="locations" />
            ) : (
              <small className="field-hint">Select one or more preferred areas.</small>
            )}
          </div>

          {/* Timeline + Furnishing (conditional) */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="timeline">
                Timeline to Move / Close <span aria-hidden="true">*</span>
              </label>
              <select
                id="timeline"
                name="timeline"
                className={cls("timeline")}
                aria-invalid={!!errors.timeline}
                value={values.timeline}
                onChange={(e) => setField("timeline", e.target.value)}
              >
                <option value="" disabled>Select timeline</option>
                {timelineOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError name="timeline" />
            </div>
            {showFurnishing(values) && (
              <div className="form-group">
                <label htmlFor="furnishing">
                  Furnishing Preference <span aria-hidden="true">*</span>
                </label>
                <select
                  id="furnishing"
                  name="furnishing"
                  className={cls("furnishing")}
                  aria-invalid={!!errors.furnishing}
                  value={values.furnishing}
                  onChange={(e) => setField("furnishing", e.target.value)}
                >
                  <option value="" disabled>Select furnishing</option>
                  {furnishingOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <FieldError name="furnishing" />
              </div>
            )}
          </div>

          {/* How did you find us? (optional) */}
          <div className="form-group">
            <label htmlFor="source">How did you find us?</label>
            <select
              id="source"
              name="source"
              value={values.source}
              onChange={(e) => setField("source", e.target.value)}
            >
              <option value="">Select an option (optional)</option>
              {sourceOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Additional Details */}
          <div className="form-group">
            <label htmlFor="details">Additional Details</label>
            <textarea
              id="details"
              name="details"
              rows="4"
              placeholder="Anything else we should know — specific society, amenities, urgency, etc."
              value={values.details}
              onChange={(e) => setField("details", e.target.value)}
            />
          </div>

          {/* Consent */}
          <div className={`form-consent${errors.consent ? " invalid" : ""}`}>
            <input
              type="checkbox"
              id="consent"
              name="consent"
              checked={values.consent}
              aria-invalid={!!errors.consent}
              onChange={(e) => setField("consent", e.target.checked)}
            />
            <label htmlFor="consent">
              I agree to be contacted via WhatsApp/call regarding this enquiry.
              <span aria-hidden="true"> *</span>
            </label>
          </div>
          <FieldError name="consent" />

          <button
            type="submit"
            className="btn btn-primary"
            id="enquirySubmit"
            disabled={submitting}
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            <i className="fa-solid fa-paper-plane" aria-hidden="true" /> Send Enquiry
          </button>

          <p className={`form-status${status.type ? ` ${status.type}` : ""}`} role="status" aria-live="polite">
            {status.message}
          </p>
      </form>
    </>
  );
}
