import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, CDC_HAND, OSHA_BBP } from "./_shared";

export const homeInfectionControl: CourseContent = {
  code: "CHITA-HH-005",
  title: "Infection Control and Patient Safety in Home Care",
  categorySlug: "home-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 130,
  clinicalReviewRequired: true,
  programClassification: "EMPLOYER_REQUIRED",
  certificateType: "COURSE_COMPLETION",
  credentialNotice:
    "Educational training on infection prevention and worker safety in the home setting. Employers covered by the OSHA Bloodborne Pathogens Standard must provide bloodborne pathogens training at no cost at the time of initial assignment and at least annually, with an opportunity to ask questions of a knowledgeable person, and must cover their own exposure control plan. This course supports that training but does not replace the employer's site-specific training.",
  renewalRequirements: "Not a renewable certificate. Employers covered by 29 CFR 1910.1030 must provide bloodborne pathogens training at least annually.",
  instructorResources: `Add the employer's exposure control plan, post-exposure procedure and contact numbers as a Download lesson before assigning this course. Make a knowledgeable person available to answer questions (required by 29 CFR 1910.1030(g)(2)(vii)(N)).

Skills checklists: COMP-HH, COMP-PPE, COMP-IC.`,
  competencyCodes: ["COMP-HH", "COMP-PPE", "COMP-IC"],
  description:
    "Infection prevention and worker safety for care delivered in patients' homes: how infections spread, standard and transmission-based precautions, bloodborne pathogens, PPE, cleaning and disinfecting in the home, handling linen and waste, what to do after an exposure, and personal safety on home visits.",
  targetAudience: "Home health aides, personal care workers, CNAs and nurses who visit patients at home.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Explain how infections spread and how to break the chain of infection at home.",
    "Apply standard precautions and transmission-based precautions.",
    "Describe bloodborne pathogens, the hepatitis B vaccine and the employer's exposure control plan.",
    "Select, put on and remove PPE correctly.",
    "Clean and disinfect safely in the home and handle linen, sharps and waste.",
    "Respond to an exposure and protect personal safety on home visits.",
  ],
  regulatoryReferences: [OSHA_BBP],
  sourceReferences: [
    CDC_HAND,
    { title: "Standard Precautions for All Patient Care", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/basics/standard-precautions.html", accessedOn: ACCESSED },
    { title: "Transmission-Based Precautions", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/basics/transmission-based-precautions.html", accessedOn: ACCESSED },
    { title: "Bloodborne Pathogens and Needlestick Prevention", publisher: "Occupational Safety and Health Administration", url: "https://www.osha.gov/bloodborne-pathogens", accessedOn: ACCESSED },
    { title: "Home Healthcare Workers: How to Prevent Violence on the Job (DHHS (NIOSH) Publication No. 2012-118)", publisher: "National Institute for Occupational Safety and Health", url: "https://www.cdc.gov/niosh/docs/2012-118/default.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. How infections spread",
      summary: "The chain of infection and who is at risk.",
      lessons: [
        text("The chain of infection at home", 12, `Infections spread when every link in a chain is connected: an **infectious agent** (bacteria, virus, fungus), a **reservoir** where it lives (people, surfaces, water), a **way out** (coughs, blood, stool), a **mode of transmission** (contact, droplets, air, contaminated items), a **way in** (mouth, broken skin, catheters) and a **susceptible host**.

**Home care patients are often at higher risk:** older age, chronic illness, wounds, urinary catheters, feeding tubes, weakened immune systems, recent hospital stays.

**Break the chain:**
- Hand hygiene (the single most important step)
- PPE when exposure is possible
- Cleaning and disinfecting surfaces and equipment
- Covering coughs; staying home when sick per agency policy
- Vaccination (for example influenza; hepatitis B for workers with occupational exposure)
- Catheter and wound care only as trained and on the care plan

**Report signs of infection:** fever or chills, new cough or shortness of breath, redness, warmth, swelling or drainage at a wound or catheter site, cloudy or foul-smelling urine, new confusion, diarrhea.`),
        check("Check your understanding: chain of infection", [
          kc("ic1", "What is the single most important way to prevent the spread of infection?", ["Wearing a gown", "Hand hygiene", "Opening windows", "Taking vitamins"], 1, "Clean hands at the key moments."),
          kc("ic2", "New confusion in an older patient can be a sign of:", ["Infection", "Good health", "Normal tiredness only", "Hunger only"], 0, "Older adults often show infection as confusion rather than fever."),
        ]),
      ],
    },
    {
      title: "2. Precautions and PPE",
      summary: "Standard, universal and transmission-based precautions.",
      lessons: [
        text("Standard, universal and transmission-based precautions", 15, `### Universal precautions vs standard precautions
- **Universal precautions** (the term used in the OSHA Bloodborne Pathogens Standard) means treating all human blood and certain body fluids as if they were infectious for HIV, hepatitis B and other bloodborne pathogens.
- **Standard precautions** (CDC) expand this to **all blood, body fluids, secretions and excretions except sweat, non-intact skin and mucous membranes**, for every patient. Standard precautions include hand hygiene, PPE based on the expected exposure, respiratory hygiene, safe handling of equipment, linen and sharps, and environmental cleaning.

### Transmission-based precautions
Used **in addition to** standard precautions when a patient has a known or suspected infection:
- **Contact** — for example *C. difficile*, MRSA in a wound, scabies: gloves and gown for contact with the patient or environment; dedicated equipment when possible. For *C. difficile*, wash hands with soap and water and follow your agency's disinfectant guidance.
- **Droplet** — for example influenza: a mask when within close range.
- **Airborne** — for example tuberculosis, measles: an N95 or higher respirator for staff who are fit-tested; often patients are not cared for at home until no longer infectious — follow the agency's instructions.

Your nurse or care plan will tell you which precautions apply.

### PPE
- **Gloves:** when touching blood, body fluids, mucous membranes, non-intact skin or contaminated items. Change between tasks and patients; never wash or reuse.
- **Gown:** when skin or clothing may be soiled.
- **Mask and eye protection / face shield:** splashes or sprays; droplet precautions.
- **Respirator (N95):** airborne precautions — requires fit testing under OSHA's respiratory protection standard.

**One common sequence** — Donning: gown → mask/respirator → eye protection → gloves. Doffing: gloves → gown → hand hygiene → eye protection → mask/respirator → hand hygiene. Follow your agency's sequence; the goal is to avoid touching the contaminated outside of PPE.`),
        check("Check your understanding: precautions", [
          kc("ic3", "Standard precautions apply to:", ["Only patients known to have HIV", "All patients, all the time", "Only hospital patients", "Only patients with a fever"], 1, "Treat all patients' blood and body fluids (except sweat) as potentially infectious."),
          kc("ic4", "A patient has C. difficile diarrhea. Which hand hygiene method should you use after care?", ["Alcohol rub only", "Soap and water", "No hand hygiene if you wore gloves", "Wipe on your clothes"], 1, "Soap and water physically removes C. difficile spores."),
          kc("ic5", "Which PPE item is removed first in the common doffing sequence?", ["Mask", "Gloves", "Eye protection", "Shoes"], 1, "Gloves are usually the most contaminated item."),
        ]),
      ],
    },
    {
      title: "3. Bloodborne pathogens and exposure response",
      summary: "HBV, HCV, HIV, the exposure control plan and what to do after an exposure.",
      lessons: [
        text("Bloodborne pathogens", 15, `**Bloodborne pathogens** are germs in blood and certain body fluids that can cause disease. The main ones in health care are **hepatitis B virus (HBV)**, **hepatitis C virus (HCV)** and **human immunodeficiency virus (HIV)**.

### How exposure happens at work
- Needlestick or cut from a contaminated sharp (for example a patient's lancet or insulin needle left out)
- Blood or body fluid splash into the eyes, nose or mouth
- Contact with non-intact skin (cuts, chapped skin)

### OSHA Bloodborne Pathogens Standard (29 CFR 1910.1030) — what your employer must do
- Have a written **exposure control plan** and review it at least annually
- Use **engineering and work practice controls** (sharps containers, no recapping)
- Provide **PPE** at no cost
- Offer the **hepatitis B vaccine** series at no cost to workers with occupational exposure (you may decline in writing and change your mind later)
- Provide **training** at no cost at initial assignment and at least annually
- Provide confidential **post-exposure evaluation and follow-up**
- Keep required records

### Your part
- Use standard precautions every time.
- **Never recap, bend or break used needles.** If a patient's sharps are left out, do not pick them up with your hands; use your agency's procedure or tell the nurse, and make sure the patient has a puncture-resistant container.
- Cover cuts on your hands with a bandage and gloves.`),
        text("If you have an exposure", 10, `**Act immediately:**
1. **Wash** needlesticks and cuts with soap and water.
2. **Flush** splashes to the nose, mouth or skin with water.
3. **Irrigate** eyes with clean water, saline or sterile irrigant.
4. **Report** to your supervisor right away — the same day. Post-exposure treatment for HIV works best when started as soon as possible, ideally within hours.
5. **Get medical evaluation** as your employer directs (confidential; testing and treatment at no cost to you under the OSHA standard).
6. **Document** the incident on your agency's form.

Do not squeeze the wound or use bleach on your skin.`),
        check("Check your understanding: bloodborne pathogens", [
          kc("ic6", "You find a used insulin needle on the patient's bed. What should you do?", ["Pick it up and recap it", "Do not handle it with your hands; follow agency procedure to place it in a sharps container or notify the nurse", "Throw it in the kitchen trash", "Leave it there"], 1, "Never recap; use a puncture-resistant container and safe procedure."),
          kc("ic7", "Who pays for the hepatitis B vaccine for workers with occupational exposure under OSHA rules?", ["The worker", "The employer, at no cost to the worker", "The patient", "No one — it is not offered"], 1, "Employers must offer it at no cost."),
          kc("ic8", "After a needlestick, what should you do first?", ["Finish the visit", "Wash the area with soap and water and report it immediately", "Squeeze it and apply bleach", "Wait until tomorrow"], 1, "Wash, then report immediately so evaluation and treatment can start quickly."),
        ]),
      ],
    },
    {
      title: "4. A clean environment",
      summary: "Cleaning, disinfecting, linen and waste in the home.",
      lessons: [
        text("Cleaning and disinfecting in the home", 12, `- **Clean first, then disinfect.** Cleaning removes dirt; disinfecting kills germs. Use an EPA-registered disinfectant your agency approves (or the patient's product if approved), and follow the label, including **contact time** (how long the surface stays wet).
- Clean **from clean to dirty, top to bottom**. Focus on high-touch surfaces: bed rails, bedside table, doorknobs, light switches, toilet handles, faucets, phones, remotes, walkers.
- **Patient equipment** (thermometers, blood pressure cuffs) — clean and disinfect between uses; use disposable thermometer covers.
- **Blood spills:** wear gloves; absorb with paper towels; clean, then disinfect with an appropriate product; dispose of waste in a sealed bag.
- **Linen:** handle soiled linen as little as possible; do not shake; carry away from your clothing; wash with detergent in warm or hot water as the fabric allows and dry completely.
- **Waste:** soiled dressings and briefs in a tied bag in the household trash unless the agency or local rules require otherwise. Sharps in a puncture-resistant container with a lid.
- **Your bag:** "bag technique" — set on a clean barrier, clean hands before reaching in, keep clean and dirty items separate, and clean equipment before returning it.`),
      ],
    },
    {
      title: "5. Workplace safety on home visits",
      summary: "Personal safety, violence prevention and driving.",
      lessons: [
        text("Workplace safety on home visits", 12, `Home care workers face hazards that hospital staff do not: driving, unfamiliar homes, pets, clutter, smoking, poor lighting, and sometimes violence. NIOSH recommends that employers and workers plan for safety together.

### Before and during visits
- Know the address and route; keep your phone charged; let the office know your schedule.
- Park in a well-lit area facing the way out; keep your keys handy.
- Look and listen before you enter. If something feels wrong (shouting, weapons, intoxicated people, aggressive dogs), **do not enter** — call your supervisor or 911.
- Ask that pets be secured during visits.
- Keep a clear path to the exit; position yourself so you are not blocked in.
- Use **safe body mechanics** and equipment for lifting and transfers; ask for help.
- Report hazards: fall risks, fire hazards, pests, smoking near oxygen, unsafe electrical cords.

### Verbal abuse, harassment and violence
You do not have to accept abuse. Stay calm, set limits ("I'll need to leave if the shouting continues"), leave if you feel unsafe, and report every incident to your supervisor.

### Driving
Wear a seat belt, do not text and drive, and follow your agency's policy for transporting patients.`),
        caseStudy("Case study: a busy afternoon", 12, `**Situation (fictional).** You visit Mrs. Patel, 70, who has a draining leg wound covered with a dressing the nurse changes. The patient's dog is loose and jumps on you. You notice blood on the bed sheet, a used lancet on the nightstand, and a space heater near the curtains. Her son is shouting at someone on the phone in the next room and seems angry.

**Discuss:**
1. What PPE do you need to change the soiled linen? *(Gloves; a gown if your clothing may touch the soiled linen.)*
2. How should you handle the lancet? *(Not with your hands; use the agency's procedure or a sharps container; report to the nurse.)*
3. What hazards will you report? *(Space heater near curtains, sharps left out, a loose dog, blood on linen — possible wound drainage problem.)*
4. What if the son becomes threatening? *(Stay calm, keep a path to the exit, leave if unsafe and call your supervisor or 911.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Infection Control and Patient Safety in Home Care — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which link in the chain of infection does hand hygiene break?", ["The infectious agent's DNA", "Mode of transmission", "The patient's age", "The reservoir's location"], 1, "Clean hands stop germs moving from person to person or surface to person."),
      mc("Under standard precautions, which is NOT considered potentially infectious?", ["Blood", "Sweat", "Urine", "Wound drainage"], 1, "Sweat is the exception."),
      tf("Universal precautions is the term used in the OSHA Bloodborne Pathogens Standard.", true, "OSHA uses universal precautions; CDC uses standard precautions."),
      mc("Contact precautions usually require:", ["An N95 respirator only", "Gloves and a gown for contact with the patient or environment", "No PPE", "Eye protection only"], 1, "Gloves and gown are the core of contact precautions."),
      mc("An N95 respirator requires:", ["Nothing special", "Fit testing under OSHA's respiratory protection standard", "Washing after each use", "Sharing with coworkers"], 1, "Respirators must be fit-tested."),
      ms("Which are bloodborne pathogens covered by OSHA training? (Select all that apply.)", ["Hepatitis B virus", "Hepatitis C virus", "HIV", "Common cold virus"], [0, 1, 2], "The cold is not a bloodborne pathogen."),
      mc("How often must employers covered by the OSHA standard provide bloodborne pathogens training?", ["Once in a career", "At initial assignment and at least annually", "Every five years", "Only after an exposure"], 1, "29 CFR 1910.1030 requires initial and annual training."),
      mc("Which is a safe sharps practice?", ["Recapping with two hands", "Never recapping, bending or breaking used needles", "Placing needles in the trash", "Leaving them for the family"], 1, "Recapping causes needlesticks."),
      sc("Blood from a patient splashes into your eye. What should you do?", ["Rub your eye and continue", "Irrigate the eye with clean water or saline, then report immediately for evaluation", "Wait until the end of your shift", "Apply bleach"], 1, "Irrigate immediately and report the same day."),
      mc("When disinfecting a surface, contact time means:", ["How long the bottle has been open", "How long the surface must stay wet with the disinfectant to work", "The time of the visit", "How long you wear gloves"], 1, "Follow the label contact time."),
      mc("When handling soiled linen you should:", ["Shake it out", "Hold it away from your clothing and avoid shaking it", "Carry it against your chest", "Put it on the kitchen table"], 1, "Avoid spreading germs to yourself and the environment."),
      mc("Good bag technique includes:", ["Placing the bag on the floor", "Placing it on a clean barrier and cleaning hands before reaching in", "Putting dirty items back in the bag", "Leaving the bag open"], 1, "Protects your supplies from contamination."),
      mc("You arrive at a home and hear loud threats and see a weapon. What should you do?", ["Go in quickly to help", "Do not enter; move to safety and call your supervisor or 911", "Wait at the door", "Knock louder"], 1, "Your safety comes first."),
      mc("Which home hazard should be reported?", ["A smoke detector that works", "Smoking near home oxygen", "A clear hallway", "Night lights"], 1, "Smoking near oxygen can cause fire."),
      mc("Which sign may indicate an infection at a catheter or wound site?", ["Dry and unchanged skin", "Redness, warmth, swelling or drainage", "Normal temperature only", "Better appetite"], 1, "Report these signs to the nurse."),
    ],
  },
};
