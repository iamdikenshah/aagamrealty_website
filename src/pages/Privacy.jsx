import { useEffect } from "react";
import { Link } from "../router.jsx";
import "../legal.css";

const H = ({ n, children }) => (
  <h2>
    <span className="legal__num">{n}.</span>
    {children}
  </h2>
);

const Todo = ({ children }) => <mark className="legal__todo">{children}</mark>;

/**
 * Public Privacy Policy page (/privacy). Describes the data actually collected
 * by the enquiry form and analytics, and how it flows through Google Forms,
 * Firebase/Firestore, email, and Google/Firebase Analytics. Keep in sync with
 * legal/privacy-policy.md. Fill the <Todo> spans before going live.
 */
export default function Privacy() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Privacy Policy — Aagam Realty";
    return () => { document.title = prev; };
  }, []);

  return (
    <section className="legal">
      <div className="container legal__inner">
        <p className="legal__eyebrow">
          <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Legal
        </p>
        <h1 className="legal__title">Privacy Policy</h1>
        <p className="legal__updated">Last updated: 8 July 2026</p>

        <div className="legal__note">
          This policy explains what personal data <strong>Aagam Realty</strong> collects
          through <strong>aagamrealty.com</strong>, how we use and protect it, and your
          rights under the <strong>Digital Personal Data Protection Act, 2023</strong>.
          It should be read together with our <Link to="/terms">Terms &amp; Conditions</Link>.
        </div>

        <div className="legal__body">
          <H n="1">Introduction</H>
          <p>
            Aagam Realty (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) respects
            your privacy and is committed to protecting your personal data. This Privacy
            Policy describes how we collect, use, share, and safeguard information when you
            use our website <strong>aagamrealty.com</strong> (the &ldquo;Website&rdquo;) or
            contact us. By using the Website or submitting an enquiry, you agree to the
            practices described here.
          </p>

          <H n="2">Who We Are</H>
          <p>
            Aagam Realty is a real estate agent based in Ahmedabad, Gujarat, India, and is
            the &ldquo;Data Fiduciary&rdquo; responsible for your personal data under the
            Digital Personal Data Protection Act, 2023. You can reach us at{" "}
            <a href="mailto:info@aagamrealty.com">info@aagamrealty.com</a> or{" "}
            <a href="tel:+919227100299">+91 92271 00299</a>.
          </p>

          <H n="3">Information We Collect</H>
          <h3>a. Information you give us</h3>
          <p>When you submit the enquiry form or contact us, we collect:</p>
          <ul>
            <li><strong>Contact details</strong> — your full name, WhatsApp/mobile number, and (optionally) your email address.</li>
            <li><strong>Your requirement</strong> — whether you want to rent, buy, or pre-lease; residential or commercial; property category and configuration (BHK); budget range; preferred localities; purpose; timeline; furnishing preference; and how you found us.</li>
            <li><strong>Any additional details</strong> you choose to type into the free-text field or send us over WhatsApp, phone, or email.</li>
            <li><strong>Your consent</strong> to be contacted about your enquiry.</li>
          </ul>
          <h3>b. Information we collect automatically</h3>
          <p>
            When you visit the Website, we and our analytics providers may automatically
            collect limited technical data such as your <strong>device and browser type,
            approximate location (derived from your IP address), pages viewed, referral
            source, and interactions</strong> on the site. This is collected through
            cookies and similar technologies (see Section 6). We do not use this to identify
            you personally.
          </p>

          <H n="4">How We Collect It</H>
          <p>We collect data:</p>
          <ul>
            <li>directly from you, when you complete the enquiry form or contact us by WhatsApp, phone, or email; and</li>
            <li>automatically, through analytics and hosting technologies as you browse the Website.</li>
          </ul>
          <p>
            When you submit the enquiry form, your responses are transmitted to and stored
            using <strong>Google Forms / Google Sheets</strong> and mirrored to our{" "}
            <strong>Google Firebase (Firestore)</strong> database so our team can respond,
            and an email notification of your enquiry is sent to us.
          </p>

          <H n="5">Why We Use Your Data</H>
          <p>We use your personal data to:</p>
          <ul>
            <li>respond to your enquiry and contact you (by WhatsApp, call, SMS, or email) about it;</li>
            <li>understand your requirement and suggest suitable properties or options;</li>
            <li>facilitate introductions and dealings with property owners or their representatives;</li>
            <li>maintain records of enquiries and provide our services;</li>
            <li>operate, analyse, and improve the Website; and</li>
            <li>comply with applicable law and respond to lawful requests.</li>
          </ul>
          <p>
            We process this data on the basis of <strong>your consent</strong> (which you
            give when submitting the enquiry form) and for the legitimate purposes for which
            you approach us. You can withdraw consent at any time (see Section 11).
          </p>

          <H n="6">Cookies &amp; Analytics</H>
          <p>
            The Website uses <strong>Google Analytics / Firebase Analytics</strong> to
            understand how visitors use the site. These tools set cookies or similar
            identifiers to collect usage statistics in aggregate. The Website may also load
            resources (such as fonts and icons) from third-party providers, which may receive
            your IP address as part of serving those resources. You can control or block
            cookies through your browser settings; disabling them will not stop the enquiry
            form from working, but some analytics will not be collected.
          </p>

          <H n="7">Who We Share Your Data With</H>
          <p>We do <strong>not sell</strong> your personal data. We may share it with:</p>
          <ul>
            <li><strong>Property owners / their representatives</strong> — to the extent necessary to progress your enquiry and arrange viewings or dealings.</li>
            <li><strong>Service providers (processors)</strong> who help us run the Website and our operations — including <strong>Google (Forms, Sheets, Firebase/Firestore, Analytics, and email/Workspace)</strong>, our messaging channel <strong>WhatsApp (Meta)</strong>, and our website host. These providers process data on our behalf under their own terms.</li>
            <li><strong>Authorities or advisors</strong> — where required by law, regulation, legal process, or to protect our rights.</li>
          </ul>

          <H n="8">International Transfers</H>
          <p>
            Some of our service providers (such as Google and Meta) may store or process
            data on servers located <strong>outside India</strong>. Where this happens, we
            rely on those providers&rsquo; safeguards and process such transfers in
            accordance with applicable Indian law.
          </p>

          <H n="9">How Long We Keep Your Data</H>
          <p>
            We keep enquiry data for as long as necessary to respond to and service your
            enquiry, maintain our business records, and comply with legal obligations, after
            which it is deleted or anonymised. If you ask us to delete your data, we will do
            so unless we are required to retain it by law.
          </p>

          <H n="10">Data Security</H>
          <p>
            We take reasonable technical and organisational measures to protect your data
            against unauthorised access, loss, or misuse, and rely on the security controls
            of established providers such as Google Firebase. However, no method of
            transmission or storage over the internet is completely secure, and we cannot
            guarantee absolute security.
          </p>

          <H n="11">Your Rights</H>
          <p>
            Subject to applicable law, including the Digital Personal Data Protection Act,
            2023, you have the right to:
          </p>
          <ul>
            <li><strong>access</strong> the personal data we hold about you;</li>
            <li>request <strong>correction</strong> of inaccurate or incomplete data;</li>
            <li>request <strong>erasure</strong> of your data;</li>
            <li><strong>withdraw consent</strong> to further contact or processing at any time;</li>
            <li><strong>nominate</strong> another person to exercise your rights in the event of death or incapacity; and</li>
            <li><strong>raise a grievance</strong> with us about how we handle your data.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:info@aagamrealty.com">info@aagamrealty.com</a>. We may need to
            verify your identity before acting on your request.
          </p>

          <H n="12">Children</H>
          <p>
            The Website is intended for users aged <strong>18 and above</strong>. We do not
            knowingly collect personal data from children. If you believe a child has
            provided us data, please contact us and we will delete it.
          </p>

          <H n="13">Links to Other Websites</H>
          <p>
            The Website may link to third-party websites and services (for example, WhatsApp,
            Instagram, Facebook, or property portals). We are not responsible for the privacy
            practices of those sites; please review their policies separately.
          </p>

          <H n="14">Changes to This Policy</H>
          <p>
            We may update this Privacy Policy from time to time. The latest version will
            always be posted on this page with a revised &ldquo;Last updated&rdquo; date.
            Please review it periodically.
          </p>

          <H n="15">Grievance &amp; Contact</H>
          <p>
            For any privacy questions, requests, or grievances, please contact:
          </p>
          <div className="legal__contact">
            <strong>Aagam Realty</strong><br />
            Email: <a href="mailto:info@aagamrealty.com">info@aagamrealty.com</a><br />
            Phone / WhatsApp: <a href="tel:+919227100299">+91 92271 00299</a><br />
            Address: <Todo>[OFFICE ADDRESS — insert full registered/office address]</Todo><br />
            Grievance Officer: <Todo>[NAME — recommended under the DPDP Act, 2023]</Todo>
          </div>
        </div>
      </div>
    </section>
  );
}
