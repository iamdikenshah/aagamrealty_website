import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { signIn } from "../firebase/auth";
import { isConfigured } from "../firebase/config";
import { isValidEmail } from "../utils/validators";
import { useAuth } from "./useAuth";

// Turn a Firebase auth error code into a friendly message.
function messageFor(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Couldn't sign you in. Please try again.";
  }
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → go straight to the dashboard.
  if (!loading && user) return <Navigate to="/" replace />;

  // Client-side validation runs first so empty/malformed fields get clear,
  // per-field messages instead of falling through to Firebase's generic errors.
  const validate = () => {
    const errs = {};
    const mail = email.trim();
    if (!mail) errs.email = "Please enter your email.";
    else if (!isValidEmail(mail)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Please enter your password.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    if (!isConfigured) {
      setError("Firebase isn't configured for this build (missing VITE_FB_* env).");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(messageFor(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      {/* Left: full-bleed property photo (no text). */}
      <aside className="admin-login__hero" aria-hidden="true" />

      {/* Right: logo on top, sign-in card below. */}
      <div className="admin-login__panel">
        <img src="/images/app_header_logo.png" alt="Aagam Realty" className="admin-login__logo" />

        <form className="admin-login__card" onSubmit={handleSubmit} noValidate>
          <h1 className="admin-login__title">Welcome back</h1>
          <p className="admin-login__sub">Sign in to the admin dashboard</p>

          <label className={`admin-field${fieldErrors.email ? " admin-field--invalid" : ""}`}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined })); }}
              autoComplete="username"
              placeholder="admin@aagamrealty.com"
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <small className="admin-field__err">{fieldErrors.email}</small>}
          </label>

          <label className={`admin-field${fieldErrors.password ? " admin-field--invalid" : ""}`}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined })); }}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && <small className="admin-field__err">{fieldErrors.password}</small>}
          </label>

          {error && (
            <p className="admin-login__error" role="alert">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {error}
            </p>
          )}

          <button type="submit" className="admin-btn admin-btn--primary admin-login__submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <a className="admin-login__back" href="/">← Back to website</a>
        </form>
      </div>
    </div>
  );
}
