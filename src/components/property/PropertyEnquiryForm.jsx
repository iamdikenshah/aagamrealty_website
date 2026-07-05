import { useEffect, useState } from "react";
import { GOOGLE_FORM, whatsappLink } from "../../data/content";
import { CATEGORY_LABELS, TRANSACTION_LABELS } from "../../data/properties";

const EMPTY = { name: "", phone: "", email: "", message: "" };

/**
 * Lead form shown on the detail page (sticky sidebar on desktop, inline on
 * mobile). Submits to the same Google Form endpoint as the main site enquiry
 * (see data/content GOOGLE_FORM), mapping the fields onto its entry IDs. The
 * "chat on WhatsApp" button carries whatever is currently in the Message box.
 */
export default function PropertyEnquiryForm({ property, prefillConfig }) {
  // Default message — config-specific when a configuration's "Enquire Now" was
  // clicked, otherwise a generic one for the whole listing.
  const defaultMessage = (config) =>
    config
      ? `I'm interested in the ${config} at ${property.title}. Please share more details.`
      : `I'm interested in ${property.title} (${property.locality}). Please share more details.`;

  const [values, setValues] = useState(() => ({ ...EMPTY, message: defaultMessage(prefillConfig) }));
  // Once the visitor edits the Message box we stop auto-syncing it, so their
  // wording is never clobbered when they tap another config's "Enquire Now".
  const [messageEdited, setMessageEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  // When a config is picked (prefillConfig changes) refresh the prefilled
  // message — unless the visitor has already customised it.
  useEffect(() => {
    if (messageEdited) return;
    setValues((v) => ({ ...v, message: defaultMessage(prefillConfig) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillConfig]);

  // Live WhatsApp link — always reflects the current Message box text.
  const waHref = whatsappLink(
    values.message.trim() || `I'm interested in ${property.title} (${property.locality}).`
  );

  const update = (e) => {
    const { name, value } = e.target;
    if (name === "message") setMessageEdited(true);
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Please enter your name.";
    const phone = values.phone.trim();
    if (!phone) next.phone = "Please enter your phone number.";
    else if (!/^[0-9+\s-]{7,15}$/.test(phone)) next.phone = "Enter a valid phone number.";
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Enter a valid email address.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    // Map onto the shared Google Form entry IDs — same sheet as the main enquiry.
    const f = GOOGLE_FORM.fields;
    const data = new FormData();
    data.append(f.fullName, values.name.trim());
    data.append(f.whatsapp, values.phone.trim());
    if (values.email.trim()) data.append(f.email, values.email.trim());
    const category = CATEGORY_LABELS[property.category] || "";
    const transaction = TRANSACTION_LABELS[property.transaction] || "";
    data.append(f.requirement, `${category} ${transaction}`.trim());
    if (property.propertyType) data.append(f.propertyCategory, property.propertyType);
    if (prefillConfig) data.append(f.configuration, prefillConfig);
    data.append(GOOGLE_FORM.locationEntry, property.locality);
    // Carry the full message (incl. the property reference) into the details cell.
    data.append(GOOGLE_FORM.detailsEntry, values.message.trim());
    data.append(f.consent, "Yes");

    setSubmitting(true);
    setFailed(false);
    try {
      await fetch(GOOGLE_FORM.action, { method: "POST", mode: "no-cors", body: data });
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="prop-enquiry prop-enquiry--done" role="status">
        <div className="prop-enquiry__tick"><i className="fa-solid fa-circle-check" aria-hidden="true" /></div>
        <h3>Thank you!</h3>
        <p>We've received your enquiry for <strong>{property.title}</strong> and will get back to you shortly.</p>
        <a className="btn prop-enquiry__wa" href={waHref} target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-whatsapp" aria-hidden="true" /> Chat on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="prop-enquiry" onSubmit={handleSubmit} noValidate>
      <h3 className="prop-enquiry__title">Enquire about this property</h3>
      <p className="prop-enquiry__sub">Share your details and our team will reach out.</p>

      <label className="prop-field">
        <span>Full name<em>*</em></span>
        <input name="name" type="text" value={values.name} onChange={update}
          aria-invalid={!!errors.name} autoComplete="name" placeholder="Your name" />
        {errors.name && <small className="prop-field__err">{errors.name}</small>}
      </label>

      <label className="prop-field">
        <span>Phone<em>*</em></span>
        <input name="phone" type="tel" value={values.phone} onChange={update}
          aria-invalid={!!errors.phone} autoComplete="tel" placeholder="+91 " />
        {errors.phone && <small className="prop-field__err">{errors.phone}</small>}
      </label>

      <label className="prop-field">
        <span>Email</span>
        <input name="email" type="email" value={values.email} onChange={update}
          aria-invalid={!!errors.email} autoComplete="email" placeholder="you@example.com" />
        {errors.email && <small className="prop-field__err">{errors.email}</small>}
      </label>

      <label className="prop-field">
        <span>Message</span>
        <textarea name="message" rows="3" value={values.message} onChange={update} />
      </label>

      <button type="submit" className="btn btn-primary prop-enquiry__submit" disabled={submitting}>
        {submitting ? "Sending…" : "Enquire Now"}
      </button>
      <a className="btn prop-enquiry__wa" href={waHref} target="_blank" rel="noopener noreferrer">
        <i className="fa-brands fa-whatsapp" aria-hidden="true" /> Chat on WhatsApp
      </a>
      {failed && (
        <p className="prop-field__err" role="alert" style={{ marginTop: 10 }}>
          Something went wrong. Please try again or chat with us on WhatsApp.
        </p>
      )}
    </form>
  );
}
