import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, FAC_59A_8_0095, FS_400_488, NOT_A_CREDENTIAL } from "./_shared";

export const medicationAssistance: CourseContent = {
  code: "CHITA-HH-004",
  title: "Medication Assistance and Safety for Home Care Workers",
  categorySlug: "home-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 105,
  clinicalReviewRequired: true,
  programClassification: "STATE_REGULATED_TRAINING",
  certificateType: "COURSE_COMPLETION",
  credentialNotice: `Covers the content Florida requires in training for home health aides and CNAs who assist with self-administered medication (at least 2 hours under Rule 59A-8.0095(5), F.A.C.). The employing agency remains responsible for the training it accepts, for confirming that each aide can read prescription labels, and for keeping documentation. This course does not qualify anyone to administer medication: that requires RN delegation, a 6-hour basic medication administration course and annual training under s. 400.489, F.S. and Rule 59A-8.0097, F.A.C. ${NOT_A_CREDENTIAL}`,
  renewalRequirements: "Your employer may require annual refresher training. Aides who administer delegated medications must complete a 2-hour in-service each year (s. 400.489, F.S.).",
  instructorResources: `Before signing COMP-HHA-MEDASSIST, confirm in person that the trainee can read prescription labels and instructions (required by rule; individuals who cannot read may not assist with prescription medications).

Use real pharmacy labels with identifying information removed for a label-reading exercise.`,
  competencyCodes: ["COMP-HHA-MEDASSIST", "COMP-MEDSAFE"],
  description:
    "What home care workers need to know to help patients take their own medicines safely within Florida law: medication terms and label reading, the difference between administration and assistance, what assistance includes and excludes under s. 400.488, F.S., the rights of medication safety, storage, documentation, recognizing errors and adverse reactions, and scope-of-practice limits.",
  targetAudience: "Home health aides, CNAs and personal care workers at Florida home health agencies and nurse registries; agency trainers.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. The employer verifies label reading and observes the skill (COMP-HHA-MEDASSIST).",
  objectives: [
    "Use common medication terms and read a prescription label.",
    "Explain the difference between administering medication and assisting with self-administration.",
    "Describe what assistance includes and excludes under Florida law.",
    "Apply the rights of medication safety and store medicines safely.",
    "Document assistance and recognize and report errors and adverse reactions.",
  ],
  regulatoryReferences: [
    FS_400_488,
    FAC_59A_8_0095,
    { agency: "Florida Legislature", citation: "s. 400.489, F.S.", title: "Administration of medication by a home health aide; staff training requirements", url: "https://m.flsenate.gov/Statutes/400.489" },
    { agency: "Florida Agency for Health Care Administration", citation: "Rule 59A-8.0097, F.A.C.", title: "Medication training and validation", url: "https://www.flrules.org/gateway/ruleNo.asp?id=59A-8.0097" },
  ],
  sourceReferences: [
    { title: "Medication Errors and Adverse Drug Events", publisher: "Agency for Healthcare Research and Quality, PSNet", url: "https://psnet.ahrq.gov/primer/medication-errors-and-adverse-drug-events", accessedOn: ACCESSED },
    { title: "Where and How to Dispose of Unused Medicines", publisher: "U.S. Food and Drug Administration", url: "https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines", accessedOn: ACCESSED },
    { title: "Florida Poison Information Center Network", publisher: "Florida Poison Information Center Network", url: "https://floridapoisoncontrol.org/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Medication basics",
      summary: "Terms, forms, routes and reading a label.",
      lessons: [
        text("Medication terminology", 15, `### Common terms
- **Prescription (Rx) medicine** — ordered by a licensed prescriber and dispensed by a pharmacy.
- **Over-the-counter (OTC)** — bought without a prescription (pain relievers, antacids, vitamins). OTC medicines and supplements can still interact with prescriptions; report what the patient uses.
- **Brand and generic names** — the same drug can have two names (for example, the label may show both).
- **Dose** — how much (for example 5 mg, 10 mL, 1 tablet).
- **Frequency** — how often (once daily, twice daily, every 8 hours, at bedtime).
- **PRN** — "as needed"; taken only when a specific need occurs, as the prescriber directs.
- **Route** — how the medicine enters the body.
- **Side effect** — an unwanted effect (drowsiness, upset stomach).
- **Adverse reaction** — a harmful, unintended reaction, which can be serious (for example an allergic reaction).
- **Allergy** — an immune reaction such as rash, hives, swelling or trouble breathing.

### Forms and routes
Tablets, capsules, liquids (oral); eye drops and ointments (ophthalmic); ear drops (otic); nasal sprays; inhalers and nebulizers (inhaled); creams and ointments (topical); patches (transdermal); suppositories (rectal); injections.

### Reading a prescription label
Check **every time**:
1. Patient's name
2. Medicine name and strength
3. Directions: dose, route, how often
4. Date filled, prescriber, pharmacy, prescription number, refills
5. Expiration or "discard after" date
6. Warning stickers (for example, "may cause drowsiness," "take with food")

Florida rule requires that aides who assist with self-administered medication can **read the prescription label and instructions**. If you cannot read the label clearly, stop and call the nurse.`),
        check("Check your understanding: basics", [
          kc("med1", "What does PRN mean?", ["Every morning", "As needed", "By mouth", "Before meals"], 1, "PRN medicines are taken only when needed as directed by the prescriber."),
          kc("med2", "A patch applied to the skin is which route?", ["Oral", "Transdermal", "Rectal", "Inhaled"], 1, "Transdermal means through the skin."),
        ]),
      ],
    },
    {
      title: "2. Assistance versus administration",
      summary: "What Florida law allows, and what it does not.",
      lessons: [
        text("Florida law on assistance", 18, `### Administration
**Administering** medication is a nursing function (or, in Florida, a task an RN may delegate to a home health aide who has completed a 6-hour basic medication administration course, annual 2-hour training and competency validation — s. 400.489, F.S.; Rule 59A-8.0097, F.A.C.). Delegated administration is **not** covered by this course.

### Assistance with self-administration (s. 400.488, F.S.)
For patients who are **able to self-administer** their medicines but need help:
- The patient (or their surrogate, guardian or attorney in fact) must make a **documented request and give written informed consent**.
- The aide must have the required training (at least **2 hours**, Rule 59A-8.0095(5)).

**Assistance generally includes** (always check the current statute and your agency's policy for the exact list):
- Taking the medicine, in its **previously dispensed, properly labeled container**, from where it is stored and bringing it to the patient
- In the patient's presence, **reading the label**, opening the container, removing the prescribed amount and closing the container
- Placing an oral dose in the patient's hand or in a cup so the patient can take it
- Helping with other prescribed forms the statute lists, such as eye, ear and nasal drops, topical medicines, inhalers, and pouring a prescribed premeasured dose of nebulizer solution into the nebulizer cup
- Returning the container to storage
- **Keeping a record** of when the patient received assistance

**Assistance does not include:**
- **Mixing, compounding, converting or calculating doses** — except as the statute allows, such as measuring a prescribed amount of liquid medicine or breaking a scored tablet or crushing a tablet as prescribed
- **Judging** whether a PRN medicine is needed, or giving medicine that requires judgment or discretion by the person assisting
- Assisting a patient who cannot take part in self-administration
- Using medicine from unlabeled containers or prescribed for someone else
- Injections (other than tasks specifically authorized by law for trained and delegated staff)

Assistance by an unlicensed person under this section does **not** count as "administration" under the Pharmacy Practice Act.

### When to call the nurse
The patient seems unable to self-administer, refuses, is confused about their medicines, the label is unclear or different from the medication list, a dose was missed or doubled, or there is any sign of a reaction.`),
        check("Check your understanding: assistance", [
          kc("med3", "Before an aide assists with self-administered medication under s. 400.488, the patient must:", ["Pay a fee", "Make a documented request and give written informed consent", "Have a family member present", "Nothing"], 1, "Written informed consent is required."),
          kc("med4", "Which is NOT part of assistance with self-administration?", ["Reading the label to the patient", "Bringing the labeled container to the patient", "Calculating a new dose because the patient looks unwell", "Recording the assistance"], 2, "Calculating doses and using judgment are excluded."),
          kc("med5", "Delegated medication administration by a Florida home health aide requires:", ["Nothing beyond this course", "RN delegation, a 6-hour basic course, annual training and competency validation", "Only a family request", "A pharmacy permit"], 1, "See s. 400.489 and Rule 59A-8.0097."),
        ]),
      ],
    },
    {
      title: "3. Medication safety and documentation",
      summary: "The rights, storage, disposal and records.",
      lessons: [
        text("The rights and safe practice", 15, `### The rights (check each time)
1. **Right patient** — confirm identity; never assist with medicine labeled for someone else.
2. **Right medication** — the label matches the medication list or schedule.
3. **Right dose** — the amount on the label.
4. **Right route** — by mouth, eye, skin, inhaled…
5. **Right time** — as directed (and not doubled if a dose was missed — call the nurse).
6. **Right documentation** — record immediately after the patient takes it.
Many programs also teach the right to **refuse** (the patient may refuse; report it) and the right **reason**.

### Safe practice
- Clean your hands before handling medicines.
- One patient's medicine at a time; do not pre-pour doses for later.
- Watch the patient take the medicine; do not leave pills on a table.
- Offer water; keep the patient upright when swallowing pills.
- Do not crush or split tablets unless the label or prescriber directs it — some medicines (for example extended-release) must not be crushed.

### Storage
- Original labeled containers; room temperature, dry, away from sunlight unless the label says to refrigerate.
- Out of reach of children, pets and confused adults.
- Separate medicines of different household members.

### Disposal
Follow your agency policy and the patient's wishes. FDA recommends drug take-back locations when available; some medicines carry special disposal instructions. Never take medicines home.

### Documentation
Record the date, time, medicine, dose and that the patient took it (or refused, and what you reported). Use the agency's form or system. Never document before the patient takes the medicine.`),
      ],
    },
    {
      title: "4. Errors, adverse reactions and scope",
      summary: "Recognizing and reporting problems.",
      lessons: [
        text("Errors and adverse reactions", 12, `### Medication errors
An error is any preventable event that may cause or lead to inappropriate medication use or harm — for example, a wrong medicine, wrong dose, missed dose, extra dose, wrong time or wrong person.

**If you suspect an error:** stay with the patient, check how they are, **call the nurse immediately**, call **911** if the patient is in distress, follow your agency's reporting process, and document factually. Reporting errors honestly protects patients.

**Florida Poison Information Center:** 1-800-222-1222 for poison questions (call 911 for emergencies such as unresponsiveness or trouble breathing).

### Adverse reactions — report
- **Emergency (call 911):** trouble breathing, swelling of the face, lips or tongue, severe rash with blisters, chest pain, fainting, seizure.
- **Report promptly:** new rash or itching, dizziness, falls, unusual sleepiness or confusion, nausea, vomiting, diarrhea, bleeding or bruising, low or very high blood sugar readings the patient shows you, swelling of the legs, changes in heart rate.

### Scope of practice — say no politely
"I'm not allowed to do that, but I'll call the nurse right now." Examples: changing a dose, giving an injection, choosing which PRN to take, filling a pill organizer from bottles (unless your agency's policy and the law allow it), taking medicine out of an unlabeled bag.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your trainer.",
      lessons: [
        caseStudy("Case study: the pill organizer", 12, `**Situation (fictional).** Mr. Chen, 74, takes eight medicines. His granddaughter filled a weekly pill organizer and left the pharmacy bottles in a drawer. He asks you to "just hand me Tuesday morning's pills." Today he seems sleepier than usual and his speech is a little slow.

**Discuss:**
1. Can you assist with the pill organizer? *(Assistance generally uses previously dispensed, properly labeled containers. Follow your agency policy and call the nurse — do not guess.)*
2. What about the sleepiness and slow speech? *(A possible adverse reaction or stroke. Check with BE FAST; call 911 for stroke signs; otherwise call the nurse now.)*
3. What do you document? *(Your observations, the time, who you called and what they said; that you did not assist with the organizer per policy.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Medication Assistance and Safety — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which information must you check on a prescription label each time?", ["Only the color of the pill", "Patient name, medicine and strength, directions and expiration date", "Only the pharmacy phone number", "Only the refill count"], 1, "Check all key label elements."),
      mc("\"Take 1 tablet by mouth twice daily\" describes:", ["Dose, route and frequency", "Only the route", "An allergy", "A side effect"], 0, "1 tablet = dose; by mouth = route; twice daily = frequency."),
      tf("Assistance with self-administration by an unlicensed person under s. 400.488 counts as medication administration.", false, "The statute says it does not constitute administration."),
      mc("Minimum training required before a Florida home health aide assists with self-administered medication:", ["None", "2 hours", "6 hours plus delegation", "40 hours of medication training"], 1, "Rule 59A-8.0095(5) requires at least 2 hours."),
      mc("Florida rule requires that an aide assisting with prescription medicines:", ["Can read the prescription label and instructions", "Is a pharmacist", "Has a nursing license", "Has worked 5 years"], 0, "Individuals who cannot read may not assist with prescription medications."),
      ms("Which tasks are generally part of assistance? (Select all that apply.)", ["Reading the label in the patient's presence", "Removing the prescribed amount from the labeled container", "Deciding to skip a dose", "Recording the assistance"], [0, 1, 3], "Deciding to skip a dose requires judgment and is excluded."),
      mc("Which is excluded from assistance?", ["Returning the container to storage", "Mixing or compounding medicines", "Opening the container", "Placing a tablet in the patient's hand"], 1, "Mixing and compounding are excluded."),
      mc("A patient asks you to decide whether she needs her as-needed anxiety pill. You should:", ["Decide for her", "Explain you cannot decide PRN use; she decides if able, or you call the nurse", "Give half", "Hide the bottle"], 1, "Judging PRN need is excluded."),
      mc("You notice you gave assistance with the wrong patient's medicine bottle. The first thing to do is:", ["Hide the bottle", "Stay with the patient, check on them and call the nurse immediately", "Wait to see if anything happens", "Give the right medicine too"], 1, "Patient safety and immediate reporting come first."),
      mc("Which is an emergency reaction requiring 911?", ["Mild upset stomach", "Swelling of the lips and trouble breathing", "Slight drowsiness", "Dry mouth"], 1, "These are signs of a severe allergic reaction."),
      mc("Medicines should be stored:", ["In unlabeled containers", "In original labeled containers, out of reach of children and confused adults", "In your bag", "Next to the stove"], 1, "Keep labels and store safely."),
      mc("Why should some tablets not be crushed?", ["They taste bad", "Some, such as extended-release forms, release too much medicine at once if crushed", "It is always fine", "Crushing makes them stronger safely"], 1, "Follow the label and prescriber directions."),
      mc("When should assistance be documented?", ["At the end of the week", "Immediately after the patient takes the medicine", "Before bringing the medicine", "Never"], 1, "Document right after; never in advance."),
      sc("A patient's daughter asks you to give her father an insulin injection because she is running late. What do you do?", ["Give it carefully", "Politely decline — injections are outside assistance — and call the nurse", "Teach yourself from the package", "Ask a neighbor to do it"], 1, "Stay within your scope and contact the nurse."),
      mc("The Florida Poison Information Center number is:", ["1-800-222-1222", "988", "1-800-96-ABUSE", "211"], 0, "Call 911 for emergencies; the Poison Center for poison questions."),
    ],
  },
};
