// Tiny global store for the "Send Us an Enquiry" modal — same useSyncExternalStore
// pattern as router.jsx. Any component can open the popup with openEnquiry();
// the modal itself lives once at the App root.

import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export function openEnquiry() {
  if (!open) {
    open = true;
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
