import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const hivAidsFundamentals: CourseContent = {
  code: "CHITA-HIV-001",
  title: "HIV/AIDS Fundamentals for Florida Healthcare Workers",
  categorySlug: "hiv-infectious-disease",
  isRequiredByDefault: true,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "One-time course for employees of facilities covered by s. 381.0035, F.S. (e.g., ALF employees within 30 days of employment per Rule 59A-36.011(4), F.A.C.). Facility applicability is configured in the Compliance Center.",
  estimatedMinutes: 60,
  clinicalReviewRequired: true,
  description:
    "Designed to cover the topics listed in s. 381.0035, F.S.: modes of HIV transmission, infection control procedures, clinical management and prevention, with emphasis on appropriate behavior and attitude change; current Florida law on testing, confidentiality of test results and treatment of patients; and protocols for HIV counseling and testing, reporting, offering HIV testing to pregnant women, and partner notification. Includes stigma reduction and occupational exposure response.",
  targetAudience: "Employees of Florida hospitals, nursing homes, home health agencies, assisted living facilities, group homes and behavioral health programs, and other healthcare workers.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Facilities must keep attendance records for this course (s. 381.0035, F.S.).",
  objectives: [
    "Explain how HIV is and is not transmitted and the difference between HIV and AIDS.",
    "Apply Standard Precautions and respond to occupational exposures.",
    "Describe HIV testing, treatment, viral suppression and 'Undetectable = Untransmittable'.",
    "Summarize Florida law on HIV testing, confidentiality, reporting, prenatal testing and partner services.",
    "Demonstrate respectful, non-stigmatizing attitudes and behaviors toward people with HIV.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "s. 381.0035, F.S.", title: "Educational course on HIV and AIDS; employees", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0381/Sections/0381.0035.html" },
    { agency: "Florida Legislature", citation: "s. 381.004, F.S.", title: "HIV testing (consent, confidentiality, disclosure)", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0381/Sections/0381.004.html" },
    { agency: "AHCA", citation: "Rule 59A-36.011(4), F.A.C.", title: "ALF HIV/AIDS education", url: "https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-59A-36-011" },
    { agency: "OSHA", citation: "29 CFR 1910.1030", title: "Bloodborne pathogens standard", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030" },
  ],
  sourceReferences: [
    { title: "About HIV", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/hiv/about/index.html", accessedOn: ACCESSED },
    { title: "How HIV Spreads", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/hiv/causes/index.html", accessedOn: ACCESSED },
    { title: "HIV Treatment as Prevention", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/hiv/prevention/treatment-as-prevention.html", accessedOn: ACCESSED },
    { title: "HIV/AIDS Section", publisher: "Florida Department of Health", url: "https://www.floridahealth.gov/diseases-and-conditions/aids/index.html", accessedOn: ACCESSED },
    { title: "Section 381.0035, Florida Statutes", publisher: "Florida Legislature", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0381/Sections/0381.0035.html", accessedOn: ACCESSED },
    { title: "National Clinician Consultation Center — PEPline", publisher: "UCSF / HRSA", url: "https://nccc.ucsf.edu/clinician-consultation/pep-post-exposure-prophylaxis/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. HIV and AIDS basics",
      summary: "What HIV does and how infection progresses.",
      lessons: [
        text("HIV, AIDS and the immune system", 9, `**HIV (human immunodeficiency virus)** attacks CD4 cells, a type of white blood cell that helps the body fight infection. Without treatment, HIV gradually weakens the immune system.

### Stages without treatment
1. **Acute HIV infection** — 2–4 weeks after infection, some people have flu-like symptoms; the amount of virus in the blood is very high and HIV spreads easily.
2. **Chronic HIV infection** — the virus keeps multiplying, often without symptoms, for years.
3. **AIDS (acquired immunodeficiency syndrome)** — the most advanced stage, diagnosed when the CD4 count falls below 200 cells/mm³ or certain opportunistic illnesses occur.

### With treatment
**Antiretroviral therapy (ART)** taken as prescribed controls the virus. People with HIV who start treatment early and stay on it can live long, healthy lives. ART can reduce the virus to an **undetectable viral load**.

> There is no cure for HIV, but it is a manageable chronic condition with treatment.`),
      ],
    },
    {
      title: "2. Transmission and prevention",
      summary: "How HIV spreads, how it doesn't, and prevention tools.",
      lessons: [
        text("Modes of transmission", 10, `HIV is spread only through certain body fluids from a person who has HIV and a **detectable** viral load: **blood, semen and pre-seminal fluid, rectal fluids, vaginal fluids and breast milk**. These fluids must contact a mucous membrane, damaged tissue, or be injected into the bloodstream.

**Main routes**
- Anal or vaginal sex without a condom or PrEP
- Sharing needles, syringes or other drug-injection equipment
- From mother to child during pregnancy, birth or breastfeeding (rare in the U.S. with testing and treatment)
- **Occupational exposure** — needlestick or sharps injury with contaminated blood (risk is low)

**HIV is NOT spread by** saliva, tears, sweat, hugging, shaking hands, sharing toilets or dishes, insects, or closed-mouth kissing.

### Prevention
- **Undetectable = Untransmittable (U=U):** people with HIV who take ART and keep an undetectable viral load **do not transmit HIV through sex** (CDC).
- **PrEP** (pre-exposure prophylaxis) for people without HIV — oral or long-acting injectable options.
- **PEP** (post-exposure prophylaxis) started as soon as possible and **within 72 hours** after an exposure.
- Condoms; sterile syringe services; prenatal testing and treatment.
- In healthcare: **Standard Precautions** for every patient, safe sharps handling and engineering controls.`),
        check("Check your understanding: transmission", [
          kc("hiv1", "Which can transmit HIV?", ["Sharing a drinking glass", "Hugging", "Sharing needles to inject drugs", "A mosquito bite"], 2, "Blood-to-blood contact through shared needles transmits HIV; casual contact does not."),
          kc("hiv2", "What does U=U mean?", ["Untested = Unsafe", "Undetectable = Untransmittable", "Universal = Unprotected", "Unknown = Uncertain"], 1, "People with a sustained undetectable viral load do not transmit HIV sexually."),
        ]),
      ],
    },
    {
      title: "3. Infection control and occupational exposure",
      summary: "Standard Precautions and what to do after an exposure.",
      lessons: [
        text("Protecting workers and patients", 9, `### Infection control procedures
- Use **Standard Precautions** with **every** patient — you often will not know who has HIV, hepatitis B or hepatitis C.
- Wear gloves and other PPE when contact with blood or body fluids is anticipated.
- Use safety-engineered sharps; **never recap** needles by hand; discard sharps immediately in a puncture-resistant container.
- Clean blood spills with an EPA-registered disinfectant per policy.

### Occupational exposure: act immediately
1. **Wash** needlesticks and cuts with soap and water; **flush** splashes to the nose, mouth or skin with water; **irrigate eyes** with clean water or saline. Do not squeeze the wound or use bleach.
2. **Report immediately** to your supervisor/employee health — PEP works best when started **as soon as possible** (ideally within hours), and no later than 72 hours.
3. Get a **medical evaluation**: the source patient's status may be assessed with consent per Florida law, and you'll receive testing, counseling and follow-up.
4. Clinicians can consult the **National Clinician Consultation Center PEPline**.

The average risk of HIV infection after a needlestick with HIV-infected blood was estimated at about **0.3%** (about 1 in 300) in older studies, and is lower when the source has an undetectable viral load — but every exposure is treated as urgent.`),
      ],
    },
    {
      title: "4. Florida law and testing",
      summary: "Testing, confidentiality, reporting, prenatal testing and partner services.",
      lessons: [
        text("What Florida law requires", 11, `> This summary is for education. Your facility's policies and legal counsel interpret how the law applies to your role.

### HIV testing (s. 381.004, F.S.)
- In healthcare settings, the person must be **notified** that an HIV test is planned and that they have the **right to decline**. Some settings require additional informed consent or counseling as specified in law and rule.
- Test results must be given to the person in a manner consistent with law; positive results are delivered with information about treatment and services.
- CDC recommends that everyone aged 13–64 be tested for HIV at least once as part of routine care, and people with ongoing risk more often.

### Confidentiality
- The identity of a person tested and their **HIV test results are confidential**. They may be disclosed only as the law allows (for example, to the person, their legal representative, providers involved in their care, and the health department).
- Do **not** discuss a person's HIV status with coworkers who are not involved in their care, family members (without authorization), or anyone else. Unauthorized disclosure can lead to discipline, civil liability and penalties.

### Reporting
HIV and AIDS are **reportable** to the Florida Department of Health under its disease-reporting rules; laboratories and practitioners make these reports. Reporting is a public health function and is permitted by HIPAA.

### Pregnant women
Florida law requires that pregnant women be **offered HIV testing** as part of prenatal care (at the initial visit and again later in pregnancy, as specified in s. 384.31, F.S.), with the right to decline. Treatment during pregnancy dramatically lowers the risk of transmission to the baby.

### Partner notification
The Department of Health offers **partner services** to help people with HIV notify sex or needle-sharing partners confidentially so partners can be tested and treated. Staff do not notify partners themselves.

### Treatment of patients
Refusing care or providing lesser care to a person because they have HIV is discrimination prohibited by federal and Florida law. HIV is a disability under the Americans with Disabilities Act.`),
        check("Check your understanding: Florida law", [
          kc("hiv3", "A coworker asks if a resident 'has AIDS' because she saw a medication in his room. What should you do?", ["Confirm it so she can be careful", "Decline to discuss it — HIV information is confidential and Standard Precautions apply to everyone", "Tell her to read the chart", "Tell the resident's roommate"], 1, "HIV status is confidential; everyone uses Standard Precautions."),
          kc("hiv4", "Who conducts confidential partner notification services in Florida?", ["Any staff member who knows the diagnosis", "The Florida Department of Health", "The patient's employer", "The facility receptionist"], 1, "DOH partner services help notify partners confidentially."),
        ]),
      ],
    },
    {
      title: "5. Attitudes, stigma and care",
      summary: "Respectful care and a case study.",
      lessons: [
        text("Reducing stigma", 6, `Stigma keeps people from getting tested and staying in care. Appropriate behavior and attitude change in healthcare means:
- Using **person-first, respectful language**: "person with HIV," not "AIDS patient" or "infected person."
- Never using extra PPE, separate dishes or isolation **only** because someone has HIV — Standard Precautions are the same for everyone.
- Protecting privacy every time — including conversations at the nurses' station, phone calls and screens.
- Supporting adherence and appointments without judgment.`),
        caseStudy("Case study: double gloves and whispers", 8, `**Situation (fictional).** A new resident at an assisted living facility, Mr. T., has HIV with an undetectable viral load. A caregiver insists on double gloves, a gown and a mask to deliver his meal tray and asks the kitchen to use paper plates "for him only." Two staff discuss his diagnosis in the hallway.

**Discussion:**
1. Are the extra precautions appropriate? *(No — HIV is not spread by casual contact or dishes. Standard Precautions apply based on the task, the same as for every resident.)*
2. What privacy problems occurred? *(Discussing his diagnosis where others could hear; disclosing to people not involved in his care.)*
3. What should the supervisor do? *(Correct the practices, provide education, review confidentiality policy, and check in with Mr. T. respectfully.)*
4. How might these behaviors affect Mr. T.? *(Shame, isolation, reluctance to disclose or seek care.)*`),
      ],
    },
  ],
  finalExam: {
    title: "HIV/AIDS Fundamentals — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which body fluid can transmit HIV?", ["Saliva", "Tears", "Blood", "Sweat"], 2, "Blood, semen, pre-seminal fluid, rectal and vaginal fluids and breast milk can transmit HIV."),
      tf("HIV can be transmitted by sharing toilets or eating utensils.", false, "HIV is not spread by casual contact."),
      mc("AIDS is diagnosed when:", ["A person first becomes infected", "The CD4 count falls below 200 cells/mm³ or certain opportunistic illnesses occur", "A person starts treatment", "A person has a cold"], 1, "AIDS is the most advanced stage of HIV infection."),
      mc("What does 'Undetectable = Untransmittable' mean?", ["People with an undetectable viral load on ART do not transmit HIV through sex", "HIV tests are unreliable", "HIV cannot be detected in anyone on treatment so testing is unnecessary", "People with HIV cannot transmit it by any route"], 0, "U=U applies to sexual transmission with sustained viral suppression."),
      mc("After a needlestick, what should you do first?", ["Squeeze the wound and apply bleach", "Wash with soap and water, then report immediately", "Finish your shift, then report", "Wait for symptoms"], 1, "Wash, report and seek evaluation immediately; PEP works best when started early."),
      mc("PEP should be started:", ["Within 6 months", "As soon as possible, and no later than 72 hours after exposure", "Only after the source patient's test result returns", "Only if symptoms develop"], 1, "Start as soon as possible; do not delay for results."),
      tf("Standard Precautions apply to every patient regardless of known HIV status.", true, "Many infections are unknown; treat all blood and body fluids as potentially infectious."),
      ms("Which topics does s. 381.0035, F.S. require the employee course to cover? (Select all that apply.)", ["Modes of transmission", "Confidentiality of test results under Florida law", "Offering HIV testing to pregnant women", "How to bill for HIV tests"], [0, 1, 2], "Billing is not among the statutory topics."),
      mc("Who may receive a patient's HIV test result without the patient's authorization?", ["Any coworker", "Only those permitted by law, such as providers involved in care and the health department", "The patient's employer", "Anyone who asks politely"], 1, "Florida law strictly limits disclosure."),
      sc("A family member asks you whether her mother's HIV test was positive. The mother has capacity and has not authorized disclosure. What should you do?", ["Tell her since she is family", "Explain you cannot share health information without her mother's permission", "Give her the lab report", "Ask another resident"], 1, "Disclosure requires authorization or a legal basis."),
      mc("Which language is respectful?", ["AIDS victim", "Person with HIV", "Infected patient", "HIV carrier"], 1, "Person-first language reduces stigma."),
      tf("Florida requires that pregnant women be offered HIV testing during prenatal care, with the right to decline.", true, "Prenatal HIV testing is offered under Florida law; treatment greatly reduces perinatal transmission."),
      mc("Who carries out confidential partner notification in Florida?", ["The facility's front desk", "The Florida Department of Health partner services", "The patient's neighbors", "The pharmacy"], 1, "DOH partner services notify partners confidentially."),
      sc("A coworker refuses to deliver a meal tray to a resident with HIV without a gown and mask. What is the best response?", ["Agree and add an isolation sign", "Explain HIV is not spread by casual contact and that Standard Precautions are task-based, and involve the supervisor if needed", "Reassign the resident to another facility", "Use paper plates for him only"], 1, "Unnecessary precautions stigmatize; educate and escalate."),
      mc("What is the main goal of antiretroviral therapy?", ["To cure HIV", "To suppress the virus, protect the immune system and prevent transmission", "To replace vaccines", "To treat colds"], 1, "ART controls HIV; there is no cure."),
    ],
  },
};
