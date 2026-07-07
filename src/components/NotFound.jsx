import { useEffect } from "react";
import { Link } from "../router.jsx";

/**
 * Public 404 — shown for any URL that doesn't map to a real page (including
 * admin-lookalikes like /admindsd). Rendered inside the site chrome
 * (navbar/footer) so it stays branded, reusing the .prop-empty empty state.
 */
export default function NotFound() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Page not found — Aagam Realty";
    return () => { document.title = prev; };
  }, []);

  return (
    <section className="prop-detail">
      <div className="container prop-empty">
        <i className="fa-solid fa-compass" aria-hidden="true" />
        <h3>Page not found</h3>
        <p>The page you're looking for doesn't exist or may have moved.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/" className="btn btn-primary">Back to home</Link>
          <Link to="/properties" className="btn btn-outline">Browse properties</Link>
        </div>
      </div>
    </section>
  );
}
