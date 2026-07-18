import { useEffect } from "react";
import PropertyDetail from "../../pages/PropertyDetail";

/**
 * Full-screen preview of a listing exactly as the public detail page renders it.
 *
 * Reuses the real `PropertyDetail` (in `preview` mode) rather than a lookalike,
 * so what the admin sees here is what visitors get. Preview mode suppresses
 * analytics and disables the enquiry form, so opening this has no side effects.
 *
 * `property` is the *unsaved* form data — the listing need not exist in
 * Firestore yet.
 */
export default function PropertyPreview({ property, onClose, onPublish, publishing }) {
  // Escape closes; lock body scroll while the overlay is up.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const missing = [];
  if (!property.gallery?.length) missing.push("no images");
  if (!property.description?.trim()) missing.push("no description");

  return (
    <div className="admin-preview" role="dialog" aria-modal="true" aria-label="Property preview">
      <header className="admin-preview__bar">
        <div className="admin-preview__label">
          <i className="fa-solid fa-eye" aria-hidden="true" />
          <span>Preview — this is how the listing will look once published.</span>
          {missing.length > 0 && (
            <span className="admin-preview__warn">{missing.join(", ")}</span>
          )}
        </div>
        <div className="admin-preview__actions">
          <button type="button" className="admin-btn" onClick={onClose} disabled={publishing}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to editing
          </button>
          {onPublish && (
            <button
              type="button"
              className="admin-btn admin-btn--success"
              onClick={onPublish}
              disabled={publishing || !property.gallery?.length}
              title={!property.gallery?.length ? "Add at least one image before publishing." : undefined}
            >
              <i className="fa-solid fa-globe" aria-hidden="true" />
              {publishing ? " Publishing…" : " Publish"}
            </button>
          )}
        </div>
      </header>

      {/* `admin-preview__stage` re-enters public-site styling; index.css is
          already loaded app-wide, so the page renders with its real CSS. */}
      <div className="admin-preview__stage">
        <PropertyDetail preview previewData={property} />
      </div>
    </div>
  );
}
