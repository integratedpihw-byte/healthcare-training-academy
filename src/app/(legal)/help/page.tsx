import Link from "next/link";
import { supportEmail } from "@/lib/site";

export const metadata = { title: "Help" };
export const dynamic = "force-dynamic";

const FAQ: [string, React.ReactNode][] = [
  ["I can't sign in", <>Use <Link className="text-teal-700 underline" href="/forgot-password">Forgot password</Link> to get a reset link by email. After five incorrect passwords an account locks for 15 minutes, then unlocks by itself.</>],
  ["I never received my invitation or reset email", "Check your spam folder and confirm with your administrator that your email address is spelled correctly on your employee record. Invitation links last 72 hours; reset links last 30 minutes. Your administrator can send a new invitation."],
  ["I lost the phone with my authenticator app", "Ask your organization administrator to contact support. After your identity is confirmed, two-step verification is reset and you receive a new password link."],
  ["Where is my training?", "Sign in and open My Learning. Assigned courses show a due date and a Start or Resume button. Your progress is saved automatically."],
  ["How do I get my certificate?", "Certificates appear under Certificates as soon as you finish a course and pass its examination. You can download a PDF, and anyone can confirm it with the verification code printed on it."],
  ["I failed an examination", "You can retake it until the allowed attempts are used. After that, your supervisor or instructor can authorize more attempts."],
  ["I think a record about me is wrong", "Training and employment records are maintained by your organization. Contact your supervisor or organization administrator to have it corrected."],
  ["How do I verify someone's certificate?", <>Enter the code from the certificate at <Link className="text-teal-700 underline" href="/verify">Verify a certificate</Link>. No account is needed.</>],
];

export default function HelpPage() {
  const email = supportEmail();
  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">Help</h1>
      <p>Answers to the most common questions. For anything about your assignments, role or employee record, your organization administrator is the fastest contact.</p>
      {FAQ.map(([q, a]) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
      <h2>Contact support</h2>
      <p>{email ? <>Email <a className="text-teal-700 underline" href={`mailto:${email}`}>{email}</a>. Please do not include patient information.</> : "Contact your organization administrator, who can reach platform support on your behalf."}</p>
    </>
  );
}
