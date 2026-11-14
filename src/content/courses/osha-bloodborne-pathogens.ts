import type { CourseContent } from "../types";

const ACCESSED = "2026-11-13";
const STD = "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030";

export const oshaBloodbornePathogens: CourseContent = {
  code: "CHITA-MC-004",
  title: "OSHA Bloodborne Pathogens",
  categorySlug: "mandatory-compliance",
  isRequiredByDefault: true,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: 12,
  renewalBasis: "29 CFR 1910.1030(g)(2)(ii)(B) and (g)(2)(iv): at initial assignment and at least annually — within one year of the previous training — for employees with occupational exposure.",
  estimatedMinutes: 75,
  clinicalReviewRequired: true,
  description:
    "Required training for employees with reasonably anticipated contact with blood or other potentially infectious materials (OPIM). Covers the OSHA Bloodborne Pathogens Standard, how hepatitis B, hepatitis C and HIV are transmitted at work, your employer's Exposure Control Plan, safer sharps and work practices, personal protective equipment, hepatitis B vaccination, what to do immediately after an exposure, labels and color coding, and recordkeeping. Written for clinics, assisted living, home health, laboratories and other healthcare settings.",
  targetAudience:
    "Employees whose job duties involve reasonably anticipated skin, eye, mucous membrane or parenteral contact with blood or OPIM — for example nurses, aides and caregivers providing personal care, phlebotomists and lab staff, medical assistants, environmental services and laundry staff, and designated first-aid responders.",
  prerequisites: [],
  completionCriteria:
    "Complete every required lesson and knowledge check and pass the final examination with 80% or higher. OSHA also requires an opportunity for interactive questions and answers with a person knowledgeable about the standard and your workplace's Exposure Control Plan; your employer must provide that contact (named in your facility's plan). Site-specific procedures and hands-on PPE practice are completed with your facility.",
  objectives: [
    "Explain the purpose and scope of the OSHA Bloodborne Pathogens Standard (29 CFR 1910.1030) and where to obtain a copy.",
    "Describe how HBV, HCV and HIV are transmitted in the workplace and the symptoms of bloodborne diseases.",
    "Locate and explain your employer's Exposure Control Plan and identify tasks that may involve exposure.",
    "Apply universal precautions, engineering controls, work practice controls and appropriate PPE.",
    "Describe the hepatitis B vaccination program, including that it is offered at no cost.",
    "Respond correctly to an exposure incident: immediate first aid, reporting, and confidential post-exposure evaluation.",
    "Recognize required biohazard labels, signs and color coding.",
  ],
  regulatoryReferences: [
    { agency: "OSHA", citation: "29 CFR 1910.1030", title: "Bloodborne Pathogens Standard", url: STD },
    { agency: "OSHA", citation: "29 CFR 1910.1030(g)(2)", title: "Information and training requirements", url: STD },
    { agency: "OSHA", citation: "29 CFR 1910.1030(h)", title: "Recordkeeping (medical, training, sharps injury log)", url: STD },
  ],
  sourceReferences: [
    { title: "29 CFR 1910.1030 — Bloodborne pathogens (regulatory text)", publisher: "Occupational Safety and Health Administration", url: STD, accessedOn: ACCESSED },
    { title: "Bloodborne Pathogens and Needlestick Prevention (safety and health topic)", publisher: "Occupational Safety and Health Administration", url: "https://www.osha.gov/bloodborne-pathogens", accessedOn: ACCESSED },
    { title: "Clinical Safety: Hand Hygiene for Healthcare Workers", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/clean-hands/hcp/clinical-safety/index.html", publishedOn: "2024-02-27", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. The standard and bloodborne diseases",
      summary: "Scope of the standard, key definitions, and how HBV, HCV and HIV spread.",
      lessons: [
        {
          title: "Introduction to the Bloodborne Pathogens Standard",
          type: "TEXT",
          durationMinutes: 8,
          body: `OSHA issued the **Bloodborne Pathogens Standard (29 CFR 1910.1030)** to protect workers from infections spread through contact with blood and certain body fluids. It was strengthened by the **Needlestick Safety and Prevention Act**, which added requirements for safer sharps devices and employee involvement in choosing them.

You are entitled to a **copy of the standard** and an explanation of its contents. Your employer must make it available — ask your supervisor or see the link in this course's references.

### Key definitions
- **Bloodborne pathogens** — microorganisms in human blood that can cause disease, including hepatitis B virus (HBV), hepatitis C virus (HCV) and human immunodeficiency virus (HIV).
- **Other potentially infectious materials (OPIM)** — certain body fluids (for example semen, vaginal secretions, cerebrospinal, synovial, pleural, pericardial, peritoneal and amniotic fluids, and saliva in dental procedures), **any body fluid visibly contaminated with blood**, fluids that cannot be distinguished, unfixed human tissue or organs, and HIV- or HBV-containing cultures.
- **Occupational exposure** — *reasonably anticipated* skin, eye, mucous membrane or parenteral contact with blood or OPIM that may result from your job duties.
- **Exposure incident** — a *specific* eye, mouth, other mucous membrane, non-intact skin or parenteral contact with blood or OPIM during your duties.
- **Parenteral** — piercing the skin or mucous membranes, such as a needlestick, cut or bite.

### Universal precautions
The standard requires **universal precautions**: treat all human blood and OPIM **as if known to be infectious**. You cannot tell who is infected by looking at them, and many people with HBV, HCV or HIV do not know they are infected. (In patient care, CDC's broader **Standard Precautions** build on this idea — see the Standard Precautions and PPE course.)`,
        },
        {
          title: "Hepatitis B, hepatitis C and HIV",
          type: "PRESENTATION",
          durationMinutes: 10,
          body: `## How bloodborne diseases spread at work
The main routes are:
- **Sharps injuries** — needlesticks and cuts from contaminated instruments or broken glass
- **Splashes** of blood or OPIM into the eyes, nose or mouth
- Contact with **non-intact skin** — cuts, abrasions, dermatitis, hangnails

Bloodborne pathogens are **not** spread by casual contact such as shaking hands, sharing a room or using the same restroom.

---
## Hepatitis B (HBV)
- Infects the liver; can cause acute illness, chronic infection, cirrhosis and liver cancer.
- **Highly transmissible** after a needlestick compared with HCV or HIV, and the virus can survive in dried blood on surfaces for an extended time (about a week).
- Symptoms may include fatigue, loss of appetite, nausea, abdominal pain, dark urine, jaundice — or none at all.
- **A safe and effective vaccine exists.** Your employer must offer it at no cost if you have occupational exposure.

---
## Hepatitis C (HCV)
- The most common chronic bloodborne infection in the United States.
- Often no symptoms for years while liver damage progresses.
- **No vaccine**, but curative antiviral treatments are available — making prompt follow-up after an exposure important.

---
## HIV
- Attacks the immune system; without treatment can progress to AIDS.
- The risk of infection after a single needlestick from an HIV-positive source is low, and lower still for splashes to mucous membranes or intact skin.
- **Post-exposure prophylaxis (PEP)** can reduce the risk of infection when started promptly — ideally within hours and no later than 72 hours after the exposure — which is why exposures must be reported **immediately**.
- People with HIV who take effective treatment can live long, healthy lives.

---
## Key point
You cannot identify infected patients by appearance. **Treat all blood and OPIM as infectious, every time.**`,
        },
        {
          title: "Knowledge check: definitions and transmission",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 4,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "Which of these is an exposure incident?",
                options: [
                  { id: "a", text: "Blood on your intact, gloved hand" },
                  { id: "b", text: "A needlestick from a used needle while discarding it" },
                  { id: "c", text: "Shaking hands with a patient who has hepatitis C" },
                  { id: "d", text: "Cleaning a dry, visibly clean countertop" },
                ],
                correct: "b",
                explanation: "A parenteral (skin-piercing) contact with blood or OPIM during job duties is an exposure incident.",
              },
              {
                id: "k2",
                prompt: "Which bloodborne disease can be prevented by a vaccine your employer must offer at no cost?",
                options: [
                  { id: "a", text: "HIV" },
                  { id: "b", text: "Hepatitis C" },
                  { id: "c", text: "Hepatitis B" },
                ],
                correct: "c",
                explanation: "There is a vaccine for hepatitis B. There is no vaccine for hepatitis C or HIV.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "2. The Exposure Control Plan",
      summary: "What the written plan contains, exposure determination, and how to get a copy.",
      lessons: [
        {
          title: "Your employer's Exposure Control Plan",
          type: "TEXT",
          durationMinutes: 7,
          body: `Every employer with employees who have occupational exposure must have a **written Exposure Control Plan (ECP)** designed to eliminate or minimize exposure. You have the right to see it — it must be accessible to employees.

### What the plan includes
- **Exposure determination** — a list of job classifications in which **all** employees have occupational exposure, those in which **some** do, and the tasks and procedures involved. This determination is made **without regard to PPE** (wearing gloves does not mean a job has no exposure).
- **Schedule and methods of implementation** for each part of the standard: controls, PPE, housekeeping, vaccination, post-exposure follow-up, training, labels and recordkeeping.
- **The procedure for evaluating the circumstances of exposure incidents.**

### Keeping the plan current
- The ECP must be **reviewed and updated at least annually**, and whenever new or modified tasks and procedures affect exposure.
- The annual review must reflect changes in technology that reduce exposure and document consideration and implementation of **commercially available safer medical devices**.
- The employer must ask **non-managerial front-line employees** who are responsible for direct patient care, and who may be exposed to sharps injuries, for input in identifying, evaluating and selecting effective controls — and document that input.

> **Find it now:** Ask your supervisor where the ECP is kept (often in the infection control manual or the policy portal) and who the plan administrator is. That person is also who you can ask questions about this training.`,
        },
      ],
    },
    {
      title: "3. Preventing exposure: controls, work practices and PPE",
      summary: "Engineering controls, safe work practices, PPE, housekeeping, waste and laundry.",
      lessons: [
        {
          title: "Engineering and work practice controls",
          type: "TEXT",
          durationMinutes: 9,
          body: `OSHA requires employers to use **engineering and work practice controls first**, and PPE where exposure remains.

### Engineering controls
Controls that isolate or remove the hazard:
- **Sharps disposal containers** that are closable, puncture-resistant, leakproof on the sides and bottom, labeled or color-coded, kept **upright**, located as close as feasible to where sharps are used, and **replaced before they are overfilled** (follow the fill line).
- **Safer sharps devices** — needleless systems, self-sheathing needles, retractable lancets, blunt suture needles.
- Splash guards and biosafety cabinets in laboratories.

### Work practice controls
How tasks are performed:
- **Never recap, bend, break or remove contaminated needles** by hand. If recapping is required by a specific procedure, use a mechanical device or the **one-handed scoop technique**. Shearing or breaking needles is prohibited.
- **Activate safety features** immediately after use and discard sharps at the point of use.
- **Wash hands** immediately after removing gloves or other PPE, and wash skin or flush mucous membranes **as soon as feasible** after contact with blood or OPIM. When sinks are not available (for example, in home health), use antiseptic hand cleaner or towelettes, then wash with soap and running water as soon as feasible.
- **No eating, drinking, smoking, applying cosmetics or lip balm, or handling contact lenses** in work areas with a reasonable likelihood of exposure. Do not store food or drinks in refrigerators, freezers, shelves or countertops where blood or OPIM are present.
- Perform procedures in ways that **minimize splashing, spraying and spattering**. **Mouth pipetting is prohibited.**
- Place specimens in **leakproof containers** labeled or color-coded for handling, storage and transport.

### Housekeeping, waste and laundry
- Clean and decontaminate equipment and surfaces after contact with blood or OPIM using an appropriate (EPA-registered) disinfectant, according to the employer's written schedule.
- Pick up broken glass with mechanical means (brush and dustpan, tongs), **never with your hands**.
- **Regulated waste** goes in closable, leakproof, labeled or red containers. Follow state rules for biomedical waste disposal.
- Handle contaminated laundry as little as possible, bag it where used, and use labeled or color-coded leakproof bags when it is wet.`,
        },
        {
          title: "Personal protective equipment",
          type: "TEXT",
          durationMinutes: 8,
          body: `When exposure remains after engineering and work practice controls, the employer must provide **appropriate PPE at no cost to you** — and make sure you use it.

### Appropriate PPE
PPE is appropriate only if it **does not allow blood or OPIM to pass through or reach** your clothes, skin, eyes, mouth or other mucous membranes under normal conditions of use and for the duration of use. Examples:

| PPE | When |
|---|---|
| **Gloves** | When you can reasonably anticipate hand contact with blood, OPIM, mucous membranes or non-intact skin; for vascular access procedures; when handling contaminated items or surfaces. |
| **Gowns, aprons, lab coats** | When clothing may be soiled. Fluid-resistant or impervious garments when splashes are likely. |
| **Masks with eye protection, or chin-length face shields** | When splashes, spray, spatter or droplets of blood or OPIM may reach the eyes, nose or mouth. |
| **Resuscitation devices** | Mouthpieces, pocket masks and bag-valve masks to avoid mouth-to-mouth contact. |

### Employer responsibilities
- Provide PPE in the right **sizes**, readily accessible, with **hypoallergenic gloves, liners or alternatives** for employees allergic to the standard gloves.
- **Clean, launder, repair, replace and dispose of PPE** at no cost to you. Do not take contaminated uniforms or PPE home to wash.

### Your responsibilities
- Inspect PPE before use. Replace disposable gloves as soon as feasible when contaminated, torn or punctured. **Never wash or reuse disposable gloves.**
- Remove a garment penetrated by blood or OPIM immediately or as soon as feasible.
- **Remove all PPE before leaving the work area** and place it in the designated container.
- Perform hand hygiene after removing gloves — gloves do not replace hand hygiene.`,
        },
        {
          title: "Knowledge check: controls and PPE",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 4,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "After giving an injection, the safest action is to:",
                options: [
                  { id: "a", text: "Recap the needle with two hands and carry it to the sharps container" },
                  { id: "b", text: "Activate the safety feature and discard the device immediately in a sharps container at the point of use" },
                  { id: "c", text: "Place it on the tray to discard after you finish charting" },
                  { id: "d", text: "Bend the needle so no one else can use it" },
                ],
                correct: "b",
                explanation: "Activate the safety device and discard at the point of use. Two-handed recapping and bending are prohibited.",
              },
              {
                id: "k2",
                prompt: "Who pays for PPE required by the Bloodborne Pathogens Standard?",
                options: [
                  { id: "a", text: "The employee" },
                  { id: "b", text: "The employer — PPE is provided, cleaned, repaired and replaced at no cost to the employee" },
                  { id: "c", text: "Shared equally" },
                ],
                correct: "b",
                explanation: "Required PPE and its laundering, repair, replacement and disposal must be at no cost to the employee.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "4. Hepatitis B vaccination",
      summary: "Who is offered the vaccine, timing, cost, and declination.",
      lessons: [
        {
          title: "The hepatitis B vaccination program",
          type: "TEXT",
          durationMinutes: 6,
          body: `The hepatitis B vaccine is safe and highly effective at preventing HBV infection. Under the standard:

- The employer must make the **hepatitis B vaccine and vaccination series available to all employees with occupational exposure**, **at no cost**, at a reasonable time and place, performed by or under the supervision of a licensed healthcare professional, and according to U.S. Public Health Service recommendations.
- It must be offered **after you receive this training and within 10 working days of initial assignment**, unless you have already completed the series, antibody testing shows you are immune, or the vaccine is medically contraindicated for you.
- The employer **may not require prescreening** (antibody testing) as a condition of receiving the vaccine.
- If you choose not to be vaccinated, you must sign the **declination statement** (the wording is set by the standard). **You can change your mind** — if you later decide to be vaccinated while still covered by the standard, the employer must provide it at no cost.
- If the Public Health Service recommends a **booster dose**, it must also be provided at no cost.

> Ask your supervisor or employee health contact how to receive the vaccine at your facility. Questions about whether the vaccine is right for you should go to a licensed healthcare professional.`,
        },
      ],
    },
    {
      title: "5. After an exposure: what to do immediately",
      summary: "First aid, reporting, the confidential medical evaluation, and follow-up.",
      lessons: [
        {
          title: "Exposure response — step by step",
          type: "TEXT",
          durationMinutes: 8,
          body: `If you have a needlestick, cut, bite, or a splash of blood or OPIM to your eyes, nose, mouth or non-intact skin:

### 1. Provide immediate first aid
- **Wash** needlesticks, cuts and skin with **soap and water**.
- **Flush** splashes to the nose, mouth or skin with water.
- **Irrigate eyes** with clean water, saline or sterile irrigants.
- Do **not** squeeze the wound or apply bleach or other caustic agents.

### 2. Report immediately
Tell your supervisor (or the person named in your Exposure Control Plan) **right away** — do not wait until the end of your shift. Time matters, especially because HIV post-exposure prophylaxis works best when started as soon as possible.

### 3. Get a confidential medical evaluation
The employer must make available, **immediately** after a reported exposure incident and at no cost, a **confidential medical evaluation and follow-up** that includes:
- Documentation of the route of exposure and how it happened.
- Identification of the **source individual** when feasible and testing of the source's blood for HBV, HCV and HIV, with consent as required by law. Results are made available to you along with information about laws on disclosure of the source's identity and status.
- Collection and testing of **your blood** with your consent.
- **Post-exposure prophylaxis** when medically indicated, as recommended by the U.S. Public Health Service.
- Counseling and evaluation of any illnesses you report.

The evaluating healthcare professional receives a copy of the standard, your job description, details of the incident, source testing results if available, and your relevant medical records. You receive a copy of the professional's **written opinion within 15 days** of the evaluation — limited to whether hepatitis B vaccination is indicated (and whether you received it), that you were informed of the results, and that you were told about any conditions requiring further evaluation or treatment. All other findings stay **confidential**.

### 4. Help prevent the next one
Your incident will be reviewed and, if your employer keeps OSHA injury records, logged in the **sharps injury log** (without your name being disclosed). Share what happened and what might have prevented it — this feeds the annual review of safer devices.`,
        },
        {
          title: "Case study: a home health needlestick",
          type: "CASE_STUDY",
          durationMinutes: 5,
          body: `**Situation.** Paul, an LPN with a home health agency, checks a client's blood glucose in the client's kitchen. While disposing of the lancet, the portable sharps container tips over and he is stuck on the finger by a used lancet that had not retracted.

**What Paul did right**
- Washed the puncture with soap and running water at the client's sink.
- Called his supervisor **from the client's home** rather than waiting until the end of the day.
- Went to the clinic the agency designated for post-exposure evaluation that afternoon.

**What could have prevented it**
- A portable sharps container secured upright in his kit, and closed between uses.
- Activating the retractable lancet immediately and discarding it at the point of use.
- Using the agency-approved safety lancet model — the one Paul used was a client-supplied device.

**Follow-up.** The agency recorded the event in its sharps injury log, reviewed the client-supplied device issue with the care team, and updated its Exposure Control Plan to supply safety lancets to all field clinicians.

**Reflect:** Where is your nearest sharps container right now, and who do you call after an exposure on an evening or weekend shift?`,
        },
        {
          title: "Knowledge check: exposure response",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 4,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "Blood splashes into your eye while emptying a suction canister. What do you do first?",
                options: [
                  { id: "a", text: "Finish the task, then report at the end of the shift" },
                  { id: "b", text: "Flush the eye immediately with clean water or saline, then report right away" },
                  { id: "c", text: "Apply alcohol to the eye" },
                ],
                correct: "b",
                explanation: "Flush immediately, then report so the confidential medical evaluation can begin without delay.",
              },
              {
                id: "k2",
                prompt: "After a post-exposure evaluation, your employer receives which information from the healthcare professional?",
                options: [
                  { id: "a", text: "Your full test results and diagnosis" },
                  { id: "b", text: "A limited written opinion: vaccination status/indication and that you were informed of results and follow-up needs" },
                  { id: "c", text: "Nothing at all" },
                ],
                correct: "b",
                explanation: "The written opinion is limited; all other findings remain confidential.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "6. Labels, signs, training and records",
      summary: "Biohazard labeling and color coding, your training rights, and recordkeeping.",
      lessons: [
        {
          title: "Labels, training and recordkeeping",
          type: "TEXT",
          durationMinutes: 6,
          body: `### Labels and color coding
- **Biohazard warning labels** must be attached to containers of regulated waste, refrigerators and freezers containing blood or OPIM, and other containers used to store, transport or ship blood or OPIM.
- Labels are **fluorescent orange or orange-red** (or predominantly so) with the biohazard symbol and lettering in a contrasting color.
- **Red bags or red containers** may be used instead of labels.
- Contaminated equipment sent for service or shipping must be labeled and state which portions remain contaminated.

### Your training rights
Training must be:
- Provided **at no cost** and **during working hours**,
- Given **at initial assignment** to tasks with occupational exposure, **at least annually** (within one year of your previous training), and whenever new or changed tasks affect your exposure,
- Appropriate in content and vocabulary to your **education, literacy and language**, and
- Conducted by someone knowledgeable — including **an opportunity for interactive questions and answers** with a person who knows the standard and your workplace.

### Records
- **Training records** (dates, content summary, trainer names and qualifications, and names and job titles of attendees) are kept for **3 years**.
- **Medical records** for each employee with occupational exposure are kept **confidential** and retained for the **duration of employment plus 30 years**. They are not disclosed without your written consent except as required by law.
- Employers covered by OSHA's injury and illness recordkeeping rule maintain a **sharps injury log** recording the device type and brand, the work area, and how the incident happened, while protecting your privacy.`,
        },
        {
          title: "Key takeaways",
          type: "TEXT",
          durationMinutes: 3,
          body: `- Treat **all** blood and OPIM as infectious — universal precautions.
- Know where your **Exposure Control Plan** is and who administers it.
- Use **engineering controls and safe work practices** first: activate safety devices, never recap by hand, dispose of sharps at the point of use, don't overfill containers.
- Wear the **right PPE** for the task; your employer provides it at no cost. Remove it before leaving the work area and clean your hands.
- The **hepatitis B vaccine** is offered at no cost; you may decline in writing and change your mind later.
- After an exposure: **wash or flush, report immediately, and get evaluated** — PEP is time-sensitive.
- Orange-red **biohazard labels** or red containers mark regulated waste and specimens.

Your facility will complete any site-specific instruction and give you the chance to ask questions of a knowledgeable person. Continue to the final examination when ready.`,
        },
      ],
    },
  ],
  finalExam: {
    title: "OSHA Bloodborne Pathogens — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      { type: "MULTIPLE_CHOICE", prompt: "Which OSHA standard governs occupational exposure to bloodborne pathogens?", options: [{ id: "a", text: "29 CFR 1910.134" }, { id: "b", text: "29 CFR 1910.1030" }, { id: "c", text: "45 CFR 164" }, { id: "d", text: "42 CFR 482" }], correct: "b", explanation: "29 CFR 1910.1030 is the Bloodborne Pathogens Standard." },
      { type: "TRUE_FALSE", prompt: "Under universal precautions, all human blood and certain body fluids are treated as if known to be infectious.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "t", explanation: "That is the definition of universal precautions." },
      { type: "MULTIPLE_SELECT", prompt: "Which are considered OPIM under the standard? (Select all that apply.)", options: [{ id: "a", text: "Cerebrospinal fluid" }, { id: "b", text: "Saliva in dental procedures" }, { id: "c", text: "Urine with no visible blood" }, { id: "d", text: "Any body fluid visibly contaminated with blood" }], correct: ["a", "b", "d"], explanation: "Urine without visible blood is not OPIM under the standard (though Standard Precautions still apply in patient care)." },
      { type: "MULTIPLE_CHOICE", prompt: "The Exposure Control Plan must be reviewed and updated:", options: [{ id: "a", text: "Every five years" }, { id: "b", text: "At least annually and when tasks or procedures affecting exposure change" }, { id: "c", text: "Only after an OSHA inspection" }, { id: "d", text: "Only when a new manager is hired" }], correct: "b", explanation: "At least annually and whenever new or modified tasks affect occupational exposure." },
      { type: "TRUE_FALSE", prompt: "Exposure determination may assume employees always wear gloves, so tasks with gloves have no exposure.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "f", explanation: "Exposure determination is made without regard to the use of PPE." },
      { type: "SCENARIO", prompt: "A sharps container is about three-quarters full and at the fill line. What should you do?", options: [{ id: "a", text: "Push the contents down to make room" }, { id: "b", text: "Close and replace it according to facility procedure" }, { id: "c", text: "Keep using it until it is completely full" }, { id: "d", text: "Empty it into a larger container" }], correct: "b", explanation: "Containers must be replaced routinely and not allowed to overfill. Never push sharps down." },
      { type: "MULTIPLE_CHOICE", prompt: "Which recapping method is acceptable when a procedure truly requires recapping?", options: [{ id: "a", text: "Two-handed recapping" }, { id: "b", text: "A mechanical device or one-handed scoop technique" }, { id: "c", text: "Recapping with a gauze pad" }, { id: "d", text: "Asking a coworker to hold the cap" }], correct: "b", explanation: "Only a mechanical device or one-handed technique is permitted when recapping is required." },
      { type: "MULTIPLE_CHOICE", prompt: "The hepatitis B vaccine must be offered to employees with occupational exposure:", options: [{ id: "a", text: "After a year of employment, at the employee's cost" }, { id: "b", text: "At no cost, after training and within 10 working days of initial assignment" }, { id: "c", text: "Only after an exposure incident" }, { id: "d", text: "Only if the employee passes an antibody prescreening test" }], correct: "b", explanation: "No cost, within 10 working days of initial assignment, after training; prescreening may not be required." },
      { type: "TRUE_FALSE", prompt: "An employee who signs the hepatitis B declination statement can still receive the vaccine at no cost later.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "t", explanation: "If the employee later decides to be vaccinated while covered by the standard, the employer must provide it." },
      { type: "SCENARIO", prompt: "You are stuck by a used needle. What is the correct order of actions?", options: [{ id: "a", text: "Report at the end of shift, then wash" }, { id: "b", text: "Squeeze the wound and apply bleach, then report" }, { id: "c", text: "Wash with soap and water, report immediately, then get the confidential medical evaluation" }, { id: "d", text: "Ignore it if the patient appears healthy" }], correct: "c", explanation: "Wash, report immediately, and get evaluated. Do not squeeze or use caustic agents." },
      { type: "MULTIPLE_CHOICE", prompt: "Why is immediate reporting of an exposure especially important?", options: [{ id: "a", text: "To avoid paperwork later" }, { id: "b", text: "Because post-exposure prophylaxis for HIV is most effective when started as soon as possible" }, { id: "c", text: "Because OSHA fines employees who report late" }, { id: "d", text: "It is not important" }], correct: "b", explanation: "PEP is time-sensitive — ideally within hours and no later than 72 hours." },
      { type: "MULTIPLE_CHOICE", prompt: "Biohazard warning labels required by the standard are:", options: [{ id: "a", text: "Green with white lettering" }, { id: "b", text: "Fluorescent orange or orange-red with a contrasting biohazard symbol" }, { id: "c", text: "Yellow with black stripes" }, { id: "d", text: "Any color the facility chooses" }], correct: "b", explanation: "Fluorescent orange or orange-red (or predominantly so); red bags or containers may substitute." },
      { type: "MULTIPLE_SELECT", prompt: "Which activities are prohibited in work areas where there is a reasonable likelihood of exposure? (Select all that apply.)", options: [{ id: "a", text: "Eating and drinking" }, { id: "b", text: "Applying lip balm" }, { id: "c", text: "Handling contact lenses" }, { id: "d", text: "Performing hand hygiene" }], correct: ["a", "b", "c"], explanation: "Eating, drinking, smoking, applying cosmetics or lip balm and handling contact lenses are prohibited; hand hygiene is required." },
      { type: "MULTIPLE_CHOICE", prompt: "How long must medical records for employees with occupational exposure be kept?", options: [{ id: "a", text: "3 years" }, { id: "b", text: "Duration of employment plus 30 years" }, { id: "c", text: "1 year" }, { id: "d", text: "Until the employee leaves" }], correct: "b", explanation: "Medical records: duration of employment plus 30 years. Training records: 3 years." },
      { type: "SCENARIO", prompt: "Your gown becomes soaked with blood during a procedure. What should you do?", options: [{ id: "a", text: "Finish your shift and change at home" }, { id: "b", text: "Remove the garment immediately or as soon as feasible, clean any contaminated skin, and have the employer launder or dispose of it" }, { id: "c", text: "Take it home to wash in hot water" }, { id: "d", text: "Cover it with a clean gown" }], correct: "b", explanation: "Penetrated garments are removed as soon as feasible; the employer handles laundering at no cost — never take it home." },
    ],
  },
};
