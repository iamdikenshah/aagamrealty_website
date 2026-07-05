import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Stats from "./components/Stats";
import Testimonials from "./components/Testimonials";
import About from "./components/About";
import EnquiryModal from "./components/EnquiryModal";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import PropertyShowcase from "./components/property/PropertyShowcase";
import PropertiesList from "./pages/PropertiesList";
import PropertyDetail from "./pages/PropertyDetail";
import { useLocation } from "./router.jsx";
import { openEnquiry } from "./enquiryStore";

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
      <About />
    </main>
  );
}

// Map the current pathname to a view. Kept deliberately tiny — see router.jsx.
function Router() {
  const path = useLocation();

  if (path === "/properties") return <PropertiesList />;
  if (path.startsWith("/property/")) {
    const id = decodeURIComponent(path.slice("/property/".length));
    return <PropertyDetail id={id} />;
  }
  return <Home />;
}

export default function App() {
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
        openEnquiry();
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
