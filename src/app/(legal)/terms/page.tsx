import { legalEntity, supportEmail } from "@/lib/site";

export const metadata = { title: "Terms of Service" };
export const dynamic = "force-dynamic";
/** Update when the terms change; shown to users and recorded with their acceptance date. */
const EFFECTIVE = "November 14, 2026";

export default function TermsPage() {
  const entity = legalEntity();
  const email = supportEmail();
  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">Terms of Service</h1>
      <p>Effective {EFFECTIVE}. These terms govern use of Complete Healthcare Training Academy (the &ldquo;Service&rdquo;), operated by {entity}.</p>

      <h2>1. The Service</h2>
      <p>The Service provides workforce training, competency records and compliance tracking for healthcare organizations and individual learners. It is an education and record-keeping tool. It does not provide medical, legal or regulatory advice, and it does not replace your organization&rsquo;s own policies or the judgment of licensed professionals.</p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must give accurate information and keep your password and two-step verification device secure. You are responsible for activity under your account.</li>
        <li>Organization administrators decide who in their organization has access and which roles they hold.</li>
        <li>Tell us promptly if you believe an account has been compromised.</li>
      </ul>

      <h2>3. Certificates and compliance information</h2>
      <ul>
        <li>Course completion certificates issued through the Service are internal training records. They are not state licenses and are not accredited continuing education unless a course says so explicitly.</li>
        <li>Regulatory summaries and requirement mappings are provided to help you plan training. Rules change; your organization remains responsible for confirming current requirements with the governing agency.</li>
      </ul>

      <h2>4. No patient information</h2>
      <p>Do not enter protected health information (PHI) or other patient-identifying information into the Service, including in uploads, notes, messages or the AI assistant. The Service is designed for workforce records, not patient records.</p>

      <h2>5. Acceptable use</h2>
      <p>You may not misuse the Service: for example by attempting to access another organization&rsquo;s data, sharing accounts, completing training or examinations on behalf of another person, falsifying training or competency records, uploading malicious files, or interfering with the Service&rsquo;s operation.</p>

      <h2>6. Your content</h2>
      <p>Your organization keeps ownership of the records and course materials it adds. You grant us the rights needed to host and process that content to provide the Service. Course materials in the platform library belong to {entity} or its licensors and may be used only within the Service.</p>

      <h2>7. Subscriptions and billing</h2>
      <p>Paid plans are billed in advance through our payment processor according to the plan and billing cycle you choose. Trials convert or end as described at sign-up. Fees are non-refundable except where required by law or stated otherwise in a written agreement with us.</p>

      <h2>8. Availability and changes</h2>
      <p>We work to keep the Service available and secure but do not guarantee uninterrupted operation. We may change features, and we will give reasonable notice of changes that materially reduce functionality you pay for.</p>

      <h2>9. Termination</h2>
      <p>You may stop using the Service at any time. We may suspend or close accounts that violate these terms. Organization administrators may export their records before closing an account; some records are retained as described in the Privacy Policy.</p>

      <h2>10. Disclaimers and liability</h2>
      <p>The Service is provided &ldquo;as is.&rdquo; To the extent permitted by law, {entity} disclaims implied warranties and is not liable for indirect or consequential damages, and its total liability is limited to the fees you paid for the Service in the twelve months before the claim.</p>

      <h2>11. Governing law</h2>
      <p>These terms are governed by the laws of the State of Florida, without regard to conflict-of-law rules.</p>

      <h2>12. Contact</h2>
      <p>{email ? <>Questions about these terms: <a className="text-teal-700 underline" href={`mailto:${email}`}>{email}</a>.</> : "Questions about these terms can be sent to your organization administrator or to the support contact shown in the Service."}</p>
    </>
  );
}
