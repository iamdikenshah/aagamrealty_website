import { useState } from "react";
import { WHATSAPP_LINK } from "../../data/content";

const EMPTY = { name: "", phone: "", email: "", message: "" };

/**
 * Lead form shown on the detail page (sticky sidebar on desktop, inline on
 * mobile). No backend yet — on submit we validate, log the payload and show a
 * success state. When the CMS/CRM is wired, replace handleSubmit's body.
 */
export default function PropertyEnquiryForm({ property, prefillConfig }) {
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    message: prefillConfig
      ? `I'm interested in the ${prefillConfig} at ${property.title}. Please share more details.`
      : `I'm interested in ${property.title} (${property.locality}). Please share more details.`,
  }));
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    // --- Lead submission seam: swap for a real CRM/API call later. ---
    // eslint-disable-next-line no-console
    console.log("[Property enquiry]", { propertyId: property.id, ...values });
    setSent(true);
  };

  if (sent) {
    return (
      <div className="prop-enquiry prop-enquiry--done" role="status">
        <div className="prop-enquiry__tick"><i className="fa-solid fa-circle-check" aria-hidden="true" /></div>
        <h3>Thank you!</h3>
        <p>We've received your enquiry for <strong>{property.title}</strong> and will get back to you shortly.</p>
        <a className="btn btn-outline prop-enquiry__wa" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
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

      <button type="submit" className="btn btn-primary prop-enquiry__submit">Enquire Now</button>
      <a className="btn btn-outline prop-enquiry__wa" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
        <i className="fa-brands fa-whatsapp" aria-hidden="true" /> Or chat on WhatsApp
      </a>
    </form>
  );
}
