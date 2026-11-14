import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const prepPepFundamentals: CourseContent = {
  code: "CHTA-HIV-002",
  title: "PrEP and PEP Fundamentals for Healthcare Workers",
  categorySlug: "hiv-infectious-disease",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "No regulatory interval. Review whenever CDC updates PrEP or PEP guidance — this field changes frequently.",
  estimatedMinutes: 60,
  clinicalReviewRequired: true,
  description:
    "An overview of HIV pre-exposure prophylaxis (PrEP) and post-exposure prophylaxis (PEP) for clinical and support staff who educate, screen, refer or navigate patients. Covers who may benefit, current PrEP options (daily oral, every-2-month injectable cabotegravir and twice-yearly injectable lenacapavir), required HIV testing and follow-up, PEP timing and the 28-day course, occupational PEP, side effects, adherence support and referral pathways. Prescribing decisions belong to licensed prescribers following current CDC guidelines.",
  targetAudience: "Nurses, medical assistants, pharmacists and technicians, HIV testing counselors, patient navigators, case managers and clinic staff.",
  prerequisites: ["CHTA-HIV-001"],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. This course does not authorize prescribing or dispensing.",
  objectives: [
    "Distinguish PrEP from PEP and explain when each is used.",
    "Describe the FDA-approved PrEP options and the key differences among them.",
    "Explain why HIV testing is required before and during PrEP.",
    "State the PEP time window (as soon as possible, no later than 72 hours) and the 28-day course.",
    "Respond to occupational exposures and connect patients to PEP and PrEP without delay.",
    "Support adherence and address barriers and stigma.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "s. 381.004, F.S.", title: "HIV testing", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0381/Sections/0381.004.html" },
    { agency: "OSHA", citation: "29 CFR 1910.1030(f)", title: "Post-exposure evaluation and follow-up", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030" },
  ],
  sourceReferences: [
    { title: "Preexposure Prophylaxis for the Prevention of HIV Infection in the United States — 2021 Update: A Clinical Practice Guideline", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/hivnexus/hcp/prep/index.html", publishedOn: "2021-12-08", accessedOn: ACCESSED },
    { title: "Clinical Recommendation for the Use of Injectable Lenacapavir as HIV Preexposure Prophylaxis — United States, 2025 (MMWR 74(35))", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/mmwr/volumes/74/wr/mm7435a1.htm", publishedOn: "2025-09-18", accessedOn: ACCESSED },
    { title: "Antiretroviral Postexposure Prophylaxis After Sexual, Injection Drug Use, or Other Nonoccupational Exposure to HIV — CDC Recommendations, United States, 2025 (MMWR Recomm Rep 74(1))", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/mmwr/volumes/74/rr/rr7401a1.htm", publishedOn: "2025-05-08", accessedOn: ACCESSED },
    { title: "National Clinician Consultation Center — PEPline and PrEPline", publisher: "UCSF / HRSA", url: "https://nccc.ucsf.edu/", accessedOn: ACCESSED },
    { title: "HIV Prevention — PrEP Locator and Services", publisher: "Florida Department of Health", url: "https://www.floridahealth.gov/diseases-and-conditions/aids/index.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. PrEP and PEP: what they are",
      summary: "Two different tools for two different situations.",
      lessons: [
        text("Before vs. after", 8, `| | **PrEP** (pre-exposure prophylaxis) | **PEP** (post-exposure prophylaxis) |
|---|---|---|
| **When** | *Before* possible exposure, on an ongoing basis | *After* a single possible exposure — an emergency |
| **Who** | People without HIV who could be exposed through sex or injection drug use | People without HIV after a recent exposure with substantial risk |
| **Timing** | Taken continuously as prescribed | Start **as soon as possible, ideally within 24 hours, no later than 72 hours** |
| **Duration** | As long as the person needs protection | **28 days** |

Both require an **HIV test** — PrEP must never be started in someone who already has HIV, because PrEP regimens are not complete HIV treatment and resistance can develop.

People who need PEP repeatedly may benefit from starting **PrEP**; CDC's 2025 PEP guidelines encourage moving directly from PEP to PrEP when appropriate, after confirming HIV-negative status.`),
      ],
    },
    {
      title: "2. PrEP options and eligibility",
      summary: "Who may benefit and the current options.",
      lessons: [
        text("Who may benefit and which options exist", 11, `CDC recommends that clinicians **inform all sexually active adults and adolescents about PrEP**, and offer it to people with indications such as a sexual partner with HIV who does not have a sustained undetectable viral load, inconsistent condom use, a recent bacterial STI, or sharing injection equipment. Anyone who **asks** for PrEP should be able to discuss it with a prescriber — they do not need to disclose specific behaviors.

### FDA-approved PrEP options (as of 2025)
| Option | How taken | Notes |
|---|---|---|
| **TDF/FTC** (tenofovir disoproxil fumarate/emtricitabine; generic available) | One pill daily | For sexual and injection exposures; kidney and bone monitoring |
| **TAF/FTC** (tenofovir alafenamide/emtricitabine) | One pill daily | **Not approved for people at risk through receptive vaginal sex** |
| **Cabotegravir (CAB-LA)** | Injection every **2 months** (after two initiation injections one month apart) | For sexual exposures; requires on-time visits |
| **Lenacapavir (LEN)** | Injection every **6 months** (with initial oral loading doses) | FDA-approved June 2025; CDC strongly recommends it as a PrEP option for people ≥35 kg who would benefit (Sept 2025) |

The prescriber chooses with the patient based on exposure, kidney function, pregnancy plans, drug interactions, insurance and preference.

### Follow-up
PrEP includes regular **HIV testing** (every visit/injection), STI testing, kidney function checks for oral tenofovir, and adherence support. **PrEP does not protect against other STIs** — condoms still help.`),
        check("Check your understanding: PrEP", [
          kc("pp1", "Why is an HIV test required before starting PrEP?", ["Insurance requires it", "Starting PrEP in someone with undiagnosed HIV can lead to drug resistance and undertreatment", "To check for hepatitis", "It is optional"], 1, "PrEP regimens are not complete HIV treatment; resistance may develop."),
          kc("pp2", "Which option is given every 6 months?", ["TDF/FTC", "TAF/FTC", "Cabotegravir", "Lenacapavir"], 3, "Lenacapavir is injected twice yearly after an initial oral load; cabotegravir is every 2 months."),
        ]),
      ],
    },
    {
      title: "3. PEP after nonoccupational exposure",
      summary: "Timing, regimens and follow-up (CDC 2025).",
      lessons: [
        text("Nonoccupational PEP (nPEP)", 10, `**PEP is an emergency.** CDC's 2025 nPEP guidelines recommend PEP after a nonoccupational exposure of non-intact skin or mucous membranes to blood or genital/rectal fluids that presents a **substantial risk** — for example, condomless sex or sharing injection equipment with a person who has HIV **without a known sustained undetectable viral load** (or whose status is unknown and the exposure is high risk).

### Key points for staff
- **Do not delay**: help the person reach a prescriber, urgent care or emergency department **right away**. The first dose should not wait for lab results.
- **Window**: as soon as possible — ideally within **24 hours** — and **no later than 72 hours**. After 72 hours PEP is generally not recommended, but the person still needs HIV testing and prevention counseling.
- **Course**: **28 days**, taken daily. CDC's 2025 guidance lists once-daily integrase-inhibitor–based regimens (e.g., bictegravir/emtricitabine/tenofovir alafenamide, or dolutegravir with a tenofovir-based backbone) as preferred for most adults — the prescriber decides.
- **Follow-up**: a check-in at about 24 hours, then HIV and other testing at about 4–6 weeks and 12 weeks (timing depends on the tests used).
- Address related needs: STI testing and treatment, hepatitis B vaccination status, pregnancy testing, and emergency contraception after sexual assault. For sexual assault, follow your facility's protocol and offer connection to a certified rape crisis center.`),
      ],
    },
    {
      title: "4. Occupational PEP and adherence",
      summary: "Workplace exposures and supporting people on PrEP/PEP.",
      lessons: [
        text("Occupational exposures and adherence", 9, `### Occupational PEP (oPEP)
1. **Immediate first aid**: wash with soap and water; flush mucous membranes with water; irrigate eyes.
2. **Report immediately** to your supervisor or employee health. OSHA requires employers to provide a confidential **post-exposure evaluation and follow-up** at no cost to the employee.
3. The source person's HIV, hepatitis B and C status is evaluated as permitted by law; testing is not a reason to delay the first PEP dose when indicated.
4. Clinicians can call the **PEPline** (National Clinician Consultation Center) for expert advice; the U.S. Public Health Service updated its occupational PEP guidelines in 2025.

### Supporting adherence
- Explain what to expect: common early side effects (e.g., nausea, headache, fatigue) often improve; report rash or other concerns to the prescriber.
- Use reminders, pill boxes or phone alarms; schedule injection appointments before the person leaves.
- Address barriers: cost and insurance (manufacturer and public assistance programs, county health departments), transportation, privacy at home, stigma.
- Use nonjudgmental, person-centered language. Avoid assumptions based on appearance, age, gender or orientation.`),
        check("Check your understanding: oPEP and adherence", [
          kc("pp3", "A nurse is splashed in the eye with blood. What first?", ["Finish the procedure", "Irrigate the eye with clean water or saline, then report immediately", "Rub the eye", "Wait for the source patient's test result"], 1, "First aid then immediate reporting allows PEP to start quickly if indicated."),
          kc("pp4", "Who must pay for post-exposure evaluation of an employee's occupational bloodborne exposure under OSHA?", ["The employee", "The employer, at no cost to the employee", "The source patient", "The state"], 1, "OSHA 1910.1030(f) requires the employer to provide it at no cost."),
        ]),
      ],
    },
    {
      title: "5. Putting it together",
      summary: "Case study.",
      lessons: [
        caseStudy("Case study: Saturday night call", 9, `**Situation (fictional).** A 24-year-old patient calls a clinic's after-hours line on Sunday morning. On Friday night (about 34 hours ago), they had condomless anal sex with a new partner who later mentioned he has HIV and "stopped his meds a few months ago." The patient asks if they should "just wait and get tested in a few weeks."

**Discussion:**
1. Is this a potential PEP situation? *(Yes — substantial-risk exposure, source with HIV not known to be virally suppressed, within 72 hours.)*
2. What should the staff member do? *(Explain that PEP is time-sensitive and direct the patient to be seen today — urgent care, emergency department or on-call prescriber — per protocol; do not wait for Monday.)*
3. What will the prescriber likely do? *(Baseline HIV test without delaying the first dose, start a 28-day regimen, test for STIs/hepatitis/pregnancy as indicated, arrange follow-up.)*
4. What should happen at the end of PEP? *(If HIV-negative and ongoing risk, discuss transitioning directly to PrEP.)*`),
      ],
    },
  ],
  finalExam: {
    title: "PrEP and PEP Fundamentals — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("What is the latest time after exposure that PEP is generally recommended to start?", ["24 hours", "72 hours", "7 days", "30 days"], 1, "Start as soon as possible, ideally within 24 hours, and no later than 72 hours."),
      mc("How long is a standard PEP course?", ["3 days", "7 days", "28 days", "6 months"], 2, "PEP is taken for 28 days."),
      tf("The first PEP dose should be delayed until the source person's HIV test result is available.", false, "Do not delay the first dose for lab results."),
      mc("PrEP is used:", ["After a single exposure only", "Before possible exposure, on an ongoing basis", "To treat HIV infection", "To prevent hepatitis C"], 1, "PrEP is taken before exposures to prevent HIV."),
      mc("Which PrEP option is NOT approved for people whose risk is receptive vaginal sex?", ["TDF/FTC", "TAF/FTC", "Cabotegravir", "Lenacapavir"], 1, "TAF/FTC was not studied/approved for receptive vaginal exposures."),
      mc("How often is injectable cabotegravir for PrEP given after initiation?", ["Weekly", "Every 2 months", "Every 6 months", "Once a year"], 1, "After two initiation injections one month apart, cabotegravir is given every 2 months."),
      tf("Lenacapavir for PrEP was approved by FDA in 2025 and is injected every 6 months.", true, "FDA approved lenacapavir PrEP in June 2025; CDC recommended it in September 2025."),
      ms("Which are part of PrEP follow-up? (Select all that apply.)", ["HIV testing at visits", "STI testing", "Kidney function monitoring for oral tenofovir", "Stopping all condom use"], [0, 1, 2], "PrEP does not protect against other STIs."),
      sc("A patient calls 50 hours after a condomless sexual exposure to a partner with HIV who is not on treatment. What should you advise?", ["Wait three weeks and test", "Be seen today for PEP evaluation — it is time-sensitive", "PEP is no longer possible", "Take a friend's leftover pills"], 1, "Within 72 hours PEP can still be started; urgency matters."),
      mc("Why should HIV be ruled out before starting PrEP?", ["PrEP causes HIV", "PrEP regimens are not full HIV treatment and resistance can develop", "It is a billing requirement only", "To check vaccination status"], 1, "Undiagnosed HIV on PrEP risks resistance."),
      tf("PrEP protects against syphilis, gonorrhea and chlamydia.", false, "PrEP prevents HIV only."),
      mc("After a needlestick at work, who provides post-exposure evaluation at no cost to the worker?", ["The worker's own insurance", "The employer, under OSHA's bloodborne pathogens standard", "The source patient", "The county"], 1, "Employers must provide confidential evaluation and follow-up at no cost."),
      sc("A person completing PEP says they expect similar exposures in the future. What is the best next step?", ["Repeat PEP each time", "Discuss transitioning to PrEP after confirming HIV-negative status", "Nothing", "Advise abstinence only"], 1, "CDC encourages a PEP-to-PrEP transition when there is ongoing risk."),
      mc("Which resource offers expert PEP consultation to clinicians?", ["The National Clinician Consultation Center PEPline", "Poison Control", "The Florida Abuse Hotline", "Medicare"], 0, "The PEPline provides real-time expert advice."),
      mc("Which statement reflects respectful PrEP counseling?", ["Only certain groups need PrEP", "Inform sexually active patients about PrEP and discuss it with anyone who asks, without requiring them to justify it", "PrEP encourages risky behavior so avoid mentioning it", "Ask about appearance to judge risk"], 1, "CDC recommends informing all sexually active adults and adolescents about PrEP."),
    ],
  },
};
