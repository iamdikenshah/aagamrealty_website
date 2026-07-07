import { useEffect, lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Stats from "./components/Stats";
import Testimonials from "./components/Testimonials";
import FaqSection from "./components/FaqSection";
import About from "./components/About";
import NotFound from "./components/NotFound";
import EnquiryModal from "./components/EnquiryModal";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import PropertyShowcase from "./components/property/PropertyShowcase";
import PropertiesList from "./pages/PropertiesList";
import PropertyDetail from "./pages/PropertyDetail";
import { useLocation, navigate } from "./router.jsx";
import { openEnquiry } from "./enquiryStore";
import { trackPageView } from "./analytics";

// The entire admin CMS is code-split: this dynamic import is the only reference
// to it, so none of the admin bundle (or its react-router / firebase-auth /
// firebase-storage deps) is downloaded until someone actually visits /admin.
const AdminApp = lazy(() => import("./admin/AdminApp"));

// The original single-page marketing site (anchored sections).
function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <PropertyShowcase
        id="featured"
        eyebrow="Handpicked homes"
        title="Featured Residential Properties"
        subtitle="Ready-to-move flats, villas and new launches across Ahmedabad's most sought-after localities."
        filter={{ categories: ["residential"], featured: true }}
        viewAllTo="/properties?category=residential"
        viewAllLabel="View all residential"
      />
      <PropertyShowcase
        id="commercial"
        eyebrow="For business & investment"
        title="Commercial Properties"
        subtitle="Grade-A offices, retail showrooms and pre-leased assets with assured rental yields."
        filter={{ categories: ["commercial"] }}
        viewAllTo="/properties?category=commercial"
        viewAllLabel="View all commercial"
      />
      <Stats />
      <Testimonials />
      <FaqSection />
      <About />
    </main>
  );
}

// Redirects to `path` on mount (used for bare/legacy URLs). Renders nothing.
function Redirect({ to }) {
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to]);
  return null;
}

// Map the current pathname to a view. Kept deliberately tiny — see router.jsx.
function Router() {
  const path = useLocation();

  // Log a page_view on each SPA navigation (GA4 only auto-logs the first load).
  // A microtask defer lets the target page set document.title before we read it.
  useEffect(() => {
    const t = setTimeout(() => trackPageView(path), 0);
    return () => clearTimeout(t);
  }, [path]);

  if (path === "/properties") return <PropertiesList />;
  if (path === "/property" || path === "/property/") {
    // Bare /property (no id) — send visitors to the full listing page.
    return <Redirect to="/properties" />;
  }
  if (path.startsWith("/property/")) {
    const id = decodeURIComponent(path.slice("/property/".length));
    if (!id) return <Redirect to="/properties" />;
    return <PropertyDetail id={id} />;
  }
  if (path === "/" || path === "") return <Home />;
  // Anything else is an unknown URL → branded 404 (not a silent home fallback).
  return <NotFound />;
}

export default function App() {
  const path = useLocation();

  // Smooth-scroll any in-page anchor (#section) but keep the URL clean —
  // scroll to the target and strip the hash instead of letting it appear.
  // Only relevant on the home page, where these section targets exist.
  useEffect(() => {
    const onClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;

      const id = hash.slice(1);
      // "#contact" no longer maps to a section — it opens the enquiry popup.
      if (id === "contact") {
        e.preventDefault();
        openEnquiry("content_link");
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      if (id === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
      // Remove the "#section" hash without adding a history entry.
      history.replaceState(null, "", window.location.pathname + window.location.search);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The admin CMS is its own self-contained surface — render it without the
  // public site chrome (navbar/footer/enquiry modal) and behind Suspense so its
  // code-split chunk loads on demand. 404.html already preserves deep links like
  // /admin/properties, so a direct hit lands here after the SPA restore.
  if (path === "/admin" || path.startsWith("/admin/")) {
    return (
      <Suspense
        fallback={
          <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#555" }}>
            Loading…
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <>
      <Navbar />
      <Router />
      <Footer />
      <EnquiryModal />
      <WhatsAppFloat />
    </>
  );
}
