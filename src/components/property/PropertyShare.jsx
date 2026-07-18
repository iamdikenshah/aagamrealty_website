import { useEffect, useState } from "react";
import { propertyUrl, whatsappLink } from "../../data/content";
import { track } from "../../analytics";

/**
 * Share controls for a listing: native share sheet where the browser offers one
 * (mobile), plus explicit WhatsApp and copy-link actions as the always-available
 * fallback for desktop.
 */
export default function PropertyShare({ property, preview = false }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // navigator.share doesn't exist during SSR and isn't in most desktop
  // browsers, so decide after mount rather than rendering a button that may
  // not work.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const url = propertyUrl(property.id);
  const shareText = `${property.title} — ${property.locality}, ${property.city}`;

  const log = (method) => {
    if (preview) return;
    track("property_share", { method, property_id: property.id, property_title: property.title });
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: property.title, text: shareText, url });
      log("native");
    } catch {
      /* the visitor dismissed the sheet — nothing to do */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      log("copy");
    } catch {
      // Clipboard API needs a secure context and can be blocked; fall back to
      // a prompt so the visitor can still copy the link by hand.
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <div className="prop-share">
      <span className="prop-share__label">Share</span>

      {canNativeShare && (
        <button type="button" className="prop-share__btn" onClick={nativeShare} title="Share" aria-label="Share this property">
          <i className="fa-solid fa-share-nodes" aria-hidden="true" />
        </button>
      )}

      <a
        className="prop-share__btn prop-share__btn--wa"
        href={whatsappLink(`${shareText}\n${url}`)}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on WhatsApp"
        aria-label="Share this property on WhatsApp"
        onClick={() => log("whatsapp")}
      >
        <i className="fa-brands fa-whatsapp" aria-hidden="true" />
      </a>

      <button
        type="button"
        className={`prop-share__btn${copied ? " is-copied" : ""}`}
        onClick={copyLink}
        title="Copy link"
        aria-label="Copy link to this property"
      >
        <i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`} aria-hidden="true" />
      </button>

      {/* Announced to screen readers; the icon swap alone wouldn't be. */}
      <span className="prop-share__copied" role="status" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
