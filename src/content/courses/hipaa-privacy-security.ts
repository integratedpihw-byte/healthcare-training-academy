import type { CourseContent } from "../types";

const ACCESSED = "2026-11-13";

export const hipaaPrivacySecurity: CourseContent = {
  code: "CHTA-MC-001",
  title: "HIPAA Privacy and Security for the Healthcare Workforce",
  categorySlug: "mandatory-compliance",
  isRequiredByDefault: true,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis:
    "HIPAA requires workforce training for new members within a reasonable period and when policies materially change (45 CFR 164.530(b)); it sets no fixed federal renewal interval. Many organizations adopt annual refreshers as policy — configure in the Compliance Center.",
  estimatedMinutes: 60,
  clinicalReviewRequired: false,
  description:
    "A practical introduction to the HIPAA Privacy, Security and Breach Notification Rules for everyone who works in or for a healthcare organization. Learners will understand what protected health information (PHI) is, when it may be used and shared, the rights patients have over their information, the safeguards that protect electronic PHI, and exactly what to do when something goes wrong. The course uses everyday scenarios from clinics, assisted living facilities, home health and front-office work.",
  targetAudience:
    "All workforce members of covered entities and business associates: clinical and non-clinical staff, volunteers, trainees, contractors working on site, and administrative personnel.",
  prerequisites: [],
  completionCriteria:
    "Complete every required lesson and knowledge check, then pass the final examination with a score of 80% or higher. Completion does not replace your organization's own privacy and security policies, which you must also follow.",
  objectives: [
    "Define protected health information (PHI) and electronic PHI, and identify covered entities and business associates.",
    "Explain when PHI may be used or disclosed without patient authorization (treatment, payment and health care operations) and when an authorization is required.",
    "Apply the minimum necessary standard and role-based access in daily work.",
    "Describe patients' rights under the Privacy Rule, including access to their records.",
    "Identify administrative, physical and technical safeguards required by the Security Rule and your role in keeping ePHI secure.",
    "Recognize a potential breach, report it immediately, and describe the Breach Notification Rule timelines.",
  ],
  regulatoryReferences: [
    { agency: "HHS Office for Civil Rights", citation: "45 CFR Part 160 and Part 164, Subparts A and E", title: "HIPAA Privacy Rule", url: "https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" },
    { agency: "HHS Office for Civil Rights", citation: "45 CFR Part 164, Subpart C", title: "HIPAA Security Rule", url: "https://www.hhs.gov/hipaa/for-professionals/security/index.html" },
    { agency: "HHS Office for Civil Rights", citation: "45 CFR 164.400–414", title: "HIPAA Breach Notification Rule", url: "https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html" },
    { agency: "HHS Office for Civil Rights", citation: "45 CFR 164.530(b)", title: "Privacy Rule workforce training standard", url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-E/section-164.530" },
  ],
  sourceReferences: [
    { title: "Summary of the HIPAA Privacy Rule", publisher: "U.S. Department of Health and Human Services", url: "https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html", publishedOn: "2025-03-14", accessedOn: ACCESSED },
    { title: "Breach Notification Rule", publisher: "U.S. Department of Health and Human Services", url: "https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html", accessedOn: ACCESSED },
    { title: "Summary of the HIPAA Security Rule", publisher: "U.S. Department of Health and Human Services", url: "https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html", accessedOn: ACCESSED },
    { title: "Individuals' Right under HIPAA to Access their Health Information", publisher: "U.S. Department of Health and Human Services", url: "https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/access/index.html", accessedOn: ACCESSED },
    { title: "HIPAA Security Rule Notice of Proposed Rulemaking (published January 6, 2025)", publisher: "Federal Register", url: "https://www.federalregister.gov/documents/2025/01/06/2024-30983/hipaa-security-rule-to-strengthen-the-cybersecurity-of-electronic-protected-health-information", publishedOn: "2025-01-06", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Why HIPAA matters and who it covers",
      summary: "The purpose of HIPAA, covered entities, business associates, and what counts as PHI.",
      lessons: [
        {
          title: "Introduction: trust is part of care",
          type: "TEXT",
          durationMinutes: 5,
          body: `Patients tell us things they may not tell anyone else. They trust that their diagnoses, medications, test results and even the fact that they are a patient will be handled with care. The **Health Insurance Portability and Accountability Act (HIPAA)** turns that expectation into federal rules.

HIPAA's privacy and security protections are made up of three rules you will learn in this course:

| Rule | What it does |
|---|---|
| **Privacy Rule** | Sets the conditions for using and disclosing protected health information and gives patients rights over their information. |
| **Security Rule** | Requires safeguards for *electronic* protected health information (ePHI). |
| **Breach Notification Rule** | Requires notice to patients, HHS and sometimes the media when unsecured PHI is breached. |

The rules are enforced by the **HHS Office for Civil Rights (OCR)**. Violations can lead to corrective action plans and civil money penalties for organizations, and some intentional misuse of health information is a federal crime. Just as important, a privacy failure can harm a patient — through embarrassment, discrimination, identity theft or loss of trust in their care team.

> **Your role:** HIPAA applies to the whole workforce — employees, volunteers, trainees and others whose work is directed by the organization — not just doctors and nurses. Your organization's policies may be stricter than HIPAA, and Florida and other states have their own privacy laws. Always follow the stricter rule.`,
        },
        {
          title: "Covered entities, business associates and PHI",
          type: "TEXT",
          durationMinutes: 8,
          body: `### Who must follow HIPAA?

**Covered entities** are:

- **Health care providers** that transmit health information electronically in connection with standard transactions such as claims or eligibility checks (most hospitals, clinics, practices, pharmacies, labs, home health agencies and many long-term care providers).
- **Health plans** (insurers, HMOs, Medicare, Medicaid and most employer group health plans).
- **Health care clearinghouses** that convert nonstandard data into standard formats.

**Business associates** are people or companies — other than workforce members — that perform services for a covered entity involving PHI. Examples: billing companies, IT and cloud vendors, transcription services, shredding companies, and consultants. Covered entities must have a **business associate agreement (BAA)** with them, and business associates are directly liable for complying with the Security Rule and parts of the Privacy Rule.

### What is protected health information (PHI)?

PHI is **individually identifiable health information** held or transmitted by a covered entity or business associate, **in any form — electronic, paper or spoken**. It relates to:

- a person's past, present or future physical or mental health or condition,
- the health care provided to them, or
- payment for that care,

and it identifies the person or could reasonably be used to identify them. Identifiers include names, addresses, dates related to the person (such as birth or admission dates), phone numbers, email addresses, Social Security numbers, medical record numbers, health plan numbers, photographs and more.

**Electronic PHI (ePHI)** is PHI created, received, kept or sent in electronic form — EHR entries, emails, texts, scanned documents, data on laptops, phones and USB drives.

### What is *not* PHI?

- **Employment records** a covered entity holds in its role as an employer (for example, your own sick-leave note in your HR file).
- **De-identified information**, created either by an expert determination or by removing specified identifiers under the "safe harbor" method.

> **Example:** A whiteboard in a staff area lists "Room 12 — Mr. Alvarez — diabetic, fall risk." That is PHI: it links an identifiable person to health information. Whether it is acceptable depends on who can see it and why — which is the subject of the next module.`,
        },
        {
          title: "Knowledge check: the basics",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 4,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "Which of the following is PHI?",
                options: [
                  { id: "a", text: "A de-identified dataset of average blood pressure readings" },
                  { id: "b", text: "A voicemail left by a nurse saying a named patient's lab results are ready" },
                  { id: "c", text: "Your own personnel file kept by Human Resources" },
                  { id: "d", text: "A public brochure about flu vaccines" },
                ],
                correct: "b",
                explanation: "PHI can be spoken, written or electronic. A voicemail that links a named person to their lab results is identifiable health information.",
              },
              {
                id: "k2",
                prompt: "A cloud company that stores your facility's scanned medical records is a…",
                options: [
                  { id: "a", text: "Covered entity" },
                  { id: "b", text: "Business associate that must sign a business associate agreement" },
                  { id: "c", text: "Workforce member" },
                  { id: "d", text: "Not subject to HIPAA because it never looks at the records" },
                ],
                correct: "b",
                explanation: "A vendor that creates, receives, maintains or transmits PHI on behalf of a covered entity is a business associate, even if it does not routinely view the data.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "2. Using and sharing PHI correctly",
      summary: "Treatment, payment and operations; authorizations; minimum necessary; incidental disclosures.",
      lessons: [
        {
          title: "When PHI may be used or disclosed",
          type: "TEXT",
          durationMinutes: 9,
          body: `The Privacy Rule starts from a simple principle: **PHI may be used or disclosed only as the rule permits or requires.**

### Required disclosures
A covered entity *must* disclose PHI (1) to the individual (or their personal representative) when they request access or an accounting of disclosures, and (2) to HHS during a compliance investigation.

### Treatment, payment and health care operations (TPO)
Without the patient's written authorization, PHI may be used and shared for:

- **Treatment** — providing, coordinating or managing care, including consultations and referrals between providers.
- **Payment** — billing, claims, eligibility and coverage determinations.
- **Health care operations** — quality improvement, staff training, credentialing, audits, compliance programs and business management.

### Other permitted disclosures
The rule also permits certain disclosures for public interest purposes — for example, to public health authorities, for reporting abuse, neglect or domestic violence as required by law, for health oversight, for certain law-enforcement purposes, to avert a serious threat to health or safety, and as required by law. Each has specific conditions. **Do not make these disclosures on your own** — route requests from police, attorneys, media or government agencies to your Privacy Officer unless your policy assigns the task to you.

### Family members and friends
You may share relevant information with family or friends involved in a patient's care or payment if the patient agrees, does not object when given the chance, or — when the patient is not present or is incapacitated — you judge it to be in their best interest. Share only what is relevant to that person's involvement.

### When an authorization is required
A signed **authorization** is required for uses and disclosures not otherwise permitted, including most **marketing**, any **sale of PHI**, and most uses of **psychotherapy notes**. Additional federal rules protect substance use disorder treatment records from certain programs (42 CFR Part 2), and state law may add protections (for example, for HIV status or mental health records). Check your policy before sharing these categories.`,
        },
        {
          title: "Minimum necessary and role-based access",
          type: "TEXT",
          durationMinutes: 7,
          body: `### The minimum necessary standard
For most uses, disclosures and requests, you must make reasonable efforts to limit PHI to the **minimum necessary** to accomplish the purpose.

The standard does **not** apply to:
- disclosures to another provider **for treatment**,
- disclosures to the **patient** themselves,
- disclosures made under a valid **authorization**,
- disclosures **required by law** or to HHS for compliance.

### Role-based access
Your organization must decide which workforce members need access to which PHI. Your system access reflects your job. **Having technical access to a record is not permission to look at it.** Only access PHI when you need it to do your job.

Common violations OCR and employers see:
- Looking up a celebrity, coworker, neighbor, ex-partner or family member out of curiosity.
- Checking your own record through work access instead of the patient portal or HIM request process (follow your policy).
- Sharing a full chart when a single lab value was requested.

### Incidental uses and disclosures
Some exposure is unavoidable — a visitor overhearing a quiet bedside conversation, or a name called in a waiting room. These **incidental** disclosures are not violations **if** you used reasonable safeguards and followed minimum necessary. Reasonable safeguards include speaking quietly, closing doors and curtains when possible, positioning screens away from public view, and not leaving charts or printouts unattended.`,
        },
        {
          title: "Case study: the busy front desk",
          type: "CASE_STUDY",
          durationMinutes: 6,
          body: `**Setting:** A community clinic's front desk at 8:15 a.m. Twelve patients are waiting.

1. **The sign-in sheet.** Patients write their name and reason for visit on a clipboard sheet. *Issue:* the reason for visit is visible to everyone who signs in after them. *Better practice:* collect only names (or use a check-in kiosk) and ask about the reason privately.

2. **The phone call.** A caller says she is a patient's daughter and asks whether her father's biopsy result came back. *Issue:* you cannot verify who she is, and the patient's preferences are unknown. *Better practice:* verify identity and check the record for the patient's listed contacts and preferences; if you cannot confirm, take a message for the clinician or the patient.

3. **The monitor.** The check-in computer faces the waiting room and shows the schedule with diagnoses. *Better practice:* reposition the screen or use a privacy filter and lock the screen when stepping away.

4. **The pharmacy call.** A pharmacist calls to confirm a prescription the physician sent. *Analysis:* this is a disclosure for **treatment**; you may share what the pharmacist needs, after confirming you are speaking with the pharmacy.

**Discussion:** Which of these practices exist in your workplace? Report safeguard gaps to your supervisor or Privacy Officer — fixing them is part of compliance.`,
        },
        {
          title: "Knowledge check: uses and disclosures",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 4,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "A physician at another practice calls to coordinate care for a shared patient. Does the minimum necessary standard limit what you may share for this purpose?",
                options: [
                  { id: "a", text: "Yes — share only what is strictly unavoidable" },
                  { id: "b", text: "No — minimum necessary does not apply to disclosures to a provider for treatment" },
                  { id: "c", text: "You must first obtain written authorization" },
                ],
                correct: "b",
                explanation: "Disclosures to a health care provider for treatment are excluded from the minimum necessary standard, although you should still confirm who you are talking to.",
              },
              {
                id: "k2",
                prompt: "You have EHR access to all patients in your facility. A well-known local politician is admitted. You are not involved in his care. May you look at his record?",
                options: [
                  { id: "a", text: "Yes, because the system lets you" },
                  { id: "b", text: "Only if you do not tell anyone what you saw" },
                  { id: "c", text: "No — access is permitted only when needed for your job" },
                ],
                correct: "c",
                explanation: "Technical access is not authorization. Curiosity-driven access is a privacy violation and a common cause of discipline and termination. Access is logged and audited.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "3. Patient rights",
      summary: "Access, amendment, accounting of disclosures, restrictions, confidential communications and the Notice of Privacy Practices.",
      lessons: [
        {
          title: "The rights patients have over their information",
          type: "PRESENTATION",
          durationMinutes: 8,
          body: `## Patient rights under the Privacy Rule
Patients are partners in protecting their information. The Privacy Rule gives them six core rights.

---
## 1. Right of access
- Patients may inspect and get copies of their PHI in the **designated record set** (medical and billing records), including electronic copies when the records are electronic.
- The covered entity must act on a request **no later than 30 days** after receiving it, with one possible 30-day extension if the patient is told the reason in writing (45 CFR 164.524).
- Only a reasonable, **cost-based** fee may be charged.
- Patients can direct that a copy be sent to a person they choose.

**Do not delay or discourage access requests.** OCR has made access enforcement a priority. Route requests promptly per policy.

---
## 2. Right to request amendment
- Patients may ask to correct information they believe is inaccurate or incomplete.
- A denial must be in writing and the patient may submit a statement of disagreement.

---
## 3. Right to an accounting of disclosures
- Patients may request a list of certain disclosures made in the **six years** before the request.
- Disclosures for treatment, payment and operations, and those the patient authorized, are generally excluded.

---
## 4. Right to request restrictions
- Patients may ask you to limit uses or disclosures. Providers usually need not agree — **but** if a patient pays in full out of pocket and asks that the information not go to their health plan, the provider must agree (with limited exceptions).
- Once agreed, a restriction must be honored except in an emergency.

---
## 5. Right to confidential communications
- Patients may ask to be contacted at an alternative address or phone number, or by a particular method. Providers must accommodate reasonable requests.

---
## 6. Notice of Privacy Practices (NPP)
- Patients have the right to a notice explaining how their information may be used and their rights.
- Providers with direct treatment relationships make a good-faith effort to get written acknowledgment that the patient received it.
- Patients may file complaints with the organization or with HHS OCR, and **retaliation is prohibited**.`,
        },
        {
          title: "Knowledge check: patient rights",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 3,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "A patient asks at the front desk for a copy of her lab results from last month. What is the best response?",
                options: [
                  { id: "a", text: "Tell her she must ask her doctor for permission first" },
                  { id: "b", text: "Explain how to submit the access request (or process it per policy) so it is fulfilled within the required timeframe" },
                  { id: "c", text: "Tell her records are only released to other providers" },
                ],
                correct: "b",
                explanation: "Patients have a right to access their records. Help them use your organization's process; the request must be acted on within 30 days (one 30-day extension possible).",
              },
              {
                id: "k2",
                prompt: "A patient pays in full for a visit and asks that the information not be sent to his health plan. The provider must:",
                options: [
                  { id: "a", text: "Agree to the restriction (limited exceptions apply)" },
                  { id: "b", text: "Refuse, because health plans are always entitled to claims data" },
                  { id: "c", text: "Decide case by case with no obligation" },
                ],
                correct: "a",
                explanation: "This is the one restriction request a provider generally must honor: self-paid services withheld from the health plan.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "4. Security safeguards for electronic PHI",
      summary: "Administrative, physical and technical safeguards and everyday cybersecurity behaviors.",
      lessons: [
        {
          title: "The Security Rule in plain language",
          type: "TEXT",
          durationMinutes: 8,
          body: `The Security Rule requires covered entities and business associates to protect the **confidentiality, integrity and availability** of ePHI by using three types of safeguards.

### Administrative safeguards
- A documented **risk analysis** and risk management program — OCR frequently cites missing or outdated risk analyses.
- A designated **Security Official**.
- **Workforce security**: appropriate access granted, changed and removed promptly when roles change or people leave.
- **Security awareness and training**, including protection from malicious software, log-in monitoring and password management.
- **Security incident procedures** and **contingency planning** (data backup, disaster recovery, emergency operations).
- **Business associate agreements** that require vendors to safeguard ePHI.

### Physical safeguards
- Facility access controls (badges, locked server rooms, visitor procedures).
- Workstation use and security (screen positioning, automatic locks, cable locks).
- Device and media controls: tracking, re-use, and **secure disposal** of laptops, drives, copiers and phones that held ePHI.

### Technical safeguards
- **Unique user IDs** and emergency access procedures.
- Automatic log-off, **encryption** where reasonable and appropriate, and audit controls that record who accessed what.
- Integrity controls and person/entity **authentication**.
- Transmission security for ePHI sent over networks.

Some specifications are "required" and others are "addressable" — addressable does **not** mean optional; it means the organization must implement it, an equivalent alternative, or document why neither is reasonable.

> **Regulatory update:** HHS published a proposed rule on January 6, 2025 that would substantially strengthen the Security Rule (for example, making more safeguards mandatory). As of November 2026 it has **not** been finalized, and federal regulatory agendas list a projected final action date of July 2027. The current Security Rule remains fully in force. This course will be revised if a final rule is published.`,
        },
        {
          title: "Your everyday security habits",
          type: "TEXT",
          durationMinutes: 7,
          body: `Most incidents start with an ordinary moment. These habits protect patients and your organization:

**Passwords and log-ins**
- Never share your user ID or password — everything done under your log-in is attributed to you.
- Use long passphrases and multi-factor authentication when offered.
- Lock your screen (Windows + L, or Control + Command + Q on a Mac) every time you step away.

**Email, texting and phishing**
- Be suspicious of urgent messages asking you to log in, open attachments, change payroll details or buy gift cards. Check the sender's real address and hover over links before clicking.
- Report suspected phishing using your organization's reporting button or IT help desk — **reporting quickly is never a mistake**.
- Use only approved, secure methods to send PHI. Do not text PHI from a personal phone or send it to personal email unless your policy explicitly allows a secure method.

**Devices and media**
- Keep laptops, tablets and phones that access ePHI encrypted, updated and physically secure. Never leave them in a vehicle.
- Do not use unapproved USB drives or personal cloud storage for PHI.
- Dispose of paper PHI in locked shred bins; never in regular trash or recycling.

**Social media**
- Never post photos, stories or details about patients or residents — even without names, details can identify someone.

**Home health and community work**
- Keep paperwork in a closed folder or bag, not visible on a car seat. Do not discuss patients in public places.`,
        },
        {
          title: "Knowledge check: security",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 3,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "An email that appears to come from your CEO asks you to urgently open an attached 'updated staff schedule' and log in. What should you do?",
                options: [
                  { id: "a", text: "Open it quickly so you do not miss a shift" },
                  { id: "b", text: "Forward it to coworkers to check whether they got it too" },
                  { id: "c", text: "Do not click; report it as suspected phishing using your organization's process" },
                ],
                correct: "c",
                explanation: "Urgency plus an unexpected attachment or log-in request is a classic phishing pattern. Report it; do not forward it.",
              },
              {
                id: "k2",
                prompt: "\"Addressable\" Security Rule specifications are:",
                options: [
                  { id: "a", text: "Optional — organizations may ignore them" },
                  { id: "b", text: "Implemented if reasonable and appropriate, or replaced with an equivalent measure, with the decision documented" },
                  { id: "c", text: "Only for large hospitals" },
                ],
                correct: "b",
                explanation: "Addressable means the organization must assess, implement or adopt an equivalent alternative, and document its reasoning.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "5. Breaches, incidents and reporting",
      summary: "Recognizing a breach, the four-factor risk assessment, notification timelines, and your duty to report.",
      lessons: [
        {
          title: "What is a breach and what happens next",
          type: "TEXT",
          durationMinutes: 8,
          body: `### Definition
A **breach** is an impermissible use or disclosure of PHI that compromises its security or privacy. An impermissible use or disclosure is **presumed to be a breach** unless the organization demonstrates, through a documented risk assessment, a **low probability that the PHI was compromised**. That assessment considers at least:

1. The nature and extent of the PHI involved (types of identifiers, likelihood of re-identification).
2. The unauthorized person who used the PHI or received it.
3. Whether the PHI was actually acquired or viewed.
4. The extent to which the risk has been mitigated.

Notification duties apply to **unsecured PHI** — PHI that has not been rendered unusable, unreadable or indecipherable through methods HHS specifies, such as proper **encryption** or **destruction**. This is one reason encryption of devices matters so much.

### Notification timelines
| Who is notified | When |
|---|---|
| **Affected individuals** | Without unreasonable delay and **no later than 60 calendar days** after discovery. |
| **Media** | If more than **500 residents of a state or jurisdiction** are affected — same 60-day limit. |
| **HHS** — 500 or more individuals | Without unreasonable delay and no later than 60 days after discovery. |
| **HHS** — fewer than 500 individuals | May be logged and reported annually, within 60 days after the end of the calendar year. |
| **Business associate → covered entity** | Without unreasonable delay and no later than 60 days after discovery. |

A breach is treated as "discovered" on the first day it is known — **or reasonably should have been known** — to any workforce member other than the person who committed it. That is why prompt internal reporting is essential: the clock may already be running.

State laws (including Florida's data breach law) may impose additional or shorter requirements. Your Privacy Officer determines the obligations — your job is to report.`,
        },
        {
          title: "Case study: three incidents",
          type: "CASE_STUDY",
          durationMinutes: 6,
          body: `**Incident A — misdirected fax.** A medication list for one resident is faxed to the wrong pharmacy. The pharmacist calls to say she received it in error and shredded it.
*What to do:* Report it immediately to your supervisor/Privacy Officer, even though it seems resolved. The organization will document the risk assessment — the recipient, a HIPAA-covered pharmacy, confirmed destruction, which supports a low-probability finding — but **you** do not make that decision.

**Incident B — stolen laptop.** A home health nurse's laptop is stolen from her car. It contains visit notes for 60 patients.
*What to do:* Report immediately (and to police per policy). If the laptop was encrypted to HHS standards, the PHI is "secured" and breach notification may not be required; if not, notification analysis begins at once.

**Incident C — snooping.** An audit shows a unit clerk viewed the records of a coworker who was a patient.
*What to do:* This is an impermissible use. The organization investigates, applies sanctions under its policy, and performs the risk assessment.

**Key lesson:** Report any suspected privacy or security incident **right away** — lost devices, misdirected messages, unusual system behavior, phishing clicks, or overheard conversations that went too far. Most organizations protect good-faith reporters, and HIPAA prohibits retaliation against people who file complaints.`,
        },
        {
          title: "Knowledge check: breach response",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 3,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "You realize you emailed a patient's discharge summary to the wrong 'Maria Lopez.' What is your first step?",
                options: [
                  { id: "a", text: "Wait to see if the recipient responds" },
                  { id: "b", text: "Report it immediately to your supervisor or Privacy Officer per policy" },
                  { id: "c", text: "Decide for yourself whether it counts as a breach" },
                ],
                correct: "b",
                explanation: "Report immediately. The organization performs the documented risk assessment and decides on notification; delays can affect legal deadlines.",
              },
              {
                id: "k2",
                prompt: "What is the outer limit for notifying affected individuals of a breach of unsecured PHI?",
                options: [
                  { id: "a", text: "10 business days" },
                  { id: "b", text: "60 calendar days after discovery, without unreasonable delay" },
                  { id: "c", text: "One year" },
                ],
                correct: "b",
                explanation: "Without unreasonable delay and in no case later than 60 calendar days after discovery. 60 days is an outer limit, not a target.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "6. Summary and resources",
      summary: "Key takeaways and where to get help.",
      lessons: [
        {
          title: "Key takeaways",
          type: "TEXT",
          durationMinutes: 3,
          body: `- PHI is identifiable health information in **any** form — spoken, paper or electronic.
- Use and share PHI only as permitted; treatment, payment and operations are the most common purposes.
- Look only at what you need for your job, share only the minimum necessary, and protect information from being overheard or seen.
- Patients have rights — especially the **right of access** — and you must help them use those rights.
- Protect ePHI: never share passwords, lock screens, use secure methods, and report phishing.
- **Report suspected incidents immediately.** The organization's response timeline begins when anyone in the workforce knows or should have known.

**Who to contact:** your supervisor, your organization's **Privacy Officer** and **Security Official** (named in your policies), or HHS OCR at hhs.gov/ocr for complaints.

When you are ready, continue to the final examination.`,
        },
      ],
    },
  ],
  finalExam: {
    title: "HIPAA Privacy and Security — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      { type: "MULTIPLE_CHOICE", prompt: "Which agency enforces the HIPAA Privacy, Security and Breach Notification Rules?", options: [{ id: "a", text: "OSHA" }, { id: "b", text: "HHS Office for Civil Rights (OCR)" }, { id: "c", text: "The FDA" }, { id: "d", text: "The state Board of Nursing" }], correct: "b", explanation: "HHS OCR administers and enforces these HIPAA rules." },
      { type: "TRUE_FALSE", prompt: "PHI includes oral communications, such as a conversation between two nurses about a named patient.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "t", explanation: "PHI may be electronic, paper or oral." },
      { type: "MULTIPLE_CHOICE", prompt: "Which is an example of a business associate?", options: [{ id: "a", text: "A staff nurse employed by the clinic" }, { id: "b", text: "A billing company that processes the clinic's claims" }, { id: "c", text: "A patient's spouse" }, { id: "d", text: "A state public health department" }], correct: "b", explanation: "Vendors performing services involving PHI on behalf of a covered entity are business associates." },
      { type: "MULTIPLE_SELECT", prompt: "Which of the following uses or disclosures are permitted WITHOUT a patient's written authorization? (Select all that apply.)", options: [{ id: "a", text: "Sending records to a specialist for treatment" }, { id: "b", text: "Submitting a claim to the patient's health plan" }, { id: "c", text: "Selling a patient list to a marketing company" }, { id: "d", text: "Using records for an internal quality-improvement review" }], correct: ["a", "b", "d"], explanation: "Treatment, payment and health care operations are permitted; sale of PHI requires authorization." },
      { type: "SCENARIO", prompt: "A coworker was admitted to your hospital. You are curious and have EHR access to her unit. What should you do?", options: [{ id: "a", text: "Check her chart to see how she is doing" }, { id: "b", text: "Ask another nurse to check it for you" }, { id: "c", text: "Do not access the record unless it is required for your job duties" }, { id: "d", text: "Look only at the diagnosis, not the notes" }], correct: "c", explanation: "Access only what you need for your work. Curiosity-based access is a violation regardless of how much you view." },
      { type: "MULTIPLE_CHOICE", prompt: "The minimum necessary standard does NOT apply to:", options: [{ id: "a", text: "Disclosures to a health plan for payment" }, { id: "b", text: "Disclosures to another provider for treatment" }, { id: "c", text: "Internal uses for operations" }, { id: "d", text: "Responses to most third-party requests" }], correct: "b", explanation: "Treatment disclosures to providers are excluded from minimum necessary." },
      { type: "MULTIPLE_CHOICE", prompt: "Under 45 CFR 164.524, a covered entity generally must act on a patient's request for access to their records within:", options: [{ id: "a", text: "5 days" }, { id: "b", text: "30 days, with one possible 30-day extension" }, { id: "c", text: "90 days" }, { id: "d", text: "Whenever the physician approves" }], correct: "b", explanation: "30 days, with one 30-day extension if the individual is notified in writing of the reason." },
      { type: "TRUE_FALSE", prompt: "If a patient pays for a service in full out of pocket and asks that it not be disclosed to their health plan, the provider generally must agree.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "t", explanation: "This restriction must be honored, with limited exceptions." },
      { type: "MULTIPLE_CHOICE", prompt: "Which is a TECHNICAL safeguard under the Security Rule?", options: [{ id: "a", text: "Locked server room" }, { id: "b", text: "Unique user IDs and audit controls" }, { id: "c", text: "Business associate agreements" }, { id: "d", text: "Security awareness training" }], correct: "b", explanation: "Unique user identification and audit controls are technical safeguards; the others are physical or administrative." },
      { type: "SCENARIO", prompt: "You receive an urgent email asking you to confirm your password through a link to keep your account active. You clicked the link and entered your password before realizing it looked wrong. What now?", options: [{ id: "a", text: "Do nothing — it is probably fine" }, { id: "b", text: "Report it to IT/security immediately and follow their instructions (such as changing your password)" }, { id: "c", text: "Delete the email and hope no one notices" }, { id: "d", text: "Wait until your next shift to mention it" }], correct: "b", explanation: "Prompt reporting lets IT contain a compromised account before PHI is accessed." },
      { type: "MULTIPLE_CHOICE", prompt: "An impermissible use or disclosure of PHI is presumed to be a breach unless:", options: [{ id: "a", text: "The employee apologizes" }, { id: "b", text: "A documented risk assessment demonstrates a low probability that the PHI was compromised" }, { id: "c", text: "Fewer than 10 people were affected" }, { id: "d", text: "It happened outside business hours" }], correct: "b", explanation: "The four-factor risk assessment is how an organization can rebut the presumption." },
      { type: "MULTIPLE_CHOICE", prompt: "Breach notification requirements apply to unsecured PHI. PHI is considered 'secured' when it is:", options: [{ id: "a", text: "Password-protected with any password" }, { id: "b", text: "Rendered unusable, unreadable or indecipherable, such as by encryption meeting HHS guidance or proper destruction" }, { id: "c", text: "Stored in a locked car" }, { id: "d", text: "Marked 'confidential'" }], correct: "b", explanation: "HHS guidance identifies encryption and destruction as methods that secure PHI." },
      { type: "MULTIPLE_CHOICE", prompt: "A breach affects 750 residents of Florida. In addition to notifying individuals and HHS, the covered entity must:", options: [{ id: "a", text: "Notify prominent media outlets serving Florida" }, { id: "b", text: "Notify the FBI" }, { id: "c", text: "Nothing else" }, { id: "d", text: "Notify every hospital in the state" }], correct: "a", explanation: "Breaches affecting more than 500 residents of a state or jurisdiction require media notice." },
      { type: "SCENARIO", prompt: "A home health aide's tote bag with paper visit notes for three clients is left on a bus. What should the aide do first?", options: [{ id: "a", text: "Recreate the notes from memory" }, { id: "b", text: "Report the loss immediately to the supervisor/Privacy Officer per policy" }, { id: "c", text: "Wait a week to see if the bag is returned" }, { id: "d", text: "Call the clients to apologize before telling anyone" }], correct: "b", explanation: "Report immediately; the organization manages investigation, risk assessment and any notifications." },
      { type: "TRUE_FALSE", prompt: "Posting a photo of a resident's birthday party on your personal social media is acceptable if you do not include the resident's name.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "f", explanation: "Images and details can identify a person even without a name. Never post patient or resident information without authorization and your organization's approval." },
    ],
  },
};
