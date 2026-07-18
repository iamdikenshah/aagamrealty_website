import { useEffect } from "react";
import { Link } from "../router.jsx";
import "../legal.css";

// Section heading with a gold section number. `n` is the display number.
const H = ({ n, children }) => (
  <h2>
    <span className="legal__num">{n}.</span>
    {children}
  </h2>
);

// Inline placeholder the owner must replace before publishing (styled loud).
const Todo = ({ children }) => <mark className="legal__todo">{children}</mark>;

/**
 * Public Terms & Conditions page (/terms). Rendered inside the site chrome
 * (navbar/footer) like the other public pages. Content mirrors
 * legal/terms-and-conditions.md — keep the two in sync when editing.
 *
 * NOTE: the <Todo> spans below are unconfirmed legal facts (entity type, RERA
 * number, office address, grievance officer). Fill them — and have a lawyer
 * review — before going live.
 */
export default function Terms() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Terms & Conditions — Aagam Realty";
    return () => { document.title = prev; };
  }, []);

  return (
    <section className="legal">
      <div className="container legal__inner">
        <p className="legal__eyebrow">
          <i className="fa-solid fa-file-contract" aria-hidden="true" /> Legal
        </p>
        <h1 className="legal__title">Terms &amp; Conditions</h1>
        <p className="legal__updated">Last updated: 8 July 2026</p>

        <div className="legal__note">
          These Terms govern your use of <strong>aagamrealty.com</strong>. Please read
          them carefully. By using this website or submitting an enquiry, you agree to
          be bound by them and by our <Link to="/privacy">Privacy Policy</Link>.
        </div>

        <div className="legal__body">
          <H n="1">Introduction &amp; Acceptance</H>
          <p>
            These Terms &amp; Conditions (&ldquo;<strong>Terms</strong>&rdquo;) govern
            your access to and use of the website <strong>aagamrealty.com</strong> and
            any related pages, forms, and services (together, the
            &ldquo;<strong>Website</strong>&rdquo;), operated by{" "}
            <strong>Aagam Realty</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
            &ldquo;our&rdquo;).
          </p>
          <p>
            By accessing, browsing, or using the Website — including by submitting an
            enquiry — you confirm that you have read, understood, and agree to be bound
            by these Terms and by our <Link to="/privacy">Privacy Policy</Link>.{" "}
            <strong>If you do not agree, please do not use the Website.</strong>
          </p>
          <p>
            We may update these Terms from time to time (see Section 18). Your continued
            use of the Website after any change means you accept the revised Terms.
          </p>

          <H n="2">Definitions</H>
          <ul>
            <li><strong>&ldquo;Website&rdquo;</strong> — aagamrealty.com and all its pages, content, forms, and features.</li>
            <li><strong>&ldquo;You&rdquo; / &ldquo;User&rdquo;</strong> — any person who accesses or uses the Website.</li>
            <li><strong>&ldquo;Content&rdquo;</strong> — all text, images, graphics, logos, property listings, descriptions, layouts, and other material on the Website.</li>
            <li><strong>&ldquo;Listing&rdquo;</strong> — any property, plot, or space displayed on the Website for rent, sale, or pre-lease.</li>
            <li><strong>&ldquo;Enquiry&rdquo;</strong> — information you submit to us through the enquiry form, WhatsApp, phone, email, or any other channel.</li>
            <li><strong>&ldquo;Owner&rdquo;</strong> — the actual owner, landlord, seller, or developer of a property listed on the Website.</li>
          </ul>

          <H n="3">Who We Are — Nature of Our Role</H>
          <p>
            Aagam Realty is a <strong>real estate agent / intermediary</strong> based in{" "}
            <strong>Ahmedabad, Gujarat, India</strong>. We help clients rent, buy,
            pre-lease, and identify residential and commercial properties, land, and plots.
          </p>
          <p>
            <strong>Important — we act as a facilitator, not a principal.</strong> Unless
            expressly stated in writing:
          </p>
          <ul>
            <li>We are <strong>not the owner, builder, developer, or seller</strong> of any property shown on the Website.</li>
            <li>We <strong>do not sell, let, or transfer</strong> property ourselves; we introduce interested parties and assist with the process.</li>
            <li>Any transaction, agreement, lease, sale deed, or booking is entered into <strong>directly between you and the Owner</strong> (or the Owner&rsquo;s authorised representative), on their terms.</li>
            <li>We <strong>do not receive, hold, or handle</strong> any purchase price, rent, deposit, token, or booking amount on behalf of Owners through this Website.</li>
          </ul>
          <p>
            <strong>RERA disclosure:</strong> Where required under the Real Estate
            (Regulation and Development) Act, 2016 and the Gujarat RERA rules, our
            real-estate-agent registration number is{" "}
            <Todo>[GUJRERA AGENT REGISTRATION NUMBER — insert or state &ldquo;not applicable&rdquo;]</Todo>.
            Listings relating to RERA-registered projects are subject to the particulars
            registered with the authority, which shall prevail over anything shown here.
          </p>

          <H n="4">Eligibility</H>
          <p>
            To use the Website and submit an Enquiry, you must be at least{" "}
            <strong>18 years of age</strong> and legally capable of entering into a
            binding contract under the Indian Contract Act, 1872. By using the Website you
            represent that you meet these requirements and that the information you provide
            is true and belongs to you (or that you are authorised to provide it).
          </p>

          <H n="5">Use of the Website</H>
          <p>
            You may use the Website only for lawful purposes and in accordance with these
            Terms. You agree <strong>not</strong> to:
          </p>
          <ul>
            <li>provide false, misleading, impersonated, or fraudulent information in any Enquiry;</li>
            <li>use the Website or any contact details on it to send spam, marketing, or unsolicited communications;</li>
            <li>copy, scrape, harvest, republish, or resell any Listing, Content, or data from the Website without our prior written consent;</li>
            <li>attempt to gain unauthorised access to the Website, its admin area, servers, or any connected systems;</li>
            <li>introduce any virus, malware, or harmful code, or otherwise disrupt or overload the Website;</li>
            <li>use the Website in any way that infringes the rights of, or restricts the use of the Website by, any third party;</li>
            <li>use the Website in breach of any applicable law or regulation.</li>
          </ul>
          <p>
            We may suspend or withdraw your access to the Website (or any part of it) at
            any time, without notice, if we reasonably believe you have breached these Terms.
          </p>

          <H n="6">Property Listings &amp; Information — Important Disclaimer</H>
          <p>
            All Listings and property information on the Website are provided{" "}
            <strong>for general information only</strong> and are{" "}
            <strong>indicative, not an offer or a contract</strong>. In particular:
          </p>
          <ul>
            <li>Details such as price, rent, area, carpet/built-up size, configuration (BHK), furnishing, amenities, floor, locality, availability, and images are provided by or on behalf of Owners and <strong>may be approximate, dated, or subject to change</strong> without notice.</li>
            <li>Photographs, renders, floor plans, and maps are <strong>representative only</strong> and may not reflect the current state of a property.</li>
            <li>Availability is <strong>not guaranteed</strong> — a property may be let, sold, withdrawn, or re-priced at any time.</li>
            <li>Nothing on the Website constitutes an offer, invitation, warranty, or guarantee capable of acceptance, or advice to enter into any transaction.</li>
          </ul>
          <p>
            <strong>You must independently verify</strong> all particulars — including
            title, ownership, approvals, RERA registration, measurements, encumbrances,
            dues, and legal status — through your own inspection and professional advisors
            before making any decision or payment. We do not warrant the accuracy,
            completeness, or currentness of any Listing.
          </p>

          <H n="7">Enquiries, Communication &amp; Consent</H>
          <p>
            When you submit the enquiry form (or contact us via WhatsApp, phone, or email),
            you provide information such as your <strong>name, WhatsApp/mobile number,
            optional email address, and your property requirements</strong> (segment,
            budget, preferred localities, timeline, and any details you choose to add).
          </p>
          <p>
            By submitting an Enquiry and ticking the consent box, you{" "}
            <strong>expressly consent</strong> to Aagam Realty (and its authorised
            representatives) <strong>contacting you by WhatsApp, phone call, SMS, and/or
            email</strong> in relation to your enquiry and relevant property options — even
            if your number is registered on DND/NCPR — until you withdraw that consent. You
            may withdraw consent at any time by writing to{" "}
            <a href="mailto:info@aagamrealty.com">info@aagamrealty.com</a>.
          </p>
          <p>
            We aim to respond to enquiries promptly but <strong>do not guarantee</strong>{" "}
            any response time, availability of a matching property, or any outcome.
          </p>

          <H n="8">Brokerage &amp; Professional Fees</H>
          <p>
            Any brokerage, commission, service charge, or professional fee payable to Aagam
            Realty for services rendered will be <strong>agreed separately and directly
            with you</strong> (verbally or in writing) and is <strong>not</strong> set,
            quoted, collected, or payable through this Website. These Terms do not by
            themselves create any obligation to pay a fee. Where a separate engagement or
            fee agreement exists, that agreement governs the commercial relationship.
          </p>

          <H n="9">No Professional Advice</H>
          <p>
            Content on the Website is for general information and does <strong>not</strong>{" "}
            constitute legal, financial, investment, tax, valuation, or professional advice.
            Statements about &ldquo;investment&rdquo;, &ldquo;returns&rdquo;,
            &ldquo;pre-lease yield&rdquo;, or similar are <strong>indicative and not
            assured</strong>. You should obtain independent professional advice before
            acting. Any decision you make based on the Website is at your own risk.
          </p>

          <H n="10">Third-Party Links &amp; Services</H>
          <p>
            The Website integrates and links to third-party services, including (without
            limitation) <strong>Google Forms/Google Workspace, Google Firebase/Firestore,
            Google Analytics, WhatsApp (Meta), Instagram, Facebook</strong>, and mapping or
            hosting providers. These services are governed by <strong>their own terms and
            privacy policies</strong>, over which we have no control. We are not responsible
            for the content, availability, security, or practices of any third-party service
            or linked website, and linking does not imply our endorsement.
          </p>

          <H n="11">Intellectual Property</H>
          <p>
            All Content on the Website — including the <strong>Aagam Realty name, logo,
            branding, text, design, graphics, and layout</strong> — is owned by or licensed
            to Aagam Realty and is protected by applicable intellectual-property laws. You
            may view and use the Website for your own personal, non-commercial purpose only.
            You must <strong>not</strong> copy, reproduce, modify, distribute, publicly
            display, or create derivative works from any Content without our prior written
            permission. Third-party trademarks, project names, and logos remain the property
            of their respective owners.
          </p>

          <H n="12">Information You Provide</H>
          <p>
            You are responsible for ensuring that any information you submit is{" "}
            <strong>accurate, current, and lawfully yours to share</strong>. You must not
            submit any third party&rsquo;s personal data without their consent. We may rely
            on the information you provide, and we are not liable for any consequence arising
            from inaccurate, incomplete, or unauthorised information submitted by you.
          </p>

          <H n="13">Privacy &amp; Data Protection</H>
          <p>
            We collect and process your personal data in accordance with our{" "}
            <Link to="/privacy">Privacy Policy</Link> and the{" "}
            <strong>Digital Personal Data Protection Act, 2023</strong> and other applicable
            Indian law. In summary, we collect the details you submit through the enquiry
            form and contact channels, and use them to{" "}
            <strong>respond to your enquiry, match you with suitable properties, and improve
            the Website</strong>. We do not sell your personal data. For full details of what
            we collect, how long we keep it, and your rights, please see the{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>

          <H n="14">Disclaimer of Warranties (&ldquo;As Is&rdquo;)</H>
          <p>
            The Website and all Content are provided on an <strong>&ldquo;as is&rdquo; and
            &ldquo;as available&rdquo;</strong> basis, without warranties of any kind,
            express or implied, to the fullest extent permitted by law. We do not warrant
            that the Website will be <strong>uninterrupted, error-free, secure, or free of
            viruses</strong>, or that any Listing, information, or result obtained through
            the Website will be <strong>accurate, reliable, or meet your
            requirements</strong>. Any reliance you place on the Website is at your own risk.
          </p>

          <H n="15">Limitation of Liability</H>
          <p>
            To the maximum extent permitted by applicable law, Aagam Realty, its proprietor,
            partners, employees, and representatives shall <strong>not be liable</strong> for
            any <strong>indirect, incidental, special, consequential, or punitive</strong>{" "}
            loss or damage, or for any <strong>loss of profit, opportunity, data, or
            goodwill</strong>, arising out of or in connection with your use of (or inability
            to use) the Website, any Listing, any Enquiry, or any dealing with an Owner or
            third party — whether based on contract, tort, or otherwise, and whether or not
            we were advised of the possibility of such loss.
          </p>
          <p>In particular, we are <strong>not liable</strong> for:</p>
          <ul>
            <li>the acts, omissions, defaults, or representations of any Owner, buyer, tenant, seller, or third party;</li>
            <li>any transaction, agreement, payment, or dispute between you and an Owner or third party;</li>
            <li>the condition, title, quality, legality, or fitness of any property;</li>
            <li>any inaccuracy or change in Listing information provided by Owners.</li>
          </ul>
          <p>
            Nothing in these Terms excludes or limits any liability that cannot be excluded
            or limited under applicable law.
          </p>

          <H n="16">Indemnity</H>
          <p>
            You agree to indemnify and hold harmless Aagam Realty and its representatives
            from and against any claims, losses, liabilities, costs, and expenses (including
            reasonable legal fees) arising out of or in connection with your breach of these
            Terms, your misuse of the Website, or your violation of any law or the rights of
            any third party.
          </p>

          <H n="17">Availability &amp; Changes to the Website</H>
          <p>
            We may modify, suspend, or discontinue the Website (or any Listing or feature) at
            any time, with or without notice, and we are not liable to you for doing so. We
            do not guarantee that the Website will always be available or accessible.
          </p>

          <H n="18">Changes to These Terms</H>
          <p>
            We may revise these Terms at any time by posting the updated version on this page
            with a new &ldquo;Last updated&rdquo; date. Changes take effect when posted.
            Please review this page periodically. Your continued use of the Website
            constitutes acceptance of the revised Terms.
          </p>

          <H n="19">Governing Law &amp; Jurisdiction</H>
          <p>
            These Terms are governed by and construed in accordance with the{" "}
            <strong>laws of India</strong>. Subject to any applicable law, the courts at{" "}
            <strong>Ahmedabad, Gujarat, India</strong> shall have exclusive jurisdiction over
            any dispute arising out of or in connection with these Terms or the Website.
          </p>

          <H n="20">Grievance &amp; Contact</H>
          <p>
            For any questions, concerns, or grievances regarding these Terms, the Website, or
            your personal data, please contact:
          </p>
          <div className="legal__contact">
            <strong>Aagam Realty</strong><br />
            Email: <a href="mailto:info@aagamrealty.com">info@aagamrealty.com</a><br />
            Phone / WhatsApp: <a href="tel:+919227100299">+91 92271 00299</a><br />
            Address: <Todo>[OFFICE ADDRESS — insert full registered/office address]</Todo><br />
            Grievance Officer: <Todo>[NAME — optional, for DPDP Act / IT Rules]</Todo>
          </div>

          <H n="21">General</H>
          <ul>
            <li><strong>Severability:</strong> If any provision of these Terms is held invalid or unenforceable, the remaining provisions continue in full force.</li>
            <li><strong>Waiver:</strong> Our failure to enforce any provision is not a waiver of our right to do so later.</li>
            <li><strong>Entire agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and Aagam Realty regarding the Website.</li>
            <li><strong>Assignment:</strong> You may not assign your rights under these Terms; we may assign ours to a successor of our business.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
