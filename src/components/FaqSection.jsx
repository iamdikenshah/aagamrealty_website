import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { isConfigured } from "../firebase/config";

// Shown until the CMS FAQs load (and if Firebase is unconfigured or empty), so
// the section is never blank.
const FALLBACK = [
  {
    question: "Do you help with buying, renting and pre-leasing?",
    answer:
      "Yes. Aagam Realty handles residential and commercial deals across Ahmedabad — resale, new bookings, rentals and pre-leased assets — end to end.",
  },
  {
    question: "Do you assist with home loans and documentation?",
    answer:
      "Absolutely — from loan tie-ups to title verification and registration, our team supports you through the entire process.",
  },
  {
    question: "How do I schedule a site visit?",
    answer:
      "Submit the enquiry form or message us on WhatsApp and we'll arrange a site visit at a time that suits you.",
  },
];

export default function FaqSection() {
  const [faqs, setFaqs] = useState(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    if (!isConfigured) { setFaqs(FALLBACK); return; }
    let active = true;
    // Loaded on demand so the Firestore SDK stays off the homepage's critical bundle.
    import("../firebase/firestore")
      .then(({ fetchFaqs }) => fetchFaqs())
      .then((list) => { if (active) setFaqs(list.length ? list : FALLBACK); })
      .catch(() => { if (active) setFaqs(FALLBACK); });
    return () => { active = false; };
  }, []);

  const items = faqs ?? FALLBACK;
  if (!items.length) return null;

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <Reveal as="h2" className="section-heading">Frequently Asked Questions</Reveal>
        <Reveal as="p" className="section-subheading">
          Answers to the questions we hear most often from buyers, tenants and investors.
        </Reveal>

        <div className="prop-faq faq-section__list">
          {items.map((item, i) => (
            <div className={`prop-faq__item${open === i ? " open" : ""}`} key={item.id || item.question}>
              <button
                type="button"
                className="prop-faq__q"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {item.question}
                <i className="fa-solid fa-chevron-down" aria-hidden="true" />
              </button>
              <div className="prop-faq__a"><p>{item.answer}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
