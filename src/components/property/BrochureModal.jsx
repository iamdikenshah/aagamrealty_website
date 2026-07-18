import { useEffect, useRef, useState } from "react";
import PropertyEnquiryForm from "./PropertyEnquiryForm";
import { track } from "../../analytics";

/**
 * Enquiry gate for the brochure download.
 *
 * The visitor submits the normal property enquiry; on success the PDF download
 * starts automatically and a manual link is left on screen as a fallback (some
 * browsers block programmatic downloads, and mobile Safari opens rather than
 * downloads).
 */
export default function BrochureModal({ property, onClose, preview = false }) {
  const [unlocked, setUnlocked] = useState(false);
  const closeRef = useRef(null);
  const brochure = property.brochure;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const fileName = brochure?.name || `${property.title} brochure.pdf`;

  // Kick off the download. `download` only forces a save for same-origin URLs;
  // Firebase Storage is cross-origin, so the browser may open the PDF in a new
  // tab instead. Either way the visitor gets the file.
  const startDownload = () => {
    if (!brochure?.url) return;
    const a = document.createElement("a");
    a.href = brochure.url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onUnlocked = () => {
    setUnlocked(true);
    if (!preview) {
      track("brochure_download", { property_id: property.id, property_title: property.title });
    }
    startDownload();
  };

  return (
    <div className="prop-brochure__overlay" onClick={onClose}>
      <div
        className="prop-brochure__modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Download brochure for ${property.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="prop-brochure__close" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <PropertyEnquiryForm
          property={property}
          preview={preview}
          onSuccess={onUnlocked}
          submitLabel="Submit & Download"
          intro={{
            title: "Download the brochure",
            sub: `Share your details and the brochure for ${property.title} will download right away.`,
          }}
          done={{
            title: unlocked ? "Your download has started" : "Thank you!",
            body: (
              <>
                <p>
                  If it didn&apos;t start automatically, use the link below.
                </p>
                <a
                  className="btn btn-primary prop-brochure__dl"
                  href={brochure?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={fileName}
                >
                  <i className="fa-solid fa-file-arrow-down" aria-hidden="true" /> Download brochure
                </a>
              </>
            ),
          }}
        />
      </div>
    </div>
  );
}
