import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const infectionPreventionControl: CourseContent = {
  code: "CHTA-MC-005",
  title: "Infection Prevention and Control in Healthcare Settings",
  categorySlug: "mandatory-compliance",
  isRequiredByDefault: true,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "Frequency depends on setting and policy (e.g., long-term care facility training programs under 42 CFR 483.95; Florida ALF in-service under Rule 59A-36.011(3)(a)). Configure applicability in the Compliance Center.",
  estimatedMinutes: 60,
  clinicalReviewRequired: true,
  description:
    "How infections spread in healthcare settings and the program-level practices that stop them: the chain of infection, the infection prevention program, surveillance and reporting, environmental cleaning and disinfection, reprocessing of reusable equipment, safe injection practices, respiratory and outbreak response, and staff health (vaccination, exposures and work restrictions). Companion to the Standard Precautions and PPE course, which covers bedside technique.",
  targetAudience: "All staff in hospitals, nursing homes, assisted living facilities, home health, clinics and laboratories — including direct care, environmental services, dietary and maintenance staff.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and knowledge checks and pass the final examination with 80% or higher. Hand hygiene and PPE skills are verified separately by an evaluator.",
  objectives: [
    "Explain the chain of infection and identify where common practices break each link.",
    "Describe the elements of a facility infection prevention and control program and each worker's role in it.",
    "Apply cleaning, disinfection and reprocessing principles, including contact times and Spaulding categories.",
    "Follow safe injection and medication-handling practices that prevent bloodborne transmission.",
    "Recognize and report possible outbreaks and respond to respiratory illness among patients, residents and staff.",
    "Describe staff health practices: vaccination, exposure reporting and work restrictions when ill.",
  ],
  regulatoryReferences: [
    { agency: "CMS", citation: "42 CFR 483.80", title: "Infection control — long-term care facilities", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-B/section-483.80" },
    { agency: "AHCA", citation: "Rule 59A-36.011(3)(a), F.A.C.", title: "ALF infection control in-service", url: "https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-59A-36-011" },
    { agency: "OSHA", citation: "29 CFR 1910.1030", title: "Bloodborne pathogens standard", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030" },
  ],
  sourceReferences: [
    { title: "Core Infection Prevention and Control Practices for Safe Healthcare Delivery in All Settings", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/core-practices/index.html", publishedOn: "2024-04-12", accessedOn: ACCESSED },
    { title: "Guideline for Disinfection and Sterilization in Healthcare Facilities (2008, updated)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/disinfection-sterilization/index.html", accessedOn: ACCESSED },
    { title: "Injection Safety: Information for Providers", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/injection-safety/hcp/index.html", accessedOn: ACCESSED },
    { title: "Infection Control in Healthcare Personnel: Epidemiology and Control of Selected Infections", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/healthcare-personnel-epidemiology-control/index.html", accessedOn: ACCESSED },
    { title: "Selected EPA-Registered Disinfectants", publisher: "U.S. Environmental Protection Agency", url: "https://www.epa.gov/pesticide-registration/selected-epa-registered-disinfectants", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. How infections spread",
      summary: "The chain of infection and healthcare-associated infections.",
      lessons: [
        text("The chain of infection", 8, `An infection happens only when six links connect. Breaking **any one link** prevents it.

| Link | Meaning | How we break it |
|---|---|---|
| **Infectious agent** | Bacteria, viruses, fungi, parasites | Cleaning, disinfection, sterilization, treatment |
| **Reservoir** | Where the germ lives — people, water, surfaces, equipment | Environmental cleaning, water management, staff health |
| **Portal of exit** | How it leaves — blood, secretions, coughs, stool | Covering coughs, containing drainage, PPE |
| **Mode of transmission** | Contact, droplet, airborne, bloodborne, common vehicle | **Hand hygiene**, PPE, isolation precautions, safe injections |
| **Portal of entry** | Broken skin, mucous membranes, catheters, IV lines | Aseptic technique, wound and device care |
| **Susceptible host** | Older adults, people with chronic illness, devices or weak immunity | Vaccination, nutrition, removing devices when no longer needed |

### Healthcare-associated infections (HAIs)
HAIs are infections that patients or residents acquire while receiving care. Common examples include catheter-associated urinary tract infections, central line–associated bloodstream infections, surgical site infections, *Clostridioides difficile* (C. diff) diarrhea and multidrug-resistant organisms such as MRSA. Many HAIs are preventable when every worker follows the same basic practices — every time, with every person.

> **Key point:** Hands are the most common vehicle for spreading germs in healthcare. Hand hygiene at the right moments is the single most important link-breaker you control.`),
      ],
    },
    {
      title: "2. The infection prevention program",
      summary: "Program elements, surveillance and your role.",
      lessons: [
        text("What a facility program includes", 8, `Every healthcare facility should have an infection prevention and control (IPC) program led by a trained person. Nursing homes participating in Medicare/Medicaid must maintain one under 42 CFR 483.80, including an infection preventionist. Typical elements:

- **Written policies** based on national guidelines (CDC) and state rules.
- **Surveillance** — tracking infections and organisms to detect trends and outbreaks.
- **Reporting** — certain diseases must be reported to the county health department under Florida law; your facility's infection preventionist or designee makes these reports.
- **Antibiotic stewardship** — using antibiotics only when needed, to slow resistance.
- **Education and competency** — initial and ongoing training, with observed skills.
- **Audits and feedback** — hand hygiene and cleaning audits, shared with staff.
- **Employee health** — vaccination programs, exposure management and work restrictions.

### Your role
- Follow the policies, even when busy.
- **Report** possible infections and clusters (for example, two or more residents on one unit with vomiting and diarrhea within a few days) to your supervisor or the infection preventionist **right away**.
- Speak up — and accept feedback — when a practice is missed. Facilities with a just culture improve fastest.`),
        check("Check your understanding: the program", [
          kc("ipc1", "Two residents on the same hall develop vomiting and diarrhea within 24 hours. What should you do first?", ["Wait to see if a third resident becomes ill", "Report it promptly to your supervisor or the infection preventionist", "Move the residents to a different hall yourself", "Post the information on social media to warn families"], 1, "Clusters may signal an outbreak. Early reporting lets the infection preventionist start precautions and public health notification."),
          kc("ipc2", "Which is a purpose of antibiotic stewardship?", ["Use the newest antibiotics for every infection", "Use antibiotics only when needed and at the right dose and duration", "Avoid antibiotics entirely in older adults", "Let residents choose their own antibiotics"], 1, "Stewardship reduces unnecessary antibiotic use, which drives resistance and C. diff infection."),
        ]),
      ],
    },
    {
      title: "3. Cleaning, disinfection and reprocessing",
      summary: "Environmental hygiene, contact time and the Spaulding categories.",
      lessons: [
        text("Clean first, then disinfect — and respect contact time", 10, `**Cleaning** removes dirt and organic material. **Disinfection** kills most germs on surfaces. **Sterilization** kills all microbial life, including spores. Disinfectants work poorly on dirty surfaces, so **clean first** (or use a one-step cleaner-disinfectant as labeled).

### Use products correctly
- Use **EPA-registered** hospital disinfectants approved by your facility.
- Follow the label **contact time** (also called wet or dwell time) — the surface must stay wet for the full time stated, often 1–10 minutes depending on the product.
- Check the label for the organisms claimed. For *C. difficile*, a product with a **sporicidal** claim (for example, many bleach-based products) is needed.
- Wear the PPE the label and your policy require; never mix chemicals.

### High-touch surfaces
Bed rails, call lights, over-bed tables, door handles, light switches, toilet handles, remote controls, keyboards and shared equipment are cleaned at least daily and whenever visibly soiled.

### Spaulding classification for reusable equipment
| Category | Contact | Required processing | Examples |
|---|---|---|---|
| **Critical** | Enters sterile tissue or the bloodstream | **Sterilization** | Surgical instruments |
| **Semi-critical** | Touches mucous membranes or non-intact skin | **High-level disinfection** (at minimum) | Some endoscopes, respiratory equipment |
| **Non-critical** | Touches intact skin only | **Low- or intermediate-level disinfection** | Blood pressure cuffs, stethoscopes, glucometers |

Shared equipment such as **glucometers** must be cleaned and disinfected after **every** use, following the device manufacturer's instructions. Single-use items are never reused.`),
      ],
    },
    {
      title: "4. Safe injections, respiratory illness and outbreaks",
      summary: "Practices that prevent bloodborne and respiratory spread.",
      lessons: [
        text("Injection safety and respiratory response", 10, `### Safe injection practices (CDC "One and Only" campaign)
- **One needle, one syringe, one time.** Never reuse a needle or syringe, even to draw more medication or on the same patient's IV tubing.
- Use **single-dose vials** for one patient only; discard the remainder.
- If multi-dose vials must be used, dedicate them to a single patient when possible; if shared, keep them out of the immediate patient treatment area, use a new needle and syringe every entry, and date them per policy.
- **Fingerstick devices** (lancets) are single-use and auto-disabling; never share.
- Prepare medications in a clean area away from potential contamination.

Reuse of syringes and shared fingerstick devices have caused outbreaks of hepatitis B and C in U.S. clinics and long-term care.

### Respiratory illness
- Post signs and provide masks, tissues and hand rub at entrances.
- Encourage **respiratory hygiene/cough etiquette** for everyone.
- Place symptomatic patients according to policy and use **Transmission-Based Precautions** as directed.
- Follow your facility's current testing and masking guidance, which may change with community transmission.

### Outbreak response basics
When an outbreak is suspected, the infection preventionist may increase cleaning, cohort residents or staff, restrict group activities, collect specimens and notify the health department. Your job: follow the instructions consistently and report new cases quickly.`),
        check("Check your understanding: injections and respiratory illness", [
          kc("ipc3", "A nurse needs a second dose from a single-dose vial for the same patient. What is correct?", ["Re-enter the vial with the same syringe", "Use the vial again with a new syringe because it is the same patient", "Use a new single-dose vial", "Save the remainder for the next patient"], 2, "Single-dose vials lack preservative and are for a single entry for one patient; discard any remainder."),
          kc("ipc4", "Which items require cleaning and disinfection after every patient use?", ["Shared glucometers", "Blood pressure cuffs shared between patients", "Single-use lancets", "Stethoscopes"], [0, 1, 3], "Shared non-critical equipment must be cleaned and disinfected between patients. Lancets are single-use and discarded."),
        ]),
      ],
    },
    {
      title: "5. Staff health and applying it all",
      summary: "Vaccination, exposures, work restrictions and a case study.",
      lessons: [
        text("Protecting staff — and patients from staff", 7, `- **Vaccinations:** Healthcare personnel are recommended to be protected against hepatitis B, influenza (every season), measles-mumps-rubella, varicella, tetanus-diphtheria-pertussis, and COVID-19 per current CDC guidance. Your employer offers hepatitis B vaccine at no cost if you have occupational exposure (OSHA bloodborne pathogens standard).
- **Exposures:** Report needlesticks, splashes and other exposures **immediately** so evaluation and any post-exposure treatment can start quickly.
- **Work restrictions:** Do not work while you have fever, vomiting or diarrhea, a draining skin lesion, or other symptoms your policy lists. Tell your supervisor; follow return-to-work rules.
- **Personal practices:** Keep nails short; artificial nails are not recommended for staff with direct patient contact; follow your dress code.`),
        caseStudy("Case study: a norovirus-like cluster", 8, `**Situation (fictional).** On Monday, two residents on the Magnolia wing of an assisted living facility develop sudden vomiting and diarrhea. A caregiver who worked Sunday also called in sick with the same symptoms. Dining is shared across wings.

**What went well:** A caregiver recognized the pattern and told the supervisor the same day.

**What the team did:**
1. The administrator notified the person responsible for infection control, who contacted the county health department as required by facility policy and Florida law.
2. Ill residents stayed in their rooms with dedicated bathrooms where possible; staff used gloves and gowns for care.
3. Because alcohol-based hand rub is less effective against norovirus, staff used **soap and water** after care.
4. Housekeeping switched to a disinfectant with a label claim for norovirus and increased high-touch cleaning, following contact times.
5. Group dining and activities on the affected wing were paused; staff were asked not to float between wings.
6. Ill staff stayed home until symptoms resolved for the period set by policy.

**Discussion questions:**
- Which links in the chain of infection did each action break?
- Why was the caregiver's early report important?
- What would you do if a coworker came to work with diarrhea because the unit was short-staffed?`),
      ],
    },
  ],
  finalExam: {
    title: "Infection Prevention and Control — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which link in the chain of infection does hand hygiene primarily break?", ["Infectious agent", "Mode of transmission", "Susceptible host", "Reservoir"], 1, "Hands carry germs between people and surfaces; hand hygiene interrupts that transmission."),
      mc("Vaccinating residents and staff primarily strengthens which link?", ["Portal of exit", "Mode of transmission", "Susceptible host", "Infectious agent"], 2, "Vaccination reduces susceptibility of the host."),
      tf("Disinfectants work best when applied to visibly dirty surfaces without cleaning first.", false, "Organic material interferes with disinfection. Clean first, or use a one-step cleaner-disinfectant as labeled."),
      mc("What does a disinfectant's 'contact time' mean?", ["How long the product can be stored", "How long the surface must remain wet for the product to work", "How long to wait before wiping the surface dry", "The time between daily cleanings"], 1, "The surface must remain wet for the labeled contact time to achieve the claimed kill."),
      mc("A blood pressure cuff touches only intact skin. Under the Spaulding system it is:", ["Critical — sterilize", "Semi-critical — high-level disinfection", "Non-critical — low- or intermediate-level disinfection", "Single-use — discard"], 2, "Items contacting intact skin are non-critical."),
      mc("Which product is needed for rooms of residents with C. difficile infection?", ["Any alcohol wipe", "A disinfectant with a sporicidal (C. difficile) label claim", "Soap and water only", "Air freshener"], 1, "C. diff spores resist many disinfectants; use a product with a sporicidal claim per policy."),
      tf("A needle may be reused on the same patient if it has not touched anything else.", false, "Needles and syringes are single use — one needle, one syringe, one time."),
      ms("Which are safe injection practices? (Select all that apply.)", ["Use single-dose vials for one patient only", "Use a new needle and syringe for every vial entry", "Share insulin pens between residents if the needle is changed", "Use single-use, auto-disabling lancets"], [0, 1, 3], "Insulin pens must never be shared, even with a new needle, because blood can backflow into the cartridge."),
      sc("You notice three residents on one hall with new cough and fever over two days. What is the best action?", ["Keep observing until a fourth resident is ill", "Report the cluster promptly to your supervisor or infection preventionist", "Give the residents leftover antibiotics", "Move them all into one room yourself"], 1, "Early reporting allows testing, precautions and required health department notification."),
      mc("Which statement about antibiotic stewardship is correct?", ["More antibiotics always prevent infection", "Unnecessary antibiotic use contributes to resistance and C. diff infection", "Stewardship is only the pharmacist's concern", "Antibiotics treat viral colds"], 1, "Overuse drives resistance and C. diff; everyone supports stewardship by reporting accurately and not pressuring prescribers."),
      tf("Shared glucometers must be cleaned and disinfected after every use according to the manufacturer's instructions.", true, "Glucometers shared between patients have transmitted hepatitis B when not disinfected between uses."),
      mc("A caregiver has vomiting and diarrhea the morning of a shift. What should they do?", ["Work but wear gloves", "Report to the supervisor and stay home per the work-restriction policy", "Take medicine and work the shift", "Work only with residents who are already ill"], 1, "Ill staff spread infection to vulnerable people; follow work-restriction and return-to-work rules."),
      mc("Which agency registers hospital disinfectants used in U.S. facilities?", ["FDA", "EPA", "OSHA", "CMS"], 1, "Hospital surface disinfectants are registered by the U.S. Environmental Protection Agency."),
      ms("Which are typical elements of a facility infection prevention program? (Select all that apply.)", ["Surveillance of infections", "Education and competency checks", "Antibiotic stewardship", "Letting each worker set their own cleaning schedule"], [0, 1, 2], "Programs standardize practices; cleaning schedules come from policy, not individual preference."),
      sc("During a suspected norovirus outbreak, which hand hygiene method is preferred after resident care?", ["Alcohol-based hand rub only", "Soap and water", "No hand hygiene if gloves were worn", "Hand lotion"], 1, "Alcohol-based hand rub is less effective against norovirus; wash with soap and water, and always perform hand hygiene after removing gloves."),
    ],
  },
};
