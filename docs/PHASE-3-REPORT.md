# Phase 3 — Assessment and Certification: Completion Report

**Project:** Complete Healthcare Innovative Training Academy
**Phase:** 3 of 7 (examinations, question banks, grading, competency checklists, certificates)
**Date:** November 13, 2026

## 1. Completed functionality

| Spec item | Delivered |
|---|---|
| Question types (§8) | All 9 types: multiple choice, true/false, multiple select (all-or-nothing scoring), matching (partial credit), fill-in-the-blank (ignores case, spacing and punctuation; multiple accepted answers), scenario, image identification, case study, and practical (graded by an instructor). |
| Question banks | One bank per course, edited in the course builder (organization and platform scopes) using a plain-text form for every type. Per-question answer counts and correct-answer rates are shown. **Questions already used in an exam can't be edited** — authors retire them and add a replacement, so past results stay accurate. |
| Exam configuration | Passing score, questions per attempt, random selection and order, attempts allowed, time limit, mandatory flag. Settings are part of the course version: frozen once published, and carried into new versions. The 3 library courses ship with 15-question mandatory final exams. |
| Exam taking | One question per screen with a question navigator, answers saved automatically as the learner goes (attempts can be resumed), a countdown timer that submits automatically at zero, and a final review warning about unanswered questions. Correct answers are never sent to the browser. |
| Grading | Automatic grading on the server. Scores round down, so 79.9% never passes an 80% exam. Practical items queue for an instructor, who grades them against the rubric and leaves feedback; the attempt finalizes when every item is scored. Graders can't grade their own exams. |
| Explanations and review | Each question's explanation appears after submission. Correct answers are revealed only after the learner passes or uses the last attempt, which discourages answer harvesting. |
| Failed exams and retakes | After a failed attempt the learner is notified with the number of attempts left. Using the last attempt marks the enrollment FAILED and notifies the learner's supervisor. A training administrator can authorize 1–3 more attempts, with a reason that goes into the audit log. |
| Exam history and analytics | Learner exam history in My Learning. The Instructor Portal shows attempts, pass rate, average score per course, the most-missed questions, the grading queue and retake requests. |
| No certificate without the exam (§8) | Passing is checked in the database: an attempt can't be recorded as passed below the passing score, and an enrollment can't complete while a mandatory exam is unpassed (from Phase 2). Certificates require a completed enrollment. |
| Competency checklists (§9) | 12 checklist templates covering all skills listed in §9, with critical criteria flagged. Evaluators record Met / Not met / N/A for each criterion with notes; critical criteria can't be marked N/A. The result is calculated automatically (Pass / Needs remediation / Fail), and remediation is required for anything other than a pass. Records also hold evidence links and the next assessment date. |
| Electronic signatures | Signing requires re-entering the password, ticking an attestation, and the `competency.sign` permission. Only the evaluator who recorded the observations can sign, and nobody can evaluate themselves. A SHA-256 signature hash binds the signer, time and record content, and the record page re-checks it every time it's viewed ("Signature verified"). Signed records can only be voided, with a reason. The employee is notified. |
| Competency matrix | Employees × skills grid showing the latest signed result, overdue reassessments and recent evaluations (limited to a Facility Administrator's own facility). Printable verification record. Learners see their own signed evaluations in My Learning. **Finishing a course never creates or implies a competency record.** |
| Certificates (§10) | Issued automatically when the course is complete. Each certificate shows the academy name and mark, recipient, course title and ID, completion date, training hours, certificate number, issuing authority, a verification QR code and URL, and its status. PDFs are generated on the server (US Letter, landscape) and stamped "EXPIRED", "REVOKED" or "SUPERSEDED" when no longer active. |
| Verification | Public `/verify` and `/verify/{code}` pages (no sign-in) show Valid / Expired / Superseded / Revoked with only the details needed to confirm the certificate. Lookups are rate-limited and logged with hashed IP addresses. |
| Expiration, revocation, renewal, history | Expiry dates come from the course's renewal interval (12 months for Bloodborne Pathogens). A daily scheduled job (`/api/cron/expire-certificates`, protected by `CRON_SECRET`, configured in `vercel.json`) marks certificates expired and notifies the holder. Revocation is permanent: it requires a reason, notifies the holder and shows on the verification page. Renewing means completing the course again, which issues a new certificate and marks the old one superseded. Each certificate page lists the full history for that course and recent verifications. |
| Record types kept separate (§10) | Course completion certificates are kept separate from competency verification records. Continuing-education certificates are **impossible** unless an accreditation approval is recorded (database rule). External licenses use the `licenses` table (profiles come in Phase 4). The disclaimer *"not a state license, professional certification, or accredited CE credit"* appears on every certificate, PDF and verification page. |
| Notifications | In-app notifications for certificate ready, exam failed, supervisor alerts, retake authorized, exam graded, certificate revoked or expired, and skills evaluation recorded. Email and SMS delivery are added in Phase 4. |

## 2. Rules enforced by the database (migrations 0004–0005)

- **Exam privacy:** learners see only their own attempts and answers; graders and training administrators see everyone in the organization.
- **Competency privacy:** learners see only their own competency records. **Certificate privacy:** learners see only their own certificates; verification logs are visible only to administrators.
- **Attempt rules:**
  - Exams open only after all lessons are complete.
  - Attempt limits are enforced (allowed attempts plus any authorized extras), and attempt numbers run in sequence.
  - Questions must belong to the attempt.
  - Answers can't change after submission or after the time limit expires.
  - Final grades can't change, a pass can't be recorded below the passing score, and attempts and answers can't be deleted.
- **Retakes:** learners can't raise their own attempt allowance, and an allowance can never be reduced.
- **Competency signing:** only users with signing authority, only the evaluator, never self-evaluation. Signed records are immutable; voiding needs a reason and the voiding user, and voided records are final.
- `chta_apply_security()` v3 keeps certificate verification logs writable only by the platform.

## 3. Verification

| Check | Result |
|---|---|
| TypeScript, ESLint (zero warnings), production build | Pass |
| Unit tests | **52 passed** (15 new): grading for every type, round-down scoring, random selection, question form parsing in both directions, invalid-question rejection, competency result calculation, signature binding, certificate codes and numbers, month-end expiry math, effective status, and PDF generation |
| Integration tests (PostgreSQL) | **78 passed** (15 new). They cover: exam locked until lessons are done; randomized, resumable attempts with answers hidden; autosave and privacy; immutable submissions and grades; FAILED status plus supervisor notification after the last attempt; DB-enforced retake authorization; pass → completion → certificate with expiry; renewal superseding the old certificate; time-limit enforcement and finalizing expired attempts; instructor grading including no self-grading; certificate privacy; public verification with logging; permanent revocation; scheduled expiry; competency validation, no self-evaluation, password-gated signing with hash verification, immutability, voiding, and DB-enforced signing rights. |
| End-to-end tests (Playwright, production build) | **21 passed** (5 new): a learner fails, reviews explanations, retakes and passes the Standard Precautions exam → certificate → PDF download → public verification shows Valid. Cross-organization certificate isolation. A supervisor records a Needs-remediation PPE evaluation, a wrong password is rejected, then signing succeeds with the signature verified. An admin revokes a certificate and verification shows Revoked. The Instructor Portal analytics. The platform question bank, frozen on published versions. |

The demo seed now runs real activity **through the production services**: Grace passes HIPAA and receives a certificate, Jordan finishes all Standard Precautions lessons (exam pending), and Grace signs a hand hygiene evaluation for Ana.

## 4. Best-practice notes and decisions

1. **Answer harvesting.** Random draws from a bank larger than the exam, plus revealing correct answers only after passing or the final attempt, reduce memorization. **Recommendation:** grow each bank to 25–40 questions so attempts differ meaningfully.
2. **Time limits** are enforced in the database (answers freeze 60 seconds after expiry), not just in the browser.
3. **Electronic signatures** follow common e-signature practice: re-authentication, an explicit attestation, signer identity and time, and tamper-evident hashing. Have counsel confirm your signature policy wording and record-retention rules for your accreditor and state.
4. **Competency checklists are templates.** Have clinical leadership review and adapt them, and set renewal intervals per organization. Intervals are deliberately left unset because they vary by licensure, accreditor and policy (configured in Phase 5).
5. **Scheduled jobs:** set `CRON_SECRET` in hosting. Vercel Cron calls the expiry job daily at 06:15 UTC.
6. **Library question banks** were drafted with AI assistance alongside the course content and need the same qualified review before production use.

## 5. Deferred, with the phase that delivers each

| Item | Phase |
|---|---|
| Email/SMS delivery of notifications; expiry warnings at 90/60/30/15/7 days; supervisor escalation | 4 |
| Employee profiles and external licenses/certifications management | 4 |
| Training applicability rules that set competency and course renewal intervals per facility type and role | 5 |
| Facility-scoped visibility of certificates and attempts for Facility Administrators (currently organization-wide for `certificates.view_all`) | 4, with Employee Management |
| Uploading images and evidence files for image-identification questions and competency evidence (currently https links) | 6 (secure object storage) |
| Remaining 12 priority courses with their exam banks | 3–5 |
