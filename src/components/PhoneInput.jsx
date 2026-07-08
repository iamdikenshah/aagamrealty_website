import { sanitizePhone } from "../utils/validators";
import "./PhoneInput.css";

// Class-name sets per host design system, so the shared control inherits each
// form's existing input look (border, height, focus) rather than a new style.
// Structure/behaviour is shared (PhoneInput.css); only the "skin" varies.
const VARIANTS = {
  prop: "prop-phone", // property detail sidebar form (.prop-field)
  site: "enq-phone", // main site enquiry form (.form-group)
  admin: "admin-phone", // admin panel forms (.admin-field)
};

/**
 * Phone input with a fixed, non-editable +91 country-code prefix. The field
 * holds only the 10 national digits — letters, symbols and spaces are stripped
 * as the user types. `onChange` receives the sanitized digit string.
 *
 * @param {string} props.value        the 10 national digits currently entered
 * @param {(digits:string)=>void} props.onChange
 * @param {"prop"|"site"|"admin"} [props.variant]  which design system to match
 * @param {boolean} [props.invalid]   render the error border
 */
export default function PhoneInput({
  value,
  onChange,
  variant = "site",
  id,
  name = "phone",
  invalid = false,
  placeholder = "10-digit mobile number",
  autoComplete = "tel-national",
  ariaLabel = "Phone number, without country code",
}) {
  const skin = VARIANTS[variant] || VARIANTS.site;
  return (
    <div className={`phone-input ${skin}${invalid ? " is-invalid" : ""}`}>
      <span className="phone-input__cc" aria-hidden="true">+91</span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        maxLength={10}
        pattern="\d{10}"
        className="phone-input__field"
        value={value}
        onChange={(e) => onChange(sanitizePhone(e.target.value))}
        aria-invalid={invalid}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </div>
  );
}
