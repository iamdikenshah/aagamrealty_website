import { useEffect, useRef } from "react";
import EnquiryForm from "./Enquiry";
import { useEnquiryOpen, closeEnquiry } from "../enquiryStore";

/**
 * The "Send Us an Enquiry" form presented as a centered popup dialog. Mounted
 * once at the App root; opened from anywhere via openEnquiry(). Closes on the
 * ✕ button, backdrop click or Escape, and locks background scroll while open.
 */
export default function EnquiryModal() {
  const open = useEnquiryOpen();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeEnquiry();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog for keyboard/screen-reader users. preventScroll
    // stops the browser scrolling the (tall) panel into view, which would push
    // the top — and the close button — out of sight on open.
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="enquiry-modal" role="dialog" aria-modal="true" aria-label="Send us an enquiry">
      <div className="enquiry-modal__backdrop" onClick={closeEnquiry} />
      <div className="enquiry-modal__panel" ref={panelRef} tabIndex={-1}>
        <button
          type="button"
          className="enquiry-modal__close"
          onClick={closeEnquiry}
          aria-label="Close enquiry form"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <EnquiryForm />
      </div>
    </div>
  );
}
