import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, slides, text, tf } from "../../build";
import { ACCESSED, AHCA_HHA, CDC_HAND, CFR_484_80, FAC_59A_8_0095, FS_400_488, NOT_A_CREDENTIAL } from "./_shared";

export const hhaTraining: CourseContent = {
  code: "CHITA-HH-001",
  title: "Home Health Aide Training: Classroom Theory",
  categorySlug: "home-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 400,
  clinicalReviewRequired: true,
  programClassification: "STATE_REGULATED_TRAINING",
  certificateType: "COURSE_COMPLETION",
  credentialNotice:
    `This is the classroom (theory) part of home health aide training. It covers the subject areas required for home health aide training programs, in about 6½ hours of online study. It does not by itself meet Florida's 40-hour training requirement for licensed home health agencies (Rule 59A-8.0095(5), F.A.C.) or the federal 75-hour training and competency evaluation required by Medicare- and Medicaid-certified agencies (42 CFR 484.80). An employing home health agency, or a school approved by the Florida Department of Education, must add the remaining instruction, supervised practical training with a registered nurse and a competency evaluation. ${NOT_A_CREDENTIAL}`,
  renewalRequirements:
    "This certificate does not expire. Aides working for Medicare-certified agencies must complete at least 12 hours of in-service training every 12 months (42 CFR 484.80(d)); your employer sets any other refresher requirements.",
  instructorResources: `**Before publishing:** record short skills-demonstration videos (hand hygiene, bed bath, transfer with gait belt, taking a radial pulse) and add them as Video lessons in the course builder. Do not use videos that show identifiable patients.

**Practical training:** classroom theory in this course must be followed by supervised practical training. Under 42 CFR 484.80, at least 16 hours of classroom training must come before at least 16 hours of supervised practical training, as part of 75 hours. Use the skills checklists COMP-HH, COMP-PPE, COMP-VS, COMP-TRANSFER, COMP-HHA-BATH, COMP-HHA-ORAL, COMP-HHA-DRESS, COMP-HHA-TOILET, COMP-HHA-AMBUL, COMP-HHA-FEED and COMP-HHA-MEDASSIST. A registered nurse must perform the classroom and supervised practical training and observe each skill.

**Discussion prompts:** module 1 (scope — "what would you do if the client asks you to change their insulin dose?"), module 7 (practice describing a change in condition using the SBAR format), module 11 (what counts as neglect?).`,
  competencyCodes: ["COMP-HH", "COMP-PPE", "COMP-VS", "COMP-TRANSFER", "COMP-HHA-BATH", "COMP-HHA-ORAL", "COMP-HHA-DRESS", "COMP-HHA-TOILET", "COMP-HHA-AMBUL", "COMP-HHA-FEED", "COMP-HHA-MEDASSIST", "COMP-EMERG", "COMP-DOC"],
  description:
    "The classroom theory part of home health aide (HHA) training: the HHA role and its limits, patient rights, ethics and boundaries, communication and cultural competence, infection prevention, personal care, mobility and fall prevention, nutrition, vital signs, observing and reporting changes, assistance with self-administered medication under Florida law, emergencies, dementia and end-of-life care awareness, abuse prevention and confidentiality. Completed with the agency's supervised practical training and skills checklists.",
  targetAudience: "People preparing to work, or newly working, as home health aides for a Florida home health agency or nurse registry; agency trainers who need a structured theory component.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and knowledge checks and pass the final examination with 80% or higher. Practical skills are evaluated separately by a registered nurse using the listed skills checklists.",
  objectives: [
    "Describe the role, supervision and limits of a home health aide in Florida.",
    "Protect patient rights, privacy, dignity and property, and keep professional boundaries.",
    "Use standard precautions, hand hygiene and PPE correctly in the home.",
    "Describe safe techniques for bathing, grooming, dressing, oral care, toileting and incontinence care.",
    "Describe safe transfers, ambulation, positioning and fall prevention.",
    "Support nutrition and fluid intake and recognize swallowing problems.",
    "Measure and record temperature, pulse and respirations, and know when to report.",
    "Recognize and report changes in a patient's condition and document care accurately.",
    "Explain what assistance with self-administered medication is, and is not, under Florida law.",
    "Respond to emergencies and recognize abuse, neglect and exploitation and how to report them.",
  ],
  regulatoryReferences: [CFR_484_80, FAC_59A_8_0095, FS_400_488, { agency: "Centers for Medicare & Medicaid Services", citation: "42 CFR 484.50", title: "Condition of participation: Patient rights", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-484/subpart-B/section-484.50" }],
  sourceReferences: [
    AHCA_HHA,
    CDC_HAND,
    { title: "Standard Precautions for All Patient Care", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/infection-control/hcp/basics/standard-precautions.html", accessedOn: ACCESSED },
    { title: "Florida Abuse Hotline", publisher: "Florida Department of Children and Families", url: "https://www.myflfamilies.com/services/abuse/abuse-hotline/faq", accessedOn: ACCESSED },
    { title: "Older Adult Fall Prevention (STEADI)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/steadi/index.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Home health care and the aide's role",
      summary: "Where home health fits, who supervises you, and what you may and may not do.",
      lessons: [
        slides("Welcome to home health care", 8, `## Home health care
Care delivered where the patient lives: a house, apartment or family member's home.
- Patients are often recovering from surgery or a hospital stay, living with a chronic illness or disability, or nearing the end of life.
- You are a guest in the patient's home.
---
## The care team
- **Registered nurse (RN)** — assesses the patient, writes the aide care plan, supervises you.
- **Therapists** — physical, occupational and speech therapy.
- **Medical social worker**, physician or other practitioner.
- **Home health aide (HHA)** — personal care, help with mobility and daily activities, observing and reporting.
---
## Three kinds of home care providers in Florida
- **Home health agency** (licensed by AHCA) — skilled care and aide services.
- **Nurse registry** (licensed by AHCA) — refers independent nurses, CNAs and aides.
- **Homemaker and companion provider** (registered with AHCA) — **no hands-on personal care**.
---
## Key message
You are the team member who sees the patient most often. What you notice and report keeps patients safe.`),
        text("Roles, responsibilities and supervision", 15, `### What a home health aide does
In Florida law, a home health aide provides hands-on personal care, performs simple procedures as an extension of therapy or nursing services, assists with walking and exercises, and assists with medications only as permitted by law and rule. Typical tasks on an **aide care plan** include:
- Bathing, grooming, dressing, oral care, toileting and incontinence care
- Helping the patient move, transfer, walk and do prescribed exercises
- Helping with meals and fluids
- Measuring and recording temperature, pulse and respirations when assigned
- Light housekeeping related to the patient's care
- **Observing, reporting and documenting** the patient's condition

### Supervision
Under the federal home health rules (42 CFR 484.80), a registered nurse (or therapist) assigns you to a patient and gives you **written patient care instructions**. A registered nurse or other skilled professional supervises you:
- For patients who also receive skilled services, a supervisory assessment at least **every 14 days** (you do not need to be present).
- For patients receiving aide services only, an on-site RN visit at least **every 60 days**.
- Each aide is also observed giving care at least once a year.

### Stay within the care plan
- Do only the tasks on your written care plan that you have been trained and found competent to do.
- **Never** perform nursing tasks such as inserting catheters, giving injections, changing sterile dressings, adjusting oxygen settings, or deciding medication doses.
- If the patient or family asks for something outside the care plan, explain kindly that you need to check with the nurse, then call your supervisor.

### Florida qualification facts
- **Home health aides are not licensed or certified by AHCA** or any other state or federal agency.
- Licensed-only home health agencies must keep proof that each aide completed at least **40 hours** of training (or passed the competency test). Medicare- and Medicaid-certified agencies must meet the federal **75-hour** training and competency evaluation standard.
- Training comes from the home health agency itself or a school approved by the Florida Department of Education.`),
        text("Patient rights, ethics and professional boundaries", 15, `### Patient rights
Home health patients have rights under federal rules (42 CFR 484.50) and Florida law. In everyday terms, every patient has the right to:
- Be treated with **dignity and respect**, and have their **property** respected
- **Privacy** and **confidentiality** of their information
- Take part in planning their care and be told about it in a way they understand (including through an interpreter)
- **Refuse** care or treatment
- Voice complaints without retaliation
- Be free from **abuse, neglect, exploitation**, and from verbal, mental, sexual and physical abuse, injuries of unknown source and misappropriation of property

**If a patient refuses care,** do not force or trick them. Ask why, explain the benefit, offer another time, and report the refusal to the nurse.

### Ethics in the home
- **Honesty:** record only care you actually gave; never sign for someone else.
- **Respect property:** do not use the patient's phone, food, car or belongings for yourself.
- **Accept no money or gifts** beyond what your agency policy allows; never borrow or lend money.
- **Do not** discuss religion, politics or your personal problems in ways that pressure the patient.
- **Do not** bring friends or children to work, or make personal visits on or off duty.
- **Do not** sign legal documents (such as a will) for the patient or act as a witness unless your agency allows it.

### Boundaries
A boundary is the line between a caring professional relationship and a personal one. Warning signs that a boundary is slipping: keeping secrets with the patient, giving out your personal phone number, social media contact, doing favors outside the care plan, or feeling you are the only one who can care for them. Talk to your supervisor early.`),
        check("Check your understanding: role and rights", [
          kc("hha1", "The patient's daughter asks you to change the dressing on her mother's surgical wound because the nurse is late. What should you do?", ["Change it carefully using gloves", "Explain that dressing changes are a nursing task and call the nurse", "Tell her to do it herself", "Ignore the request"], 1, "Sterile dressing changes are nursing tasks. Stay within your care plan and contact the nurse."),
          kc("hha2", "Who writes the written patient care instructions for a home health aide?", ["The aide", "The family", "A registered nurse or other appropriate skilled professional", "The patient's neighbor"], 2, "The RN (or therapist) prepares the aide care plan and supervises the aide."),
          kc("hha3", "A patient refuses a bath today. What should you do?", ["Bathe them anyway because it is on the care plan", "Respect the refusal, ask why, offer another time, and report it to the nurse", "Skip it and record that it was done", "Tell the family to make them bathe"], 1, "Patients have the right to refuse care. Never record care you did not give."),
          kc("hha4", "Are home health aides licensed by AHCA?", ["Yes", "No — AHCA does not license or certify home health aides", "Only in Miami-Dade County", "Only after 10 years"], 1, "AHCA states that home health aides are not licensed or certified by any Florida or federal agency."),
        ]),
      ],
    },
    {
      title: "2. Communication and cultural competence",
      summary: "Talking with patients, families and the care team.",
      lessons: [
        text("Communicating with patients and families", 14, `### Basics
- Knock, introduce yourself with your name and agency, and wear your ID badge.
- Use the patient's preferred name. Sit at eye level when possible.
- Speak clearly and simply. Ask one question at a time and give time to answer.
- **Listen** more than you talk. Watch body language and facial expression.
- Explain each step before you do it: "I'm going to wash your back now."

### Patients with communication challenges
- **Hearing loss:** face the person, reduce background noise, do not shout; check that hearing aids are in and working.
- **Vision loss:** say who you are when you enter, describe where things are, do not move furniture without permission.
- **Speech problems after a stroke (aphasia):** ask yes/no questions, use pictures or gestures, be patient.
- **Dementia:** short sentences, one step at a time, calm tone (see module 10).
- **Limited English:** follow your agency's interpreter policy. Avoid using children as interpreters.

### Communicating with the care team
Report clearly and promptly. One helpful format is **SBAR**:
- **S — Situation:** "Mrs. Lee is more short of breath than yesterday."
- **B — Background:** "She has heart failure and is on oxygen 2 liters."
- **A — Assessment (what you observed):** "Her ankles are more swollen, and she gained 3 pounds since yesterday."
- **R — Request:** "Can the nurse see her today? What should I do now?"
As an aide you do not diagnose; you **describe what you see, hear and measure**.`),
        text("Cultural competence", 10, `Every patient has their own culture: language, religion, food, family roles, beliefs about illness and death, modesty and touch.
- **Ask, don't assume.** "Is there anything about your beliefs or customs I should know as I help you?"
- **Respect modesty:** some patients prefer a caregiver of the same gender; tell your supervisor.
- **Food and fasting:** follow religious and cultural food practices within the diet order.
- **Family roles:** in some families decisions are made together; the patient still has the right to decide.
- **Home remedies:** do not judge; report remedies or supplements to the nurse because some interact with medicines.
- Notice your own assumptions and treat every patient with the same respect.`),
        check("Check your understanding: communication", [
          kc("hha5", "In SBAR, what does the A stand for when an aide reports?", ["Assumption", "Assessment — what you observed", "Antibiotics", "Appointment"], 1, "Aides describe what they observe; they do not diagnose."),
          kc("hha6", "A patient who is hard of hearing seems confused by your instructions. What helps most?", ["Shout louder", "Face them, reduce noise and check their hearing aids", "Write nothing down", "Speak faster"], 1, "Face the person, lower background noise, and make sure hearing aids are working."),
        ]),
      ],
    },
    {
      title: "3. Infection prevention and control",
      summary: "Hand hygiene, PPE and standard precautions in the home.",
      lessons: [
        text("Standard precautions, hand hygiene and PPE", 18, `### Standard precautions
Treat **all blood, body fluids (except sweat), non-intact skin and mucous membranes as potentially infectious** — for every patient, every time. Standard precautions include hand hygiene, PPE based on the expected exposure, respiratory hygiene, safe handling of equipment and linen, and environmental cleaning.

### Hand hygiene
Clean your hands:
- When you arrive and before you leave the home
- Before and after touching the patient
- Before clean tasks (such as oral care) and after contact with body fluids
- After touching the patient's surroundings
- **Immediately after removing gloves**

**Alcohol-based hand rub** is preferred unless hands are visibly soiled, after caring for a patient with diarrhea or *C. difficile* (follow agency policy), or before eating — then wash with **soap and water for at least 20 seconds**. Carry hand rub and paper towels in your bag; use the patient's sink but not their cloth towel.

### Personal protective equipment (PPE)
- **Gloves** when you may touch blood, body fluids, mucous membranes or non-intact skin. Change gloves between tasks (dirty to clean) and never wash or reuse disposable gloves.
- **Gown** when clothing may be splashed.
- **Mask and eye protection** when splashes or sprays are possible, or as directed for respiratory illnesses.
- Put on (don): gown, mask, eye protection, gloves. Take off (doff): gloves, gown (or gown and gloves together), then hand hygiene, eye protection, mask, then hand hygiene again — or follow your agency's sequence.

### Your nursing bag
Place your bag on a clean, dry surface (paper barrier), not the floor or bed. Clean hands before reaching in. Keep dirty items out of the bag.

### Respiratory hygiene
Cover coughs and sneezes, offer the patient a mask if they are coughing and you are close, and stay home when you are sick according to agency policy.`),
        text("Clean, safe, healthy environment", 10, `- **Clean from clean to dirty and high to low.** Use the cleaning product your agency approves and follow the label contact time.
- **Linen:** carry soiled linen away from your body; do not shake it. Wash with detergent at the warmest temperature the fabric allows. Use gloves for linen soiled with body fluids.
- **Sharps:** you do not use needles, but patients may. Never recap or handle used needles; make sure the patient has a puncture-resistant sharps container and tell the nurse if sharps are left out.
- **Waste:** bag soiled dressings and incontinence products, tie and place in the household trash unless your agency or local rules say otherwise.
- **Food safety:** wash hands, keep raw meat separate, refrigerate leftovers within 2 hours, check expiration dates.
- **Pests, clutter and hazards:** report them to the nurse; they affect safety and infection risk.`),
        check("Check your understanding: infection prevention", [
          kc("hha7", "When must you perform hand hygiene?", ["Only when hands look dirty", "Only at the start of the shift", "Before and after patient contact, after body fluids and immediately after removing gloves", "Only after using the restroom"], 2, "Clean hands at every key moment, including right after glove removal."),
          kc("hha8", "Under standard precautions, which body fluid is NOT treated as potentially infectious?", ["Blood", "Urine", "Sweat", "Wound drainage"], 2, "Standard precautions apply to all body fluids except sweat."),
          kc("hha9", "Where should you place your nursing bag in the home?", ["On the patient's bed", "On the floor by the door", "On a clean, dry surface with a barrier", "In the bathroom"], 2, "Use a clean, dry surface with a paper barrier."),
        ]),
      ],
    },
    {
      title: "4. Personal care and hygiene",
      summary: "Bathing, grooming, dressing, oral care, toileting and skin care.",
      lessons: [
        text("Bathing and skin care", 16, `### Before any personal care
Check the care plan, gather supplies, explain the procedure, provide **privacy** (close doors and curtains, cover the body), and perform hand hygiene. Encourage the patient to do as much as they safely can.

### Types of baths
- **Complete bed bath** for patients who cannot get up.
- **Partial bath** (face, hands, underarms, perineal area).
- **Tub bath or shower** with non-slip mat, shower chair, grab bars and handheld shower. **Never leave the patient alone** in the tub or shower.

### Safe technique
- Check **water temperature** with a bath thermometer or the inside of your wrist before the patient touches it; older adults and people with diabetes or nerve damage can be burned without feeling it.
- Wash from **clean to dirty**: eyes (no soap, inner to outer corner), face, arms, chest, abdomen, legs, back, then perineal area last. Change water when it becomes soapy or cool, and always after perineal care.
- **Perineal care:** front to back, a clean part of the washcloth for each stroke. For uncircumcised males, retract the foreskin gently to clean and return it to its natural position.
- Dry thoroughly, especially between toes and in skin folds.
- **Shampoo** in bed with a basin or rinse-free shampoo cap, in the sink, or in the shower as the care plan directs.

### Skin observation — report to the nurse
Redness that does not fade, blisters, open areas, bruises, rashes, swelling, dry or cracked skin, especially over bony areas (tailbone, hips, heels, elbows, back of head). These may be early pressure injuries.

### Preventing pressure injuries
Reposition patients who cannot move themselves as the care plan directs (often at least every 2 hours), keep skin clean and dry, avoid dragging the skin when moving, keep sheets smooth and encourage food and fluids.`),
        text("Grooming, dressing and oral care", 12, `### Grooming
- Hair care daily; let the patient choose style.
- **Shaving:** use an electric razor for patients on blood thinners or as the care plan directs.
- **Nail care:** clean and file; **do not cut** the nails of patients with diabetes or poor circulation unless the care plan and agency policy allow — report long or ingrown nails to the nurse.

### Dressing
- Offer choices and let the patient do what they can.
- **Weak side first** when dressing, **weak side last** when undressing.
- Choose loose clothing and non-skid, well-fitting shoes.

### Oral care
- Sit the patient upright. Brush teeth, gums and tongue with a soft brush at least twice a day.
- **Unconscious or very weak patients:** turn the head to the side and use only the moistened swab or tool the care plan allows to prevent choking; never put fingers in the mouth of a patient who might bite.
- **Dentures:** handle over a towel or basin of water, brush with cool water (hot water can warp them), store in a labeled cup of water or solution, and check the gums for sores.`),
        text("Toileting and incontinence care", 12, `- Offer toileting regularly and promptly when asked; never make the patient wait.
- Use bedpan, urinal, bedside commode or toilet with grab bars as the care plan directs; give privacy but stay within call.
- **Incontinence** is never the patient's fault. Respond with kindness, clean promptly, dry skin and apply barrier cream if on the care plan. Change briefs when wet or soiled.
- **Urinary catheter bag care:** keep the bag **below the bladder** and off the floor, avoid kinks, empty when half full without touching the drainage spout to the container, and measure output if ordered. You **do not insert, remove or irrigate** catheters.
- **Report** to the nurse: blood in urine or stool, dark or cloudy urine, strong odor, pain or burning, no urine for the time your nurse specifies, constipation or diarrhea, black or tarry stools.
- Record intake and output when ordered.`),
        check("Check your understanding: personal care", [
          kc("hha10", "How should you check bath water temperature?", ["Ask the patient to test it with their foot", "Use a bath thermometer or the inside of your wrist before the patient touches it", "Run the hot water only", "Water temperature does not matter"], 1, "Older adults and people with nerve damage can be burned without feeling it."),
          kc("hha11", "When dressing a patient who has weakness on the left side after a stroke, which arm goes into the shirt first?", ["The right arm", "The left (weak) arm", "Either arm", "Neither — use a gown only"], 1, "Dress the weak side first and undress it last."),
          kc("hha12", "Where should a urinary catheter drainage bag be kept?", ["On the bed next to the patient", "Below the level of the bladder and off the floor", "Above the patient's head", "In the bathroom"], 1, "Keeping the bag below the bladder prevents backflow; keeping it off the floor prevents contamination."),
        ]),
      ],
    },
    {
      title: "5. Mobility, transfers and fall prevention",
      summary: "Body mechanics, safe transfers, walking, positioning and range of motion.",
      lessons: [
        text("Body mechanics and safe transfers", 15, `### Protect your back
- Keep a wide base of support (feet shoulder-width apart), bend at the hips and knees, keep your back straight and the load close to your body.
- Turn with your feet — do not twist your back.
- **Get help** or use equipment (gait belt, transfer board, mechanical lift) as the care plan directs. Never lift a patient alone if they cannot bear weight.

### Before any transfer
- Check the care plan for the transfer method, weight-bearing limits and equipment.
- Lock wheelchair brakes and bed wheels; lower the bed; put non-skid shoes on the patient.
- Explain each step and count together: "On three, we'll stand."

### Stand-pivot transfer with a gait belt (bed to chair)
1. Place the chair at a slight angle next to the bed on the patient's **stronger side**; lock brakes.
2. Help the patient sit on the edge of the bed with feet flat on the floor; watch for dizziness (let them sit for a minute).
3. Apply the gait belt snugly over clothing at the waist.
4. Stand facing the patient, grasp the belt with an underhand grip, brace their knees with yours if needed.
5. Have the patient push up from the bed and stand on your count; pivot toward the chair.
6. Lower them slowly into the chair as they reach for the armrests.

### Mechanical lifts and transfer boards
Use only if you are trained and the care plan directs. Check the sling size and equipment before every use, and use the number of staff the manufacturer and agency require.`),
        text("Walking, positioning and range of motion", 12, `### Assisting with walking
- Stand slightly behind and to the weaker side; hold the gait belt.
- **Walker:** move the walker first, then the weaker leg, then the stronger leg. All four legs on the ground before stepping.
- **Cane:** held in the hand on the **stronger** side; move the cane and weaker leg together.
- **If the patient starts to fall:** do not try to hold them up. Widen your stance, pull them close using the gait belt, and ease them to the floor, protecting the head. Stay with them, **do not get them up** until you check for injury and follow agency policy (call the nurse; call 911 if hurt or unresponsive).

### Positioning in bed
- Reposition as the care plan directs, using pillows to keep the body aligned and heels off the mattress.
- Common positions: on the back (supine), on the side (lateral), semi-sitting (Fowler's, head raised 45–60 degrees).
- Use a draw sheet to move a patient up in bed to avoid friction on the skin.

### Range of motion (ROM)
ROM exercises keep joints flexible and prevent contractures. **Do ROM only as ordered.** Move each joint gently and smoothly, support the limb above and below the joint, and **stop at pain or resistance**. Never do ROM on the neck unless specifically ordered.`),
        text("Fall prevention in the home", 10, `Falls are a leading cause of injury in older adults. CDC's STEADI initiative helps clinicians screen and reduce fall risk; aides help by making the home safer and reporting risks.

**Home safety checks:**
- Clear paths: remove clutter, cords and throw rugs (with the patient's permission).
- Good lighting, including night lights from bed to bathroom.
- Grab bars, raised toilet seat, shower chair, non-slip mats.
- Frequently used items within easy reach.
- Bed at a safe height; call bell or phone within reach.
- Sturdy, non-skid footwear — no socks only or loose slippers.

**Report fall risk factors:** dizziness when standing, new confusion, unsteady walking, new medications, frequent urgent toileting at night, poor vision, fear of falling.`),
        check("Check your understanding: mobility", [
          kc("hha13", "A patient you are walking with starts to fall. What should you do?", ["Hold them upright with all your strength", "Ease them to the floor using the gait belt, protecting the head, and stay with them", "Let go and step back", "Lift them immediately back to the chair"], 1, "Trying to hold a falling patient upright injures both of you. Ease them down and get help."),
          kc("hha14", "Which hand should hold a cane?", ["The hand on the weaker side", "The hand on the stronger side", "Either hand", "Both hands"], 1, "The cane is held on the stronger side and moves with the weaker leg."),
          kc("hha15", "When doing range-of-motion exercises, you should stop when:", ["The patient feels pain or you feel resistance", "Ten repetitions are done regardless of pain", "The family leaves", "Never"], 0, "Never force a joint. Stop at pain or resistance and report."),
        ]),
      ],
    },
    {
      title: "6. Nutrition and fluids",
      summary: "Diets, feeding assistance and swallowing safety.",
      lessons: [
        text("Helping patients eat and drink", 14, `### Nutrition matters
Good nutrition and fluids help healing, protect skin, prevent infections and falls, and keep energy up. Older adults may lose their sense of thirst.

### Special diets — follow the order
- **Diabetic / carbohydrate-controlled** diets
- **Low-sodium** (heart failure, high blood pressure)
- **Mechanically altered** textures (minced, pureed) and **thickened liquids** for swallowing problems
- **Fluid restriction** (some heart and kidney conditions) — measure and record exactly as ordered
- Religious, cultural and personal preferences within the order

### Feeding assistance
1. Hand hygiene; help the patient wash hands.
2. Sit the patient **upright**, as close to 90 degrees as possible; sit at eye level beside them.
3. Tell them what is on the plate; for patients with vision loss, use the clock method ("chicken at 3 o'clock").
4. Offer **small bites** and sips; allow time to chew and swallow; alternate food and fluids.
5. Encourage independence with adaptive utensils.
6. Keep the patient upright for at least 30 minutes after eating, or as the care plan directs.
7. Record intake (percentage eaten, fluid amounts) when ordered.

### Swallowing problems (dysphagia) — stop and report
Coughing or choking during meals, wet or gurgly voice, food left in the cheeks (pocketing), drooling, taking a very long time to eat, or repeated chest infections.

### Choking
If the patient cannot speak, cough or breathe, call for help and follow your training (abdominal thrusts for a responsive adult). Call 911.

### Signs of dehydration — report
Dark urine or small amounts, dry mouth, dizziness, confusion, constipation, fast pulse.`),
        check("Check your understanding: nutrition", [
          kc("hha16", "What position should a patient be in for eating?", ["Lying flat", "Upright, as close to 90 degrees as possible", "On their stomach", "Any position they like"], 1, "Upright positioning reduces the risk of choking and aspiration."),
          kc("hha17", "A patient coughs and has a wet, gurgly voice while drinking. What should you do?", ["Give a larger sip to clear the throat", "Stop, keep them upright and report possible swallowing problems to the nurse", "Lay them down to rest", "Nothing — this is normal"], 1, "These are signs of dysphagia and aspiration risk."),
        ]),
      ],
    },
    {
      title: "7. Vital signs, observation, reporting and documentation",
      summary: "Temperature, pulse and respirations; changes in condition; accurate records.",
      lessons: [
        text("Vital signs fundamentals", 16, `Take and record vital signs **only when assigned** and as you were trained. Use the agency's normal ranges and the patient's own **baseline** from the care plan; report any value outside the limits your nurse gives you.

### Temperature
- **Oral** (digital): wait 15 minutes after the patient eats, drinks or smokes. Place under the tongue, lips closed.
- **Tympanic** (ear) and **temporal** (forehead) thermometers: follow the device instructions.
- **Axillary** (armpit): dry the armpit; usually reads lower than oral.
- Many adults' normal oral temperature is around 97.8–99.1°F (36.5–37.3°C). Older adults may have lower baselines and may not run a fever with infection. Report a temperature at or above the limit your nurse sets (often 100.4°F / 38°C) or any new chills.

### Pulse
- **Radial pulse:** place two fingers (not your thumb) on the thumb side of the inner wrist. Count for **a full 60 seconds** (or as your agency directs), noting rate, rhythm (regular or irregular) and strength.
- Typical adult resting rate: 60–100 beats per minute. Report below 60 or above 100, or an irregular rhythm, unless the care plan says otherwise.

### Respirations
- Count breaths **without telling the patient** (they may change their breathing), often right after the pulse while your fingers stay on the wrist. One rise and fall = one breath; count for a full minute.
- Typical adult rate: 12–20 per minute. Report rates outside this range, noisy or labored breathing, or shortness of breath.

### Blood pressure
Measure blood pressure only if you were trained and it is on your care plan (see the COMP-BP skills checklist).

### Record immediately
Write the value, the site or method, the time, and what you reported and to whom.`),
        text("Recognizing and reporting changes in condition", 14, `You are the eyes and ears of the care team. **Report immediately** (call the nurse; call **911** for emergencies) when you notice:

| Area | Report |
|---|---|
| Breathing | New or worse shortness of breath, chest pain, wheezing, blue lips |
| Mental status | New confusion, unusual sleepiness, agitation, slurred speech |
| Stroke signs (**BE FAST**) | **B**alance loss, **E**yes (vision change), **F**ace drooping, **A**rm weakness, **S**peech difficulty, **T**ime to call 911 |
| Pain | New pain, worse pain, pain the patient did not have before |
| Skin | New redness that does not fade, open areas, bruises, swelling, very pale or hot skin |
| Intake/output | Not eating or drinking, vomiting, diarrhea, no urine, blood in urine or stool |
| Weight | Sudden weight gain (heart failure patients — follow the nurse's limit) |
| Falls | Any fall, even without injury |
| Mood | Sadness, crying, talk of death or suicide |
| Home | No food, no heat or air conditioning, unsafe conditions, signs of abuse or neglect |

**Objective vs subjective:** objective = what you see, hear, feel, smell or measure ("pulse 112, skin cool and damp"); subjective = what the patient tells you — record it in their words ("Patient states, 'My chest feels tight'").`),
        text("Documentation", 10, `- Document **care you gave, what you observed, and what you reported** — promptly, accurately and only for yourself.
- Use the agency's system (paper or electronic visit verification) and correct errors the way your agency requires (never erase or use correction fluid; in electronic systems use the correction function).
- Be **specific and factual**: "Assisted with shower, 15 minutes, using shower chair. Skin intact except 2 cm red area on right heel that did not fade; reported to nurse J. Ruiz at 10:40."
- Do not chart in advance or for someone else. Do not chart opinions ("lazy," "difficult").
- Your record is a **legal document** and is used for billing; false documentation is fraud.`),
        check("Check your understanding: vital signs and reporting", [
          kc("hha18", "Where do you place your fingers to take a radial pulse?", ["On the thumb side of the inner wrist, using two fingers", "On the neck with your thumb", "On the back of the hand", "On the elbow"], 0, "Use two fingers, not the thumb, on the thumb side of the inner wrist."),
          kc("hha19", "A patient suddenly has a drooping face and slurred speech. What do you do?", ["Let them rest and check again in an hour", "Call 911 immediately — these are stroke signs", "Give them water", "Document it at the end of the visit"], 1, "BE FAST: time is critical in stroke. Call 911 and then your supervisor."),
          kc("hha20", "Which entry is objective?", ["\"Patient seems lazy today.\"", "\"Patient ate 25% of lunch and drank 120 mL of water.\"", "\"Patient is probably depressed.\"", "\"Patient is difficult.\""], 1, "Objective entries describe what you saw or measured."),
        ]),
      ],
    },
    {
      title: "8. Medication assistance boundaries",
      summary: "Assistance with self-administered medication under Florida law.",
      lessons: [
        text("Assistance is not administration", 15, `### The difference
- **Administering** medication means a licensed nurse (or an aide who has completed the required training and RN validation and has been delegated the task) gives the medicine. In Florida, home health aides may administer certain medications only when delegated by an RN after completing a **6-hour medication administration course** and a **2-hour annual in-service** with competency validation (s. 400.489, F.S.; Rule 59A-8.0097, F.A.C.). That is **not** covered by this course.
- **Assisting with self-administration** means helping a patient who is **able to take their own medicine** do so. In Florida (s. 400.488, F.S.), unlicensed staff of a home health agency may assist only after the patient (or their representative) has given **written informed consent**, and after the aide has received the required training — at least **2 hours** under Rule 59A-8.0095(5), which can be part of the 40-hour course. The training must confirm that the aide can **read the prescription label** and instructions.

### What assistance generally includes (always follow the statute and your agency's policy)
- Bringing the medicine **in its previously dispensed, properly labeled container** to the patient
- In the patient's presence, **reading the label**, opening the container, removing the prescribed amount and closing it
- Placing an oral dose in the patient's hand or a cup so the patient takes it
- Other tasks listed in the statute for your setting, such as helping with prescribed eye drops, inhalers or premeasured nebulizer doses
- Returning the medicine to storage and **recording** the assistance

### What assistance does **not** include
- **Mixing, compounding, converting or calculating doses** (except tasks the statute specifically allows, such as measuring a prescribed liquid dose)
- **Deciding** whether an as-needed (PRN) medicine is needed
- Giving medicine to a patient who cannot participate in self-administration
- Taking medicine from unlabeled containers, or medicine prescribed for someone else
- Injections (unless a specific delegation law and your training allow it — not covered here)

### The "rights" when you assist
Right **patient**, right **medication**, right **dose**, right **route**, right **time**, and right **documentation**. Compare the label with the patient's medication list each time.

### Report immediately
Refusals, missed or extra doses, wrong medicine, the patient seems unable to self-administer, side effects (rash, dizziness, falls, confusion, swelling of lips or face, trouble breathing — **call 911** for trouble breathing).`),
        check("Check your understanding: medication assistance", [
          kc("hha21", "Under Florida law, how many hours of training must a home health aide receive before assisting with self-administered medication?", ["None", "At least 2 hours", "40 hours dedicated to medications", "6 hours plus RN delegation"], 1, "At least 2 hours (which can be part of the 40-hour training). Administering medication is different and requires 6 hours plus RN delegation."),
          kc("hha22", "The patient asks you to decide whether she should take her as-needed pain pill. What do you do?", ["Decide based on how she looks", "Explain that you cannot decide PRN needs; she decides, or you call the nurse", "Give it to be safe", "Give half"], 1, "Judging the need for a PRN medication is outside assistance."),
          kc("hha23", "Which is part of assistance with self-administration?", ["Calculating a new dose", "Reading the label and placing the prescribed tablet in the patient's hand", "Giving an injection", "Using pills from an unlabeled bag"], 1, "Assistance uses the labeled container and the patient takes the medicine."),
        ]),
      ],
    },
    {
      title: "9. Emergencies and home safety",
      summary: "Recognizing emergencies, CPR and first aid awareness, fire and disaster safety.",
      lessons: [
        text("Responding to emergencies", 14, `### General steps
1. **Check the scene** for danger to you and the patient.
2. **Check the patient:** responsive? breathing normally?
3. **Call 911** for life-threatening problems, then your agency. Know the patient's address.
4. **Care** within your training until help arrives. Follow the patient's **advance directives**: if the patient has a valid Florida Do Not Resuscitate Order (DNRO) and your agency's policy permits, do not start CPR — make sure you know where it is kept and follow your agency's policy.

### CPR and first aid awareness
This course gives awareness only. Many agencies require current **CPR certification from a recognized provider** (for example, a course with a hands-on skills test). Key points:
- Unresponsive and not breathing normally: call 911, start chest compressions (hard and fast in the center of the chest), use an AED if available.
- **Choking** (cannot speak or cough): abdominal thrusts for a responsive adult.
- **Bleeding:** firm direct pressure with gloved hands and a clean cloth.
- **Burns:** cool running water; do not apply butter or ice.
- **Low blood sugar** in a diabetic patient (shaky, sweaty, confused): follow the care plan; if awake and able to swallow, a fast sugar source as the plan directs; call the nurse; call 911 if unresponsive.
- **Seizure:** protect from injury, do not put anything in the mouth, time it; call 911 if it lasts more than 5 minutes or it is the first one.

### Fire safety
Working smoke alarms; no smoking near oxygen; **RACE** (Rescue, Alarm, Contain, Extinguish/Evacuate) and **PASS** for extinguishers (Pull, Aim, Squeeze, Sweep). Get the patient out first if there is a fire.

### Hurricanes and disasters
Florida home health agencies plan for disasters, and patients may need to register for special-needs shelters through their county emergency management office. Know your agency's emergency plan and your role.

### Your own safety
Trust your instincts. If you feel unsafe (violence, weapons, aggressive animals, drug activity), leave and call your supervisor or 911. Keep your phone charged and let the office know your schedule.`),
        check("Check your understanding: emergencies", [
          kc("hha24", "You find a patient unresponsive and not breathing normally. What is first after checking for danger?", ["Call the family", "Call 911 and start CPR (unless a valid DNRO applies and agency policy directs otherwise)", "Wait 10 minutes", "Give water"], 1, "Activate EMS and begin CPR within your training and the patient's advance directives."),
          kc("hha25", "What does PASS stand for when using a fire extinguisher?", ["Push, Alert, Spray, Stop", "Pull, Aim, Squeeze, Sweep", "Point, Activate, Shoot, Save", "Pull, Alarm, Stay, Sweep"], 1, "Pull the pin, Aim low, Squeeze, Sweep side to side."),
        ]),
      ],
    },
    {
      title: "10. Dementia and end-of-life care awareness",
      summary: "Caring for people living with dementia, and comfort at the end of life.",
      lessons: [
        text("Dementia care basics", 12, `Dementia is a group of conditions that cause a decline in memory, thinking and daily functioning severe enough to interfere with daily life. Alzheimer's disease is the most common cause. (Our full Dementia and Alzheimer's Care course covers this in depth.)

**Everyday approaches:**
- Approach from the front, say your name, make eye contact, and speak slowly in short sentences.
- One step at a time: "Let's put your arm in this sleeve."
- Offer simple choices (two options).
- Do not argue or correct; enter their reality and redirect gently.
- Behavior is communication — look for unmet needs (pain, hunger, thirst, toileting, noise, boredom, fear).
- Keep routines consistent.
- Report new or worse confusion — it can be a sign of infection, dehydration or medication problems (delirium), which is a medical issue.

**Florida dementia training:** employees of home health agencies who have contact with patients must complete a 1-hour dementia training provided by the Department of Elder Affairs within 30 days of starting work, and those who provide personal care must complete 2 more hours within 7 months, using a trainer and curriculum approved by the Department (s. 430.5025, F.S.). Your employer will tell you how to complete it.`),
        text("End-of-life and palliative care awareness", 10, `- **Palliative care** focuses on comfort and quality of life during serious illness and can be given alongside treatment. **Hospice** is comfort-focused care for people expected to live about six months or less who are no longer seeking a cure.
- **Respect advance directives** and the patient's wishes about care at the end of life.
- **Comfort measures:** mouth care, repositioning, keeping skin clean and dry, soft lighting and music, being present.
- Signs that death may be near include more sleeping, less eating and drinking, changes in breathing (pauses, noisy breathing), cool and mottled skin, and confusion. Report changes to the nurse; follow the care plan and agency policy when a patient dies.
- **Respect cultural and religious practices** around death.
- Grief is normal for families and for you. Use your agency's support.`),
        check("Check your understanding: dementia and end of life", [
          kc("hha26", "A patient with dementia insists her late husband is coming home for dinner. What is the best response?", ["\"Your husband died years ago.\"", "\"Tell me about your husband. Shall we set the table together?\"", "Ignore her", "Argue until she agrees"], 1, "Avoid arguing or correcting. Validate feelings and redirect."),
          kc("hha27", "Sudden new confusion in an older patient can be a sign of:", ["Normal aging only", "Delirium from infection, dehydration or medication — report it", "Laziness", "Nothing important"], 1, "Delirium is a medical problem that needs prompt attention."),
        ]),
      ],
    },
    {
      title: "11. Abuse prevention and confidentiality",
      summary: "Recognizing and reporting abuse, neglect and exploitation; protecting privacy.",
      lessons: [
        text("Abuse, neglect and exploitation", 12, `### Types
- **Physical abuse** — hitting, pushing, rough handling, inappropriate restraint
- **Sexual abuse** — any non-consensual sexual contact
- **Emotional/psychological abuse** — threats, humiliation, isolation
- **Neglect** — failure to provide food, water, hygiene, medicine, safety (including **self-neglect**)
- **Exploitation** — misusing a vulnerable adult's money, property or benefits

### Warning signs
Unexplained bruises, burns or fractures; fear of a caregiver; poor hygiene or weight loss; missing money or belongings; unpaid bills despite enough income; a caregiver who will not let you see the patient alone.

### Florida reporting
Anyone who knows or has reasonable cause to suspect abuse, neglect or exploitation of a **vulnerable adult** or a **child** must report it to the **Florida Abuse Hotline: 1-800-96-ABUSE (1-800-962-2873)**, 24 hours a day, or online. Call **911** if someone is in immediate danger. You do not need proof. Tell your supervisor as well, but do not delay the report. Reports made in good faith are protected.

### Never
Never abuse, threaten, neglect or exploit a patient — and never ignore it when you see it.`),
        text("HIPAA and patient confidentiality", 10, `- Patient information — name, address, diagnosis, medicines, what you see in the home — is **confidential**. HIPAA requires home health agencies to protect it, and your agency's policies apply to you.
- Share information **only** with people who need it for the patient's care (your supervisor, the care team) or as your agency directs.
- Do not discuss patients with your family, friends or other patients, or in public places.
- **Never post** about patients on social media, even without names or with "privacy" settings. No photos of patients or their homes on personal phones.
- Keep paperwork and devices secure; log out of the agency app; do not leave documents in your car in view.
- If someone calls asking about a patient, refer them to the office.
- Report any lost device or paperwork, or any privacy breach, to your supervisor immediately.`),
        caseStudy("Case study: a visit with Mr. Alvarez", 15, `**Situation (fictional).** Mr. Alvarez, 78, lives with his adult son. He has heart failure and diabetes and was discharged from the hospital last week. Your care plan: shower assistance with shower chair, dressing, help with breakfast, walking in the home with a walker, and recording temperature, pulse and respirations.

**During the visit:**
- When you arrive, he says he is "fine" but is breathing faster than last visit. Respirations are 26, pulse 108 and irregular. His ankles look more swollen and his slippers are tight.
- His son says his father "doesn't need" his water pill today because they are going to the store.
- You notice an unopened bill marked "final notice" and Mr. Alvarez says his son "handles his checks now" and seems worried.
- He asks you to post a photo of the two of you on social media because "you're like family."

**What should you do?**
1. Do not start the shower. Report the breathing, pulse and swelling to the nurse **now** using SBAR; call 911 if he has chest pain or severe shortness of breath.
2. Do not decide about medication. Tell the son you will let the nurse know about his concern; report it.
3. Report your observations about possible financial exploitation to your supervisor and, if you have reasonable cause to suspect exploitation, to the Florida Abuse Hotline.
4. Kindly decline the photo — patient privacy and boundaries.
5. Document objectively what you observed, measured, and reported, and to whom.

**Discussion:** Which observations are objective and which subjective? Which of these issues is outside the aide's scope, and who should handle it?`),
      ],
    },
  ],
  finalExam: {
    title: "Home Health Aide Classroom Theory — Final Examination",
    passingScore: 80,
    questionCount: 20,
    questions: [
      mc("Who supervises a home health aide's patient care?", ["The patient's neighbor", "A registered nurse or other appropriate skilled professional", "No one", "The family only"], 1, "RNs (or therapists) assign and supervise aide services."),
      tf("AHCA licenses home health aides in Florida.", false, "AHCA states aides are not licensed or certified by any Florida or federal agency."),
      mc("A licensed-only Florida home health agency must have documentation that each aide completed at least how many hours of training (or passed the competency test)?", ["8", "16", "40", "120"], 2, "Rule 59A-8.0095(5) requires at least 40 hours (or the competency test)."),
      mc("Under federal rules, how many hours of in-service training must aides at Medicare-certified agencies complete every 12 months?", ["4", "8", "12", "24"], 2, "42 CFR 484.80(d) requires at least 12 hours."),
      mc("A patient refuses help with dressing. You should:", ["Dress them anyway", "Respect the refusal, offer later, and report it", "Record that care was given", "Call the police"], 1, "Patients have the right to refuse care."),
      ms("Which are professional boundary violations? (Select all that apply.)", ["Borrowing money from a patient", "Adding a patient on personal social media", "Explaining care before you give it", "Accepting an expensive gift against agency policy"], [0, 1, 3], "Explaining care is good practice."),
      mc("When is alcohol-based hand rub NOT the right choice?", ["Before touching the patient", "When hands are visibly soiled", "After touching the bed rail", "When entering the home"], 1, "Wash with soap and water when hands are visibly soiled."),
      mc("What should you do immediately after removing gloves?", ["Put them in your bag", "Perform hand hygiene", "Reuse them later", "Rinse them"], 1, "Glove removal is always followed by hand hygiene."),
      mc("During a bed bath, which area is washed last?", ["Face", "Arms", "Perineal area", "Chest"], 2, "Wash clean to dirty; perineal care is last."),
      mc("Perineal care for a female patient should be done:", ["Back to front", "Front to back with a clean area of the cloth for each stroke", "With the same area of the cloth each time", "Only weekly"], 1, "Front to back reduces urinary tract infection risk."),
      mc("When assisting with a walker, the correct order is:", ["Weak leg, walker, strong leg", "Walker, weak leg, strong leg", "Strong leg, weak leg, walker", "Walker and both legs together"], 1, "Move the walker first, then the weak leg, then the strong leg."),
      mc("Which is a home fall-prevention measure?", ["Adding throw rugs", "Night lights from bedroom to bathroom", "Socks without shoes", "Keeping items on high shelves"], 1, "Lighting reduces falls; rugs and socks increase risk."),
      mc("Signs of a swallowing problem include:", ["Eating quickly", "Coughing, wet voice or pocketing food during meals", "Asking for seconds", "Using a straw"], 1, "Report these signs to the nurse."),
      mc("A typical adult resting pulse rate is:", ["30–50", "60–100", "110–140", "150–200"], 1, "60–100 beats per minute unless the care plan sets other limits."),
      mc("Why do you count respirations without telling the patient?", ["To save time", "People may change their breathing when they know it is being counted", "It is a legal requirement", "So you can write any number"], 1, "Awareness can change breathing rate."),
      sc("A patient suddenly cannot raise her right arm and her speech is slurred. What should you do first?", ["Help her to bed and check later", "Call 911 — these are stroke warning signs — then notify your supervisor", "Give aspirin", "Wait for the nurse's next visit"], 1, "BE FAST: call 911 immediately."),
      mc("Assistance with self-administered medication under Florida law includes:", ["Calculating a dose change", "Reading the label and placing the prescribed dose in the patient's hand", "Deciding whether a PRN dose is needed", "Using medicine from an unlabeled container"], 1, "Assistance uses the properly labeled container; the patient takes the medicine."),
      mc("Which document confirms that a patient may assist with their own medication through an aide in Florida?", ["Verbal agreement only", "The patient's (or representative's) written informed consent", "The aide's own judgment", "None is needed"], 1, "Section 400.488 requires a documented request and written informed consent."),
      mc("Suspected financial exploitation of a vulnerable adult in Florida should be reported to:", ["The patient's bank only", "The Florida Abuse Hotline, 1-800-96-ABUSE", "Social media", "No one without proof"], 1, "Reasonable cause to suspect is enough to report."),
      mc("Which is a HIPAA-compliant action?", ["Posting a patient's photo without a name", "Referring a caller asking about a patient to the agency office", "Discussing a patient with your friends", "Leaving the care plan on the car seat"], 1, "Share information only as your agency directs."),
    ],
  },
};
