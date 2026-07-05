// Minimal zero-dependency client router.
//
// The site is deployed as a static SPA on GitHub Pages (custom domain, root).
// Clean URLs like /properties and /property/<id> are made to work by pairing
// this History-API router with a 404.html redirect + a restore snippet in
// index.html (the standard "spa-github-pages" technique). No react-router.

import { useSyncExternalStore } from "react";

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

/**
 * Navigate to an in-app path without a full page reload.
 * @param {string} to            Target path (e.g. "/properties").
 * @param {object} [opts]
 * @param {boolean} [opts.replace=false]      Replace instead of push history.
 * @param {boolean} [opts.scrollToTop=true]   Reset scroll after navigating.
 */
export function navigate(to, { replace = false, scrollToTop = true } = {}) {
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (to === current) return;
  if (replace) window.history.replaceState(null, "", to);
  else window.history.pushState(null, "", to);
  if (scrollToTop) window.scrollTo(0, 0);
  notify();
}

function subscribe(cb) {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}

const getSnapshot = () => window.location.pathname;

/** Re-renders the caller whenever the current pathname changes. */
export function useLocation() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Anchor that performs SPA navigation for internal paths while remaining a real
 * <a> (so middle-click / cmd-click / crawlers still work). External and hash
 * links fall through to default browser behaviour.
 */
export function Link({ to, children, onClick, ...rest }) {
  const isInternal = to?.startsWith("/") && !to.startsWith("//");

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (
      !isInternal ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    ) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
