import { useState } from "react";
import Reveal from "./Reveal";
import LocationMultiSelect from "./LocationMultiSelect";
import {
  GOOGLE_FORM,
  requirementOptions,
  propertyTypeOptions,
} from "../data/content";

const EMPTY_FORM = {
  fullName: "",
  whatsapp: "",
  requirement: "",
  propertyType: "",
  details: "",
};

// Returns a specific error message for a single field, or "" when it's valid.
function getFieldError(name, values, locations) {
  switch (name) {
    case "fullName":
      if (!values.fullName.trim()) return "Please enter your full name.";
      if (values.fullName.trim().length < 2)
        return "Please enter a valid name (at least 2 characters).";
      return "";

    case "whatsapp": {
      const raw = values.whatsapp.trim();
      if (!raw) return "Please enter your WhatsApp number.";
      // Only digits, spaces, +, - are allowed.
      if (!/^[0-9+\s-]+$/.test(raw))
        return "Please enter a valid mobile number (digits only).";
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 10)
        return "Mobile number is too short. Please enter a valid mobile number.";
      if (digits.length > 15)
        return "Mobile number is too long. Please enter a valid mobile number.";
      return "";
    }

    case "requirement":
      return values.requirement ? "" : "Please select a requirement type.";

    case "propertyType":
      return values.propertyType ? "" : "Please select a property type.";

    case "locations":
      return locations.length > 0 ? "" : "Please select at least one location.";

    default:
      return "";
  }
}

const VALIDATED_FIELDS = [
  "fullName",
  "whatsapp",
  "requirement",
  "propertyType",
  "locations",
];

export default function Enquiry() {
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

  const setField = (name, value) => {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    revalidateIfShown(name, nextValues, locations);
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

    // Build the payload mapped to Google Form entry IDs.
    const data = new FormData();
    data.append(GOOGLE_FORM.fields.fullName, values.fullName);
    data.append(GOOGLE_FORM.fields.whatsapp, values.whatsapp);
    data.append(GOOGLE_FORM.fields.requirement, values.requirement);
    data.append(GOOGLE_FORM.locationEntry, locations.join(", "));

    let details = `Property Type: ${values.propertyType}`;
    const freeText = values.details.trim();
    if (freeText) details += `\nDetails: ${freeText}`;
    data.append(GOOGLE_FORM.detailsEntry, details);

    setSubmitting(true);
    try {
      // no-cors: submission succeeds; the response is opaque.
      await fetch(GOOGLE_FORM.action, { method: "POST", mode: "no-cors", body: data });
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

  return (
    <section className="enquiry" id="contact">
      <div className="container">
        <Reveal as="h2" className="section-heading">Send Us an Enquiry</Reveal>
        <Reveal as="p" className="section-subheading">
          Tell us what you're looking for and we'll get back to you on WhatsApp.
        </Reveal>

        <Reveal as="form" className="enquiry-form" id="enquiryForm" noValidate onSubmit={handleSubmit}>
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
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                placeholder="e.g. 98765 43210"
                inputMode="numeric"
                autoComplete="tel"
                className={cls("whatsapp")}
                aria-invalid={!!errors.whatsapp}
                value={values.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
              />
              <FieldError name="whatsapp" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="requirement">
                Property Requirement Type <span aria-hidden="true">*</span>
              </label>
              <select
                id="requirement"
                name="requirement"
                className={cls("requirement")}
                aria-invalid={!!errors.requirement}
                value={values.requirement}
                onChange={(e) => setField("requirement", e.target.value)}
              >
                <option value="" disabled>Select requirement</option>
                {requirementOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError name="requirement" />
            </div>
            <div className="form-group">
              <label htmlFor="propertyType">
                Property Type <span aria-hidden="true">*</span>
              </label>
              <select
                id="propertyType"
                name="propertyType"
                className={cls("propertyType")}
                aria-invalid={!!errors.propertyType}
                value={values.propertyType}
                onChange={(e) => setField("propertyType", e.target.value)}
              >
                <option value="" disabled>Select property type</option>
                {propertyTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError name="propertyType" />
            </div>
          </div>

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

          <div className="form-group">
            <label htmlFor="details">Additional Details</label>
            <textarea
              id="details"
              name="details"
              rows="4"
              placeholder="Tell us more — budget, specific society/area, amenities, timeline, etc."
              value={values.details}
              onChange={(e) => setField("details", e.target.value)}
            />
          </div>

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
        </Reveal>
      </div>
    </section>
  );
}
