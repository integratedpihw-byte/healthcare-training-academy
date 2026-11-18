import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const ryanWhiteCaseManagement: CourseContent = {
  code: "CHITA-CM-002",
  title: "HIV Case Management in the Ryan White HIV/AIDS Program: Medical and Non-Medical Case Management",
  categorySlug: "case-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 90,
  clinicalReviewRequired: true,
  description:
    "An introduction to case management for people with HIV in programs funded by HRSA's Ryan White HIV/AIDS Program (RWHAP): how the program's Parts are organized, client eligibility and payer of last resort, the difference between Medical Case Management and Non-Medical Case Management as defined in HRSA HAB Policy Clarification Notice 16-02, the HIV care continuum and viral suppression, supporting treatment adherence and retention in care, confidentiality of HIV information in Florida, and data reporting.",
  targetAudience: "Medical and non-medical case managers, care coordinators, eligibility staff, linkage and retention specialists, peer navigators and nurses in Ryan White-funded programs.",
  prerequisites: ["CHITA-CM-001"],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Describe the purpose and Parts of the Ryan White HIV/AIDS Program and the payer-of-last-resort requirement.",
    "Explain client eligibility requirements and recertification.",
    "Distinguish Medical Case Management from Non-Medical Case Management Services under PCN 16-02.",
    "Describe the HIV care continuum, viral suppression and Undetectable = Untransmittable (U=U).",
    "Apply Florida HIV confidentiality requirements and support accurate data reporting.",
  ],
  regulatoryReferences: [
    { agency: "Health Resources and Services Administration, HIV/AIDS Bureau", citation: "PCN 16-02 (Revised 10/22/18)", title: "Ryan White HIV/AIDS Program Services: Eligible Individuals & Allowable Uses of Funds", url: "https://ryanwhite.hrsa.gov/sites/default/files/hab/Global/service_category_pcn_16-02_final.pdf" },
    { agency: "Health Resources and Services Administration, HIV/AIDS Bureau", citation: "PCN 21-02", title: "Determining Client Eligibility & Payor of Last Resort in the Ryan White HIV/AIDS Program", url: "https://www.hab.hrsa.gov/sites/default/files/ryanwhite/grants/pcn-21-02-determining-eligibility-polr.pdf" },
    { agency: "Florida Legislature", citation: "s. 381.004, F.S.", title: "HIV testing (including confidentiality of HIV test results)", url: "https://m.flsenate.gov/Statutes/381.004" },
  ],
  sourceReferences: [
    { title: "Ryan White HIV/AIDS Program Part B Manual", publisher: "Health Resources and Services Administration", url: "https://ryanwhite.hrsa.gov/sites/default/files/ryanwhite/resources/part-b-program-manual.pdf", accessedOn: ACCESSED },
    { title: "AIDS Drug Assistance Program (ADAP)", publisher: "Florida Department of Health", url: "https://www.floridahealth.gov/diseases-and-conditions/aids/adap/index.html", accessedOn: ACCESSED },
    { title: "RSR In Focus: Understanding the Policy Clarification Notice (PCN) #16-02", publisher: "TargetHIV (HRSA HAB technical assistance)", url: "https://targethiv.org/sites/default/files/file-upload/resources/RSR_In_Focus_PCN16-02_August2017.pdf", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. The Ryan White HIV/AIDS Program",
      summary: "Purpose, Parts, eligibility and payer of last resort.",
      lessons: [
        text("How the program is organized", 12, `The **Ryan White HIV/AIDS Program (RWHAP)**, administered by the **HIV/AIDS Bureau (HAB)** of the **Health Resources and Services Administration (HRSA)**, provides HIV primary medical care, medications and essential support services to low-income people with HIV. It was created by the Ryan White CARE Act of 1990 and is named for Ryan White, an Indiana teenager whose experience with HIV-related stigma drew national attention. The program fills gaps in care for people who are uninsured or underinsured.

### The Parts
The program is organized into **Parts**, following the authorizing law (Title XXVI of the Public Health Service Act):
- **Part A** — grants to **eligible metropolitan areas (EMAs) and transitional grant areas (TGAs)** most severely affected by HIV.
- **Part B** — grants to **states and territories**, including the **AIDS Drug Assistance Program (ADAP)**, which helps pay for HIV medications and, in some states, insurance costs. In Florida, Part B and ADAP are administered by the Florida Department of Health.
- **Part C** — grants to community-based organizations for **early intervention services** and outpatient HIV primary care.
- **Part D** — family-centered care for **women, infants, children and youth** with HIV.
- **Part F** — special programs, including the **Special Projects of National Significance (SPNS)**, **AIDS Education and Training Centers (AETCs)**, dental programs and the **Minority AIDS Initiative**.

By law, Parts A, B and C recipients must generally spend **at least 75%** of service funds on **core medical services** (such as outpatient care, ADAP, medical case management, oral health and mental health), with the remainder for **support services** (such as non-medical case management, medical transportation, food and emergency financial assistance). Waivers are possible.

### Payer of last resort
RWHAP funds **may not pay** for a service if another payer is reasonably available — for example, Medicaid, Medicare, private insurance or another federal or state program. Case managers play a key role by **screening clients for other coverage**, helping them **enroll**, and documenting these efforts. RWHAP can still cover services that other payers do not, and can help with costs such as premiums and co-pays where allowed.

### Client eligibility
Under HRSA guidance (PCN 21-02), recipients determine eligibility based on at least:
1. **An HIV diagnosis** (documented)
2. **Low income**, as defined by the recipient (usually a percentage of the federal poverty level)
3. **Residency** requirements, if set by the recipient
Recipients must also **recertify** eligibility periodically and confirm that no other payer is available. Eligibility rules differ among recipients and can change with funding — for example, Florida changed its ADAP income limits and formulary during 2026. **Always check the current requirements of the program you work for.**`),
        check("Check your understanding: the program", [
          kc("rw1", "Which Part of the Ryan White program funds states and includes ADAP?", ["Part A", "Part B", "Part C", "Part F"], 1, "Part B funds states and territories, including ADAP."),
          kc("rw2", "\"Payer of last resort\" means:", ["Ryan White pays first for everything", "Ryan White funds cannot pay for a service if another payer is reasonably available", "Clients pay first, then Ryan White", "Only Medicaid can be billed"], 1, "Other available payers must be used first."),
          kc("rw3", "Which is a core eligibility requirement for Ryan White services?", ["Employment", "An HIV diagnosis", "U.S. citizenship in all programs", "Private insurance"], 1, "An HIV diagnosis and low income are required; residency may also apply."),
        ]),
      ],
    },
    {
      title: "2. Medical and non-medical case management",
      summary: "The two service categories in PCN 16-02.",
      lessons: [
        text("Medical Case Management (MCM)", 12, `HRSA HAB **Policy Clarification Notice 16-02** defines each RWHAP service category. **Medical Case Management, including Treatment Adherence Services**, is a **core medical service**.

### Definition and purpose
MCM is a range of **client-centered activities focused on improving health outcomes** in support of the HIV care continuum. It is delivered by trained professionals, including both medically credentialed and other health care staff, as part of the clinical health care team, and can be provided in person, by phone or through other communication methods.

### Key activities described in PCN 16-02
- **Initial assessment** of service needs
- Development of a **comprehensive, individualized care plan**
- **Timely and coordinated access** to medically appropriate levels of health and support services and continuity of care
- **Continuous client monitoring** to assess the efficacy of the care plan
- **Re-evaluation of the care plan at least every 6 months**, with adaptations as necessary
- Ongoing assessment of the client's and other key family members' needs and personal support systems
- **Treatment adherence counseling** to ensure readiness for and adherence to complex HIV treatments
- Client-specific **advocacy** and review of utilization of services

MCM also includes helping clients **get and keep** health insurance and other benefits (such as Medicaid, Medicare Part D, ADAP and marketplace plans).

Documentation should show that the activities are focused on **health outcomes** — for example, linking to medical visits, reviewing viral load results with the care team, and addressing barriers to adherence.`),
        text("Non-Medical Case Management Services (NMCM)", 10, `**Non-Medical Case Management Services** is a **support service** in PCN 16-02.

### Definition and purpose
NMCM provides guidance and assistance in **accessing medical, social, community, legal, financial, employment, vocational and other needed services**. Its purpose is to **improve access to and use of** needed services. It may also include helping clients access other public and private programs for which they may be eligible, such as Medicaid, Medicare Part D, state pharmacy assistance programs, pharmaceutical company patient assistance programs, health insurance marketplace plans and other state or local health care and supportive services.

Activities are similar to MCM — initial assessment, care plan, coordination, monitoring, re-evaluation as needed — but NMCM **does not** include coordinating and following up on medical treatment.

### MCM versus NMCM at a glance
| | Medical Case Management | Non-Medical Case Management |
|---|---|---|
| Category | Core medical service | Support service |
| Purpose | **Improve health outcomes** | **Improve access** to needed services |
| Focus | Coordination and follow-up of medical treatment, including adherence | Guidance and help getting medical, social, legal, financial and other services |
| Care plan review | At least every 6 months | As needed (per program standards) |

Your Part A, B, C or D recipient may also have **local service standards** with additional requirements (for example, caseload limits, staff qualifications and contact frequency). Follow the standards for your funding source.`),
        check("Check your understanding: MCM and NMCM", [
          kc("rw4", "Under PCN 16-02, Medical Case Management care plans must be re-evaluated at least every:", ["30 days", "6 months", "2 years", "5 years"], 1, "PCN 16-02 requires re-evaluation at least every 6 months."),
          kc("rw5", "Which activity fits Non-Medical Case Management rather than Medical Case Management?", ["Treatment adherence counseling", "Helping a client apply for legal aid and food assistance", "Reviewing a viral load result with the care team", "Coordinating follow-up of medical treatment"], 1, "NMCM helps with access to social, legal and other services."),
        ]),
      ],
    },
    {
      title: "3. The care continuum and adherence",
      summary: "Linkage, retention and viral suppression.",
      lessons: [
        text("The HIV care continuum", 12, `The **HIV care continuum** shows the steps from diagnosis to viral suppression:
1. **Diagnosed** with HIV
2. **Linked to HIV medical care** (ideally soon after diagnosis; many programs offer same-day or rapid start of treatment)
3. **Retained in care** (regular medical visits)
4. **Virally suppressed** (HIV viral load below 200 copies/mL)

People drop off at each step. Case managers help close the gaps by **linking**, **re-engaging** clients who have fallen out of care, and **removing barriers** such as transportation, housing, insurance, mental health or substance use issues, and stigma.

### Undetectable = Untransmittable (U=U)
Antiretroviral therapy (ART) cannot cure HIV, but it can reduce the virus to very low levels. According to the CDC, people with HIV who take HIV medicine as prescribed and **get and keep an undetectable viral load** have **effectively no risk of transmitting HIV to sexual partners**. This is a powerful, stigma-reducing message that can motivate adherence. Medical questions about viral load and treatment should be referred to the clinical team.

### Supporting adherence
- Explore the client's **own reasons** for taking medicine (see the motivational interviewing course).
- Identify practical barriers: cost, pharmacy access, side effects, pill burden, schedule, storage, privacy at home.
- Use tools: pill boxes, phone reminders, linking doses to daily routines, synchronized refills.
- Address **food insecurity, housing instability, depression and substance use**, which are strongly linked to missed doses.
- Coordinate with the prescriber and pharmacist for side effects or regimen problems.
- Celebrate progress (for example, a first undetectable result).

### Retention and re-engagement
Track appointments and lab results according to your program's protocols. When a client misses visits, follow your **re-engagement** procedure — calls, texts, letters and outreach — while respecting confidentiality (for example, never leave detailed HIV information on a voicemail).`),
        check("Check your understanding: continuum", [
          kc("rw6", "Viral suppression is generally defined as a viral load below:", ["20,000 copies/mL", "200 copies/mL", "2,000 copies/mL", "Any detectable level"], 1, "Below 200 copies/mL."),
          kc("rw7", "U=U means:", ["HIV is cured by medicine", "People who get and keep an undetectable viral load have effectively no risk of transmitting HIV sexually", "Testing is no longer needed", "Medicine can be stopped once undetectable"], 1, "Undetectable = Untransmittable, as long as viral load stays undetectable."),
        ]),
      ],
    },
    {
      title: "4. Confidentiality, data and Florida resources",
      summary: "Protecting HIV information and reporting accurately.",
      lessons: [
        text("Confidentiality and data", 10, `### Florida HIV confidentiality
Florida law (**section 381.004, Florida Statutes**) gives HIV test results and the identity of the person tested **special protection**. In general, HIV test results may be disclosed only as the statute allows — for example, to the person tested, with the person's written authorization, to health care providers involved in their care, and to the Department of Health as required for public health purposes. Violations can bring disciplinary action and criminal penalties. This is in addition to HIPAA and Ryan White program requirements.

Practical rules:
- Never confirm to a caller that someone is a client of an HIV program without proper authorization.
- Use release-of-information forms that meet Florida and program requirements before sharing information with non-medical partners (landlords, employers, family).
- Mail, texts and voicemails should not reveal HIV status.
- Discuss clients only with staff who need to know.

### Data reporting
RWHAP recipients and providers submit the annual **Ryan White HIV/AIDS Program Services Report (RSR)**, a client-level data report on services and outcomes. Many providers use **CAREWare**, HRSA's free software, or other approved systems. Accurate, timely documentation of services, eligibility, insurance status and lab results supports funding, quality improvement and the clinical quality management program.

### Florida resources
- **Florida HIV/AIDS Hotline: 1-800-FLA-AIDS (1-800-352-2437)**
- **Florida ADAP** — through your county health department; eligibility and covered medications change, so check the Department of Health's ADAP page for current details.
- **Florida Abuse Hotline: 1-800-96-ABUSE** for suspected abuse, neglect or exploitation of a child or vulnerable adult.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: re-engaging Marcus", 12, `**Situation (fictional).** Marcus, 29, was diagnosed with HIV a year ago. He started ART but has missed his last two medical visits, and his last viral load was detectable. He lost his job and his employer health insurance, and he is staying with friends.

**What the medical case manager did:**
- **Re-engagement:** called and texted using the agreed-upon discreet message ("This is Jordan from the clinic, please call me back"), then reached Marcus at his preferred time.
- **Reassessment:** identified loss of insurance, unstable housing, depression and a medication gap of two weeks.
- **Payer of last resort:** screened Marcus for Medicaid and marketplace coverage and helped him apply; enrolled him in ADAP in the meantime under current program rules so his medicine would not lapse.
- **Care plan (with Marcus):** medical visit within one week; mental health referral; NMCM referral to a housing navigator; phone reminders for doses.
- **Adherence:** used open questions to explore what matters to Marcus — "being healthy enough to go back to school." Discussed U=U, which Marcus said made him feel less alone.
- **Coordination:** informed the prescriber about the medication gap so the clinical team could decide on lab tests and treatment.
- **Confidentiality:** obtained Marcus's written authorization before sharing limited information with the housing program.
- **Follow-up:** Marcus attended his visit and, three months later, had an undetectable viral load.

**Discussion:**
- Which activities were MCM and which were handled through NMCM?
- How did the case manager apply payer of last resort?
- Why was written authorization needed before contacting the housing program?`),
      ],
    },
  ],
  finalExam: {
    title: "Ryan White HIV Case Management — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("The Ryan White HIV/AIDS Program is administered by:", ["CDC", "HRSA's HIV/AIDS Bureau", "CMS", "FEMA"], 1, "HRSA HAB administers the RWHAP."),
      mc("Part A of the Ryan White program funds:", ["States and ADAP", "Eligible metropolitan areas and transitional grant areas", "Only dental programs", "Research only"], 1, "Part A funds EMAs and TGAs."),
      mc("Family-centered care for women, infants, children and youth is funded under:", ["Part A", "Part B", "Part C", "Part D"], 3, "Part D focuses on women, infants, children and youth."),
      mc("By law, Parts A, B and C recipients generally must spend at least what share of service funds on core medical services?", ["25%", "50%", "75%", "100%"], 2, "At least 75%, unless waived."),
      tf("Ryan White funds may pay for a service even if Medicaid would cover it for that client.", false, "RWHAP is the payer of last resort."),
      ms("Which are basic client eligibility criteria under HRSA guidance? (Select all that apply.)", ["HIV diagnosis", "Low income as defined by the recipient", "Residency, if required by the recipient", "Employment"], [0, 1, 2], "Employment is not required."),
      mc("Under PCN 16-02, the purpose of Medical Case Management is to:", ["Improve access to legal services only", "Improve health outcomes in support of the HIV care continuum", "Provide housing", "Collect fees"], 1, "MCM focuses on health outcomes."),
      mc("Under PCN 16-02, the purpose of Non-Medical Case Management is to:", ["Prescribe medicines", "Improve access to and use of needed services", "Perform lab tests", "Replace the clinical team"], 1, "NMCM focuses on access to services."),
      mc("Medical Case Management is classified as a:", ["Support service", "Core medical service", "Administrative cost", "Research activity"], 1, "MCM is a core medical service."),
      mc("A Medical Case Management care plan must be re-evaluated at least every:", ["Month", "6 months", "Year", "3 years"], 1, "PCN 16-02: at least every 6 months."),
      mc("Which is the correct order of the HIV care continuum?", ["Suppressed, diagnosed, linked, retained", "Diagnosed, linked to care, retained in care, virally suppressed", "Linked, diagnosed, suppressed, retained", "Retained, linked, diagnosed, suppressed"], 1, "Diagnosis → linkage → retention → suppression."),
      mc("According to the CDC, a person with HIV who gets and keeps an undetectable viral load:", ["Can stop treatment", "Has effectively no risk of transmitting HIV to sexual partners", "Is cured", "Should avoid medical visits"], 1, "This is the U=U message."),
      mc("In Florida, HIV test results are specially protected under:", ["s. 381.004, F.S.", "The Fair Labor Standards Act", "FERPA", "No law"], 0, "Section 381.004 protects HIV test results."),
      sc("A client's landlord calls asking whether the client attends your HIV clinic. There is no authorization on file. What do you do?", ["Confirm, since the landlord seems concerned", "Neither confirm nor deny the client's participation, and follow your privacy procedure", "Give the landlord the client's viral load", "Transfer the call to the client's doctor to answer"], 1, "Do not disclose without authorization."),
      mc("The annual client-level data report submitted by Ryan White recipients and providers is the:", ["RSR (Ryan White HIV/AIDS Program Services Report)", "W-2", "MMWR", "OSHA 300 log"], 0, "The RSR is the annual client-level report."),
    ],
  },
};
