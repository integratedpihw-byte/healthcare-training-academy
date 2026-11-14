import { legalEntity, supportEmail } from "@/lib/site";

export const metadata = { title: "Privacy Policy" };
export const dynamic = "force-dynamic";
const EFFECTIVE = "November 14, 2026";

export default function PrivacyPage() {
  const entity = legalEntity();
  const email = supportEmail();
  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">Privacy Policy</h1>
      <p>Effective {EFFECTIVE}. This policy explains how {entity} handles personal information in Complete Healthcare Training Academy (the &ldquo;Service&rdquo;).</p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account information:</strong> name, email address, password (stored only as a one-way hash) and two-step verification settings.</li>
        <li><strong>Workforce records entered by your organization:</strong> job title, facility, hire date, professional license details and uploaded documents, training assignments, examination results, competency evaluations and certificates.</li>
        <li><strong>Usage and security information:</strong> sign-in times, IP address, browser type, and an audit trail of significant actions.</li>
        <li><strong>Billing information:</strong> plan and invoices. Card details are handled by our payment processor and are not stored by the Service.</li>
      </ul>
      <p>The Service is not intended to hold patient information, and users are instructed not to enter it.</p>

      <h2>How we use information</h2>
      <ul>
        <li>To provide training, track completion and compliance, issue and verify certificates, and send related notifications.</li>
        <li>To secure accounts, prevent misuse and keep audit records.</li>
        <li>To bill for subscriptions and provide support.</li>
      </ul>
      <p>We do not sell personal information and do not use it for advertising.</p>

      <h2>Who can see it</h2>
      <ul>
        <li><strong>Your organization:</strong> administrators, supervisors and instructors see workforce and training records according to the roles your organization assigns. Each organization&rsquo;s data is isolated from every other organization&rsquo;s.</li>
        <li><strong>Certificate verification:</strong> anyone with a certificate&rsquo;s verification code can see the recipient&rsquo;s name, the course, dates and status.</li>
        <li><strong>Service providers:</strong> hosting, database, file storage, email and text messaging, and payment processing providers process data on our behalf under contract.</li>
        <li><strong>AI assistant:</strong> questions you type into the optional AI assistant are sent to our AI provider to produce an answer. They are not stored by the Service. Do not include personal or patient information in questions.</li>
        <li><strong>Legal:</strong> when required by law or to protect rights and safety.</li>
      </ul>

      <h2>Cookies</h2>
      <p>The Service uses one essential cookie to keep you signed in. It does not use advertising or third-party tracking cookies.</p>

      <h2>Security</h2>
      <p>Data is encrypted in transit and at rest. Access is limited by role, optional or required two-step verification, session time-outs, and a tamper-evident audit trail. No system is perfectly secure; report concerns using the contact below.</p>

      <h2>Retention</h2>
      <p>Training, competency and certificate records are kept for as long as your organization&rsquo;s account is active and afterwards for the period needed to meet regulatory record-keeping duties. Audit entries cannot be edited or deleted. Organization administrators can export their records.</p>

      <h2>Your choices</h2>
      <p>You can update your profile, password and notification preferences in Settings. Because most records are maintained by your employer or school, requests to access, correct or delete workforce records should go to your organization administrator first; we will assist them in responding.</p>

      <h2>Children</h2>
      <p>The Service is for healthcare workers and students aged 16 and over and is not directed to children.</p>

      <h2>Changes</h2>
      <p>We will post updates here and change the effective date. Material changes will be announced in the Service.</p>

      <h2>Contact</h2>
      <p>{email ? <>Privacy questions: <a className="text-teal-700 underline" href={`mailto:${email}`}>{email}</a>.</> : "Privacy questions can be sent to your organization administrator or to the support contact shown in the Service."}</p>
    </>
  );
}
