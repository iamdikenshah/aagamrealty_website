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
  const [downloading, setDownloading] = useState(false);
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

  /**
   * Save the PDF to the visitor's device.
   *
   * The `download` attribute is ignored for cross-origin URLs, so linking
   * straight at Firebase Storage navigates/opens a tab instead of downloading.
   * Fetching the file into a blob makes it same-origin from the browser's point
   * of view, so `download` is honoured.
   *
   * This needs CORS on the Storage bucket for this site's origin; if that isn't
   * configured the fetch throws and we fall back to opening the file, which is
   * the old behaviour rather than a dead end.
   */
  const startDownload = async () => {
    if (!brochure?.url || downloading) return;
    setDownloading(true);
    let objectUrl;
    try {
      const res = await fetch(brochure.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("[brochure] direct download failed, opening instead", err);
      window.open(brochure.url, "_blank", "noopener,noreferrer");
    } finally {
      // Revoking immediately can cancel the save in some browsers.
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      setDownloading(false);
    }
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
                  If it didn&apos;t start automatically, use the button below.
                </p>
                <button
                  type="button"
                  className="btn btn-primary prop-brochure__dl"
                  onClick={startDownload}
                  disabled={downloading}
                >
                  <i className="fa-solid fa-file-arrow-down" aria-hidden="true" />
                  {downloading ? "Downloading…" : "Download brochure"}
                </button>
              </>
            ),
          }}
        />
      </div>
    </div>
  );
}
