import { useEffect, useState } from "react";
import "./SmartImage.css";

// A neutral "photo" glyph shown while loading and when an image fails. Inlined
// as SVG so the placeholder never depends on an icon font (works in both the
// public site and the code-split admin bundle).
function PlaceholderIcon() {
  return (
    <svg className="smart-img__ph-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="9" r="1.6" fill="currentColor" />
      <path d="M4 17l4.5-4.5 3.5 3.5 3-3L20 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Drop-in <img> replacement that shows a shimmering placeholder until the real
 * image finishes decoding, fades it in, and falls back to a placeholder glyph
 * if the source is missing or errors.
 *
 * Renders a wrapper <span> that fills its parent, so use it inside a sized,
 * positioned container (as the existing image containers already are). Any extra
 * props (onClick, role, sizes…) are forwarded to the underlying <img>.
 *
 * @param {string} [src]          image URL (Firebase Storage download URL, etc.)
 * @param {string} [alt]
 * @param {string} [className]    extra class on the wrapper
 * @param {boolean} [eager]       load immediately instead of lazily (above-the-fold)
 */
export default function SmartImage({ src, alt = "", className = "", eager = false, ...rest }) {
  const [status, setStatus] = useState("loading"); // loading | loaded | error

  // Reset when the source changes (e.g. the detail hero swaps images in place).
  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);

  return (
    <span className={`smart-img${className ? ` ${className}` : ""}`} data-status={status}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          {...rest}
        />
      )}
      <span className="smart-img__ph" aria-hidden="true">
        <PlaceholderIcon />
      </span>
    </span>
  );
}
