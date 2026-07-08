// Shared form validation + normalisation helpers used across every enquiry form
// (website property form, main site enquiry, admin enquiry) and the admin login.
// Keeping these in one place means the email/phone rules can't drift apart
// between forms.

// A pragmatic "looks like an email" check — one @, a dot in the domain, no
// spaces. Deliberately lenient (real deliverability is verified out of band).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True when the (trimmed) value looks like a valid email address. */
export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? "").trim());
}

// --- Indian mobile numbers ---------------------------------------------------
// Forms store only the 10 national digits; the +91 country code is fixed in the
// UI (see PhoneInput) and prepended on submit via toE164Phone().

/** Strip everything but digits and cap at 10 — the national part of a number. */
export function sanitizePhone(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

/** True when the value is exactly 10 digits (a complete national number). */
export function isValidPhone(value) {
  return /^\d{10}$/.test(String(value ?? "").trim());
}

/** Prepend the fixed +91 country code to 10 national digits for storage. */
export function toE164Phone(value) {
  return `+91${String(value ?? "").trim()}`;
}
