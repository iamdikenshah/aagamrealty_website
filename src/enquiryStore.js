// Tiny global store for the "Send Us an Enquiry" modal — same useSyncExternalStore
// pattern as router.jsx. Any component can open the popup with openEnquiry();
// the modal itself lives once at the App root.

import { useSyncExternalStore } from "react";
import { track } from "./analytics";

let open = false;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

/**
 * Open the enquiry modal. Pass a `source` (e.g. "navbar", "footer", "hero") so
 * analytics can attribute which CTA drove the enquiry.
 */
export function openEnquiry(source = "unknown") {
  if (!open) {
    open = true;
    track("enquiry_open", { source });
    emit();
  }
}

export function closeEnquiry() {
  if (open) {
    open = false;
    emit();
  }
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Re-renders the caller whenever the enquiry modal opens/closes. */
export function useEnquiryOpen() {
  return useSyncExternalStore(subscribe, () => open, () => open);
}
