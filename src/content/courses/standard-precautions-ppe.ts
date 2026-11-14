import type { CourseContent } from "../types";

const ACCESSED = "2026-11-13";

export const standardPrecautionsPpe: CourseContent = {
  code: "CHTA-MC-006",
  title: "Standard Precautions, Hand Hygiene and Personal Protective Equipment",
  categorySlug: "mandatory-compliance",
  isRequiredByDefault: true,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis:
    "No single federal renewal interval applies to every setting. Frequency is set by facility licensure rules, accreditation standards and organizational policy — configure applicability in the Compliance Center (Phase 5).",
  estimatedMinutes: 60,
  clinicalReviewRequired: true,
  description:
    "The everyday infection-prevention practices that protect every patient, resident and worker. This course explains CDC's Standard Precautions, when and how to perform hand hygiene, how to choose personal protective equipment based on a risk assessment, the correct sequence for putting on and removing PPE, respiratory hygiene, injection safety, cleaning and disinfection, and the three types of Transmission-Based Precautions. Practical competency (hand hygiene and PPE donning/doffing) is verified separately by an evaluator.",
  targetAudience:
    "All healthcare personnel with patient or resident contact — nursing staff, aides and caregivers, therapists, medical assistants, laboratory and phlebotomy staff, environmental services — and anyone who enters patient care areas.",
  prerequisites: [],
  completionCriteria:
    "Complete every required lesson and knowledge check and pass the final examination with 80% or higher. This course is theoretical education only: it does not, by itself, verify hands-on competency. Hand hygiene and PPE skills must be observed and signed off by a qualified evaluator using the facility's competency checklist.",
  objectives: [
    "Describe the elements of Standard Precautions and apply them to every patient, regardless of diagnosis.",
    "Identify the clinical indications for hand hygiene and choose alcohol-based hand rub or soap and water appropriately.",
    "Select PPE based on a risk assessment of the anticipated exposure.",
    "Put on and remove PPE in a sequence that prevents self-contamination.",
    "Apply respiratory hygiene/cough etiquette, injection safety, and cleaning and disinfection practices.",
    "Distinguish Contact, Droplet and Airborne Precautions, including room placement and required PPE.",
  ],
  regulatoryReferences: [
    { agency: "CDC", citation: "Core Infection Prevention and Control Practices for Safe Healthcare Delivery in All Settings", title: "Core practices (Standard Precautions elements)", url: "https://www.cdc.gov/infection-control/hcp/core-practices/index.html" },
    { agency: "CDC", citation: "2007 Guideline for Isolation Precautions", title: "Standard and Transmission-Based Precautions", url: "https://www.cdc.gov/infection-control/hcp/isolation-precautions/index.html" },
    { agency: "OSHA", citation: "29 CFR 1910.1030(d)(3)", title: "Personal protective equipment for bloodborne pathogen exposure", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030" },
  ],
  sourceReferences: [
    { title: "CDC's Core Infection Prevention and Control Practices for Safe Healthcare Delivery in All Settings", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/core-practices/index.html", publishedOn: "2024-04-12", accessedOn: ACCESSED },
    { title: "Clinical Safety: Hand Hygiene for Healthcare Workers", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/clean-hands/hcp/clinical-safety/index.html", publishedOn: "2024-02-27", accessedOn: ACCESSED },
    { title: "Transmission-Based Precautions", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/basics/transmission-based-precautions.html", publishedOn: "2024-04-03", accessedOn: ACCESSED },
    { title: "Appendix A: Example of Safe Donning and Removal of PPE (Guideline for Isolation Precautions)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/isolation-precautions/appendix-a-figure.html", accessedOn: ACCESSED },
    { title: "Sequence for Putting On and Removing PPE (poster)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/media/pdfs/Toolkits-PPE-Sequence-P.pdf", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Standard Precautions: the foundation",
      summary: "What Standard Precautions are and why they apply to everyone.",
      lessons: [
        {
          title: "Why Standard Precautions apply to every patient",
          type: "TEXT",
          durationMinutes: 7,
          body: `Healthcare-associated infections harm patients and residents every day, and many are preventable. Germs move from person to person on hands, equipment, surfaces and through the air. **Standard Precautions** are the basic practices that interrupt that spread. They apply to **all patient care, in every setting, regardless of whether an infection is known or suspected**.

Why "every patient"? Because many infections cause no symptoms, and test results are often not available when care begins. Standard Precautions protect both the person receiving care and you.

### The elements of Standard Precautions (CDC core practices)
1. **Hand hygiene**
2. **Environmental cleaning and disinfection**
3. **Injection and medication safety**
4. **Risk assessment with appropriate personal protective equipment (PPE)**
5. **Minimizing potential exposures**, including respiratory hygiene and cough etiquette
6. **Reprocessing of reusable medical equipment** (cleaning, disinfecting or sterilizing between patients)

When a patient is known or suspected to have an infection that spreads in specific ways, **Transmission-Based Precautions** are added *on top of* Standard Precautions — never instead of them.

> **Standard Precautions vs. universal precautions:** OSHA's bloodborne pathogens rule uses "universal precautions" for blood and certain body fluids. CDC's Standard Precautions are broader: they treat blood, body fluids, secretions and excretions (except sweat), non-intact skin and mucous membranes as potentially infectious.`,
        },
      ],
    },
    {
      title: "2. Hand hygiene",
      summary: "When to clean hands, which method to use, and how to do it well.",
      lessons: [
        {
          title: "When and how to clean your hands",
          type: "TEXT",
          durationMinutes: 9,
          body: `Hand hygiene is the single most important thing you can do to prevent infections.

### Clinical indications — clean your hands:
- **Immediately before touching a patient**
- **Before an aseptic task** (such as inserting an indwelling device or handling invasive medical devices)
- **Before moving from a soiled body site to a clean body site** on the same patient
- **After touching a patient or the patient's immediate environment** (bed rails, call light, bedside table)
- **After contact with blood, body fluids or contaminated surfaces**
- **Immediately after removing gloves**

### Which method?
**Alcohol-based hand sanitizer (ABHS)** is **preferred in most clinical situations** because it is more effective at reducing germs on hands, faster, more accessible and less drying than frequent soap-and-water washing. Use soap and water when:
- hands are **visibly soiled**,
- **before eating** and **after using the restroom**, and
- as directed by your facility during **outbreaks** — for example, after caring for patients with suspected or confirmed norovirus, and during *C. difficile* outbreaks. (For *C. difficile*, the most important protections are **gloves and gowns removed correctly**, because spores are hard to remove by any hand-cleaning method.)

### Technique
**Hand sanitizer:** apply enough product to cover all surfaces of both hands — effectiveness depends on volume. Rub hands together, covering all surfaces, **until hands feel dry (about 20 seconds)**. Pay attention to thumbs, fingertips and between fingers — the most commonly missed areas.

**Soap and water:** wet hands with water, apply soap, and **rub vigorously for at least 15 seconds** (CDC notes 15 or 20 seconds are both acceptable), covering all surfaces of hands and fingers. Rinse, dry with a disposable towel, and use the towel to turn off the faucet. Avoid hot water, which dries skin.

### Hands that can be cleaned well
- Keep natural nails short — not extending past the fingertip.
- Do not wear artificial nails or extensions when caring for high-risk patients (and follow your facility policy for all patient care).
- Follow facility policy on rings and jewelry; skin under rings can carry more germs.
- Use facility-provided hand lotion to prevent dry, cracked skin — damaged skin harbors more germs and makes hand hygiene painful.

### Gloves do not replace hand hygiene
Clean hands **before** putting on gloves and **immediately after** removing them. Change gloves when they are damaged or soiled, when moving from a soiled to a clean site on the same patient, before caring for another patient, and before leaving the room.`,
        },
        {
          title: "Knowledge check: hand hygiene",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 4,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "Your hands are not visibly soiled and you are about to help a resident reposition in bed. Which is the preferred method of hand hygiene?",
                options: [
                  { id: "a", text: "Soap and water for 2 minutes" },
                  { id: "b", text: "Alcohol-based hand sanitizer rubbed until dry" },
                  { id: "c", text: "Put on gloves instead" },
                ],
                correct: "b",
                explanation: "ABHS is preferred in most clinical situations unless hands are visibly soiled.",
              },
              {
                id: "k2",
                prompt: "Which moments require hand hygiene? (Select all that apply.)",
                options: [
                  { id: "a", text: "Immediately after removing gloves" },
                  { id: "b", text: "After touching the patient's bed rail" },
                  { id: "c", text: "Before an aseptic task" },
                  { id: "d", text: "Only when leaving the unit at the end of a shift" },
                ],
                correct: ["a", "b", "c"],
                explanation: "Hand hygiene is needed at multiple moments in a single care episode, including after touching the patient environment and after glove removal.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "3. Choosing and using PPE",
      summary: "Risk assessment, the right PPE for the task, and the donning and doffing sequence.",
      lessons: [
        {
          title: "Select PPE with a risk assessment",
          type: "TEXT",
          durationMinutes: 7,
          body: `Before each task, ask: **What could I be exposed to?** Then choose PPE that protects against that exposure.

| Anticipated exposure | PPE |
|---|---|
| Touching blood, body fluids, secretions, excretions, mucous membranes, non-intact skin, or contaminated items | **Gloves** |
| Clothing or exposed skin may contact blood or body fluids | **Gown** |
| Splashes or sprays of blood, body fluids, secretions or excretions likely (e.g., suctioning, wound irrigation, emptying drainage) | **Mask and eye protection (goggles) or a face shield** |
| Patient with a respiratory infection; procedures generating sprays | **Facemask**; patient wears a mask for source control when tolerated |
| Patient on Airborne Precautions (e.g., tuberculosis, measles) | **Fit-tested N95 or higher respirator** (requires your employer's respiratory protection program) |

### Good PPE habits
- Put PPE on **before** contact with the patient — generally before entering the room when precautions are posted.
- **Keep hands away from your face** while wearing PPE and limit the surfaces you touch.
- Change gloves when torn or heavily contaminated, and perform hand hygiene.
- Do **not** wear the same gloves or gown for more than one patient.
- Remove PPE **before leaving the room or care area** (respirators are removed after leaving the room and closing the door).
- Regular eyeglasses are **not** eye protection.`,
        },
        {
          title: "Putting on and removing PPE (donning and doffing)",
          type: "PRESENTATION",
          durationMinutes: 9,
          body: `## Why sequence matters
The **outside** of used PPE is contaminated. A consistent sequence keeps contaminated surfaces away from your skin, clothing and face. Your facility may use a specific approved method — follow it. The sequence below is one example from CDC.

---
## Putting on PPE (donning)
1. **Perform hand hygiene.**
2. **Gown** — fully cover torso from neck to knees and arms to wrists; fasten at the back of the neck and waist.
3. **Mask or respirator** — secure ties or elastic bands; fit the flexible band to the bridge of your nose; fit snug to face and below the chin. Perform a user seal check for a respirator.
4. **Goggles or face shield** — place over face and eyes and adjust to fit.
5. **Gloves** — extend to cover the wrist of the isolation gown.

---
## Removing PPE (doffing) — Example 1
1. **Gloves** — the outside is contaminated. Grasp the palm of one glove with the other gloved hand and peel it off; hold it in the gloved hand. Slide fingers of the ungloved hand under the remaining glove at the wrist and peel it off over the first glove. Discard.
2. **Goggles or face shield** — the outside is contaminated. Remove from the back by lifting the headband or earpieces.
3. **Gown** — the front and sleeves are contaminated. Unfasten ties without touching your body, pull away from neck and shoulders touching the inside only, turn inside out, fold or roll into a bundle and discard.
4. **Mask or respirator** — the front is contaminated; **do not touch it**. Grasp bottom ties or elastics, then top ones, and remove without touching the front.
5. **Perform hand hygiene immediately** after removing all PPE.

---
## Removing PPE — Example 2 (gown and gloves together)
1. Grasp the gown in front and pull away so ties break, touching the outside only with gloved hands. While removing the gown, fold or roll it inside-out into a bundle and **peel off your gloves at the same time**, touching only the inside of gloves and gown with bare hands. Discard.
2. Remove goggles or face shield from the back.
3. Remove mask or respirator from the back without touching the front.
4. **Perform hand hygiene.**

---
## Always
- Perform hand hygiene **between steps** if your hands become contaminated.
- If you are unsure whether you contaminated yourself, stop, clean your hands and skin, and tell your supervisor.
- **Practice with an evaluator.** Your facility will observe and sign off your donning and doffing skills.`,
        },
        {
          title: "Knowledge check: PPE",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 4,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "In the CDC Example 1 sequence, which item is removed FIRST?",
                options: [
                  { id: "a", text: "Mask" },
                  { id: "b", text: "Gloves" },
                  { id: "c", text: "Goggles" },
                  { id: "d", text: "Gown" },
                ],
                correct: "b",
                explanation: "Gloves are the most contaminated item and are removed first in Example 1; the mask or respirator is removed last.",
              },
              {
                id: "k2",
                prompt: "You will irrigate a wound and splashing is likely. Which PPE do you need in addition to gloves?",
                options: [
                  { id: "a", text: "Nothing else" },
                  { id: "b", text: "Gown plus mask and eye protection (or a face shield)" },
                  { id: "c", text: "Shoe covers only" },
                ],
                correct: "b",
                explanation: "When splashes or sprays are anticipated, protect clothing, skin, eyes, nose and mouth.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "4. Respiratory hygiene, injection safety and the environment",
      summary: "Cough etiquette, safe injection practices, sharps, cleaning and reusable equipment.",
      lessons: [
        {
          title: "Respiratory hygiene and safe injection practices",
          type: "TEXT",
          durationMinutes: 8,
          body: `### Respiratory hygiene / cough etiquette
Apply at the **first point of contact** — entrances, reception and waiting areas:
- Post signs asking patients and visitors with respiratory symptoms to tell staff and to **cover their cough**.
- Offer **facemasks** to coughing patients and visitors, tissues, no-touch waste receptacles and hand sanitizer.
- When possible, separate people with respiratory symptoms from others (ideally more than 6 feet) or move them to an exam room promptly.
- Staff with respiratory symptoms should follow facility occupational health policies about working.

### Injection and medication safety
Unsafe injection practices have caused outbreaks of hepatitis B and C in outpatient clinics and long-term care. Always:
- Use **aseptic technique** when preparing and giving medications.
- Use a **new sterile needle and a new sterile syringe for every injection**, and never reuse them for another patient — not even to access a medication vial or IV bag.
- **Do not administer medications from a single-dose vial or IV bag to more than one patient.**
- Dedicate **multi-dose vials** to a single patient whenever possible; if one must be used for more than one patient, keep and access it only in a clean medication preparation area — never in the patient's immediate care area.
- Clean the vial's rubber septum with alcohol before piercing it.
- **Fingerstick devices** (lancing devices) are for **one patient only**. Blood glucose meters should be dedicated to one patient; if shared, clean and disinfect after every use per the manufacturer's instructions.
- Dispose of sharps immediately at the point of use in an approved sharps container.

### Environmental cleaning and reusable equipment
- Clean and disinfect **high-touch surfaces** (bed rails, overbed tables, call lights, doorknobs, keyboards) regularly and whenever visibly soiled, using an EPA-registered disinfectant according to the label's **contact (wet) time**.
- Clean **shared equipment** — blood pressure cuffs, thermometers, glucometers, wheelchairs, lifts — between patients.
- Reusable instruments are **cleaned, then disinfected or sterilized** according to their intended use and the manufacturer's instructions. Never use equipment that is not clearly clean.
- Keep clean and dirty supplies separate.`,
        },
        {
          title: "Knowledge check: injection safety and cleaning",
          type: "KNOWLEDGE_CHECK",
          durationMinutes: 3,
          mediaMeta: {
            questions: [
              {
                id: "k1",
                prompt: "A single-dose vial still has medication left after one patient's dose. What should you do?",
                options: [
                  { id: "a", text: "Save it for the next patient with a new needle and syringe" },
                  { id: "b", text: "Discard it — single-dose vials are for one patient only" },
                  { id: "c", text: "Combine leftovers from several vials" },
                ],
                correct: "b",
                explanation: "Single-dose vials are used for one patient, one procedure. Pooling leftovers is unsafe.",
              },
              {
                id: "k2",
                prompt: "A glucometer must be shared between two residents. What is required?",
                options: [
                  { id: "a", text: "Nothing if it looks clean" },
                  { id: "b", text: "Clean and disinfect it after every use per the manufacturer's instructions" },
                  { id: "c", text: "Wipe it once at the end of the day" },
                ],
                correct: "b",
                explanation: "Shared meters must be cleaned and disinfected after each use; lancing devices are never shared.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "5. Transmission-Based Precautions",
      summary: "Contact, Droplet and Airborne Precautions — placement and PPE.",
      lessons: [
        {
          title: "Contact, Droplet and Airborne Precautions",
          type: "TEXT",
          durationMinutes: 9,
          body: `Transmission-Based Precautions are used **in addition to Standard Precautions** for patients known or suspected to be infected or colonized with germs that spread in specific ways. Follow the **signage** posted at the room and your facility's policy; in long-term care, decisions balance infection risk with residents' well-being and may be made case by case by the infection preventionist.

### Contact Precautions
For infections spread by **touching the patient or their environment** — for example, many multidrug-resistant organisms and *C. difficile*.
- **Placement:** single room when available (acute care); in long-term care and ambulatory settings, follow facility guidance.
- **PPE:** **gown and gloves** for any interaction with the patient or their environment — put on before entering, remove before leaving.
- Use dedicated or disposable equipment when possible; clean and disinfect shared equipment.

### Droplet Precautions
For germs spread by **respiratory droplets** from coughing, sneezing or talking — for example, influenza and pertussis.
- **Source control:** the patient wears a mask when tolerated, especially outside the room.
- **Placement:** single room when possible.
- **PPE:** put on a **facemask** when entering the room or patient space.

### Airborne Precautions
For germs that remain infectious in the air over long distances — **tuberculosis, measles, chickenpox (varicella) and disseminated herpes zoster**.
- **Source control:** mask the patient.
- **Placement:** an **airborne infection isolation room (AIIR)** — a specially ventilated room with the door kept closed. If an AIIR is not available, mask the patient and place them in a private room with the door closed until transfer.
- **PPE:** a **fit-tested, NIOSH-approved N95 or higher respirator**. You must be medically cleared, trained and fit-tested under your employer's respiratory protection program before wearing one.
- When possible, staff who are not immune should not enter rooms of patients with measles or chickenpox if immune staff are available.

### Communicating precautions
- Share precaution status at **handoffs and transfers**, including to transport, imaging, therapy and receiving facilities.
- Explain precautions to patients, residents and visitors in plain language. Precautions should never become a reason to neglect a person's care or social needs.`,
        },
        {
          title: "Case study: a resident with new diarrhea",
          type: "CASE_STUDY",
          durationMinutes: 5,
          body: `**Situation.** At an assisted living facility, Ms. Rivera (82) develops three episodes of loose stools overnight. She recently finished an antibiotic. Two other residents on her hallway are well.

**What the caregiver should do now**
1. **Report** the change in condition to the nurse/supervisor immediately — new diarrhea after antibiotics can indicate *C. difficile*, and the care team decides on evaluation and precautions.
2. Until told otherwise, use **gloves and a gown** for care that involves contact with Ms. Rivera or her immediate environment, and remove them before leaving her room.
3. Perform hand hygiene after removing PPE. Follow facility guidance during suspected *C. difficile* or norovirus — soap and water may be directed.
4. **Dedicate equipment** (such as a commode or thermometer) to her if possible; otherwise clean and disinfect it with a product effective against *C. difficile* spores per facility policy.
5. Notify **environmental services** so her room and bathroom receive the appropriate cleaning.

**What went well:** The night caregiver documented the time and number of episodes and reported at the start of the morning shift — but the facility's policy calls for reporting a change in condition **immediately**, not at shift change. The team reviewed this at their next huddle.

**Reflect:** Where are isolation PPE carts and spore-effective disinfectant kept in your area?`,
        },
        {
          title: "Key takeaways",
          type: "TEXT",
          durationMinutes: 3,
          body: `- Use **Standard Precautions with every patient**, every time.
- **Clean your hands** at every indication — hand sanitizer is preferred unless hands are visibly soiled or soap and water is directed.
- Choose PPE using a **risk assessment**; don and doff in a sequence that prevents self-contamination, and clean your hands afterward.
- Practice **respiratory hygiene**, **safe injection practices** (one needle, one syringe, one patient) and **clean shared equipment** between patients.
- Add **Contact, Droplet or Airborne Precautions** as indicated — gown and gloves; facemask; fit-tested N95 and an AIIR.
- This course is education only. Your hand hygiene and PPE skills must be **observed and signed off** by a qualified evaluator.`,
        },
      ],
    },
  ],
  finalExam: {
    title: "Standard Precautions, Hand Hygiene and PPE — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      { type: "TRUE_FALSE", prompt: "Standard Precautions apply only to patients with a known infection.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "f", explanation: "Standard Precautions apply to all patient care regardless of known or suspected infection." },
      { type: "MULTIPLE_SELECT", prompt: "Which are elements of Standard Precautions? (Select all that apply.)", options: [{ id: "a", text: "Hand hygiene" }, { id: "b", text: "Respiratory hygiene/cough etiquette" }, { id: "c", text: "Injection and medication safety" }, { id: "d", text: "Placing every patient in an airborne isolation room" }], correct: ["a", "b", "c"], explanation: "AIIR placement is part of Airborne Precautions, a Transmission-Based Precaution." },
      { type: "MULTIPLE_CHOICE", prompt: "When hands are NOT visibly soiled, the preferred method of hand hygiene in most clinical situations is:", options: [{ id: "a", text: "Soap and water" }, { id: "b", text: "Alcohol-based hand sanitizer" }, { id: "c", text: "Wearing gloves" }, { id: "d", text: "Antiseptic wipes on the fingertips only" }], correct: "b", explanation: "ABHS is preferred unless hands are visibly soiled." },
      { type: "MULTIPLE_CHOICE", prompt: "How long should you rub hands with alcohol-based hand sanitizer?", options: [{ id: "a", text: "About 5 seconds" }, { id: "b", text: "Until hands feel dry, about 20 seconds" }, { id: "c", text: "2 minutes" }, { id: "d", text: "Just apply it to the palms" }], correct: "b", explanation: "Cover all surfaces and rub until dry — about 20 seconds." },
      { type: "SCENARIO", prompt: "You finish emptying a urinary catheter bag and remove your gloves. What next?", options: [{ id: "a", text: "Go directly to the next resident" }, { id: "b", text: "Perform hand hygiene immediately" }, { id: "c", text: "Put on new gloves without cleaning hands" }, { id: "d", text: "Wait until your break to wash" }], correct: "b", explanation: "Hand hygiene is required immediately after glove removal." },
      { type: "TRUE_FALSE", prompt: "Wearing gloves eliminates the need for hand hygiene.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "f", explanation: "Clean hands before donning and after removing gloves." },
      { type: "MULTIPLE_CHOICE", prompt: "In the CDC example donning sequence, which item is put on LAST?", options: [{ id: "a", text: "Gown" }, { id: "b", text: "Mask" }, { id: "c", text: "Goggles" }, { id: "d", text: "Gloves" }], correct: "d", explanation: "Gloves go on last and extend over the gown cuffs." },
      { type: "MULTIPLE_CHOICE", prompt: "Which part of a used facemask or respirator should you avoid touching during removal?", options: [{ id: "a", text: "The ties or elastic bands" }, { id: "b", text: "The front" }, { id: "c", text: "The back of your head" }, { id: "d", text: "None — any part is fine" }], correct: "b", explanation: "The front is contaminated; remove by the ties or elastics." },
      { type: "SCENARIO", prompt: "You will suction a patient's airway, and spray of secretions is likely. Which PPE combination is most appropriate under Standard Precautions?", options: [{ id: "a", text: "Gloves only" }, { id: "b", text: "Gloves, gown, and a mask with eye protection or a face shield" }, { id: "c", text: "A mask only" }, { id: "d", text: "No PPE if the patient has no known infection" }], correct: "b", explanation: "Anticipated sprays require protection of skin, clothing, eyes, nose and mouth." },
      { type: "MULTIPLE_CHOICE", prompt: "Which practice is correct for injections?", options: [{ id: "a", text: "Reuse a syringe if you change the needle" }, { id: "b", text: "Use a new sterile needle and syringe for each injection" }, { id: "c", text: "Use one single-dose vial for several patients" }, { id: "d", text: "Store multi-dose vials at the bedside" }], correct: "b", explanation: "One needle, one syringe, one patient — every time." },
      { type: "TRUE_FALSE", prompt: "A fingerstick lancing device may be shared between residents if it is wiped with alcohol.", options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correct: "f", explanation: "Lancing devices are for single-patient use only." },
      { type: "MULTIPLE_CHOICE", prompt: "Contact Precautions require which PPE for interactions with the patient or their environment?", options: [{ id: "a", text: "N95 respirator" }, { id: "b", text: "Gown and gloves" }, { id: "c", text: "Facemask only" }, { id: "d", text: "No additional PPE" }], correct: "b", explanation: "Gown and gloves, donned before entry and removed before leaving." },
      { type: "MULTIPLE_CHOICE", prompt: "Which condition requires Airborne Precautions?", options: [{ id: "a", text: "Influenza" }, { id: "b", text: "Tuberculosis" }, { id: "c", text: "A urinary tract infection" }, { id: "d", text: "C. difficile" }], correct: "b", explanation: "TB, measles, chickenpox and disseminated zoster require Airborne Precautions." },
      { type: "MULTIPLE_CHOICE", prompt: "Before wearing an N95 respirator for Airborne Precautions, a worker must:", options: [{ id: "a", text: "Simply pick the size that looks right" }, { id: "b", text: "Be medically cleared, trained and fit-tested under the employer's respiratory protection program" }, { id: "c", text: "Wear a surgical mask underneath" }, { id: "d", text: "Nothing — any mask works" }], correct: "b", explanation: "Respirators require clearance, training and fit testing." },
      { type: "SCENARIO", prompt: "A blood pressure cuff is used for a resident on Contact Precautions and must be used for another resident afterward. What should happen?", options: [{ id: "a", text: "Use it right away" }, { id: "b", text: "Clean and disinfect it per facility policy before the next resident" }, { id: "c", text: "Turn it inside out" }, { id: "d", text: "Shake it out" }], correct: "b", explanation: "Shared equipment must be cleaned and disinfected between patients; dedicated equipment is preferred under Contact Precautions." },
    ],
  },
};
