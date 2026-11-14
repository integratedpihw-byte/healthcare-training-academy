import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const fallPrevention: CourseContent = {
  code: "CHTA-CP-002",
  title: "Fall Prevention and Post-Fall Response",
  categorySlug: "clinical-patient-care",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "Florida nursing home CNA in-service must address fall risk (s. 400.211, F.S.); no fixed interval applies to all settings.",
  estimatedMinutes: 50,
  clinicalReviewRequired: true,
  description:
    "Falls are a leading cause of injury and death in older adults. This course covers why people fall, how teams assess risk, everyday prevention (purposeful rounding, safe environment, footwear, toileting, mobility and medication review), what to do — and not do — immediately after a fall, and how post-fall huddles prevent the next one.",
  targetAudience: "Nursing staff, CNAs, caregivers, therapy staff, home health aides and environmental services staff in hospitals, nursing homes, ALFs and home care.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Safe transfer and mobility skills are verified separately.",
  objectives: [
    "Describe the impact of falls and common intrinsic and extrinsic risk factors.",
    "Explain how fall-risk screening and care plans guide individualized interventions.",
    "Apply universal fall precautions and purposeful rounding in daily care.",
    "Respond safely to a fall: assess, call for help, do not move an injured person, and document.",
    "Participate in a post-fall huddle to identify root causes.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "s. 400.211, F.S.", title: "Nursing home CNA in-service topics including fall risk", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0400/Sections/0400.211.html" },
    { agency: "CMS", citation: "42 CFR 483.25(d)", title: "Accidents — environment and supervision (long-term care)", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-B/section-483.25" },
  ],
  sourceReferences: [
    { title: "Older Adult Falls: Facts About Falls", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/falls/data-research/facts-stats/index.html", accessedOn: ACCESSED },
    { title: "STEADI — Stopping Elderly Accidents, Deaths & Injuries", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/steadi/index.html", accessedOn: ACCESSED },
    { title: "Preventing Falls in Hospitals: A Toolkit for Improving Quality of Care", publisher: "Agency for Healthcare Research and Quality", url: "https://www.ahrq.gov/patient-safety/settings/hospital/fall-prevention/toolkit/index.html", accessedOn: ACCESSED },
    { title: "The Falls Management Program: A Quality Improvement Initiative for Nursing Facilities", publisher: "Agency for Healthcare Research and Quality", url: "https://www.ahrq.gov/patient-safety/settings/long-term-care/resource/injuries/fallspx/index.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Why people fall",
      summary: "Impact and risk factors.",
      lessons: [
        text("Risk factors", 8, `According to CDC, about **one in four** U.S. adults aged 65 and older reports falling each year, and falls are the **leading cause of injury and injury death** among older adults. A fall can cause fractures (especially hip), head injury, fear of falling and loss of independence.

| Intrinsic (person) factors | Extrinsic (environment/care) factors |
|---|---|
| History of falls | Wet or cluttered floors, poor lighting |
| Muscle weakness, gait or balance problems | Beds too high, unlocked wheels |
| Dizziness or **orthostatic hypotension** (BP drops on standing) | Call light or belongings out of reach |
| Cognitive impairment, delirium | Improper footwear (socks without grip, loose slippers) |
| Urgency or frequent toileting | Unfamiliar surroundings, new admission or transfer |
| Vision problems | Tubing, cords, restraints |
| **Medications**: sedatives, sleep aids, opioids, antipsychotics, antidepressants, blood pressure medications, diuretics | Delayed response to call lights |

Many falls happen during **toileting** or when a person tries to get up alone at night.`),
      ],
    },
    {
      title: "2. Assessing risk",
      summary: "Screening and individualized care plans.",
      lessons: [
        text("Screening and care planning", 8, `Facilities screen for fall risk on admission, after a fall, after a change in condition and at intervals set by policy, using a tool such as the **Morse Fall Scale** (hospitals) or a facility assessment. CDC's **STEADI** approach asks three key questions:
1. Have you fallen in the past year?
2. Do you feel unsteady when standing or walking?
3. Do you worry about falling?

Screening is only useful if it leads to **individualized interventions** in the care plan, for example: toileting schedule, physical therapy, vision check, medication review by the prescriber/pharmacist, low bed, hip protectors, or supervised walking. Know the interventions for each person you care for, and **report changes** — new weakness, confusion, dizziness — that increase risk.

> Bed and chair alarms alert staff but do not prevent falls by themselves, and frequent false alarms cause alarm fatigue. They work only when staff respond promptly and the root cause (e.g., need to toilet) is addressed.`),
        check("Check your understanding: risk", [
          kc("fp1", "Which is a STEADI screening question?", ["Do you take vitamins?", "Do you feel unsteady when standing or walking?", "How many children do you have?", "Do you like the food?"], 1, "STEADI asks about prior falls, unsteadiness and fear of falling."),
          kc("fp2", "Which medications commonly increase fall risk?", ["Sleep aids", "Opioids", "Blood pressure medicines", "Topical skin moisturizer"], [0, 1, 2], "Sedating and blood pressure–lowering medications increase risk; report new dizziness to the nurse."),
        ]),
      ],
    },
    {
      title: "3. Everyday prevention",
      summary: "Universal precautions and purposeful rounding.",
      lessons: [
        text("Universal fall precautions", 9, `Apply these for **everyone**, every time:
- **Call light and personal items within reach**; teach and check that the person can use the call light.
- **Bed in the lowest position**, wheels locked; chair and wheelchair brakes on during transfers.
- **Non-skid footwear** that fits; avoid loose slippers or socks without grips.
- **Clear pathways**: no clutter, cords or spills; clean up spills immediately and use signs.
- **Adequate lighting**, including night lights.
- **Assistive devices** (walker, cane) within reach and used correctly.
- **Help with toileting** on a schedule if needed.

### Purposeful rounding
Check on each person regularly (often hourly in hospitals) and address the **"4 Ps"**: **Pain, Position, Potty (toileting), Possessions** (call light, glasses, water, phone). Before leaving, ask: "Is there anything else I can do for you? I have time."

### Safe mobility
Encourage activity — immobility weakens muscles and increases future falls. Use gait belts and lift equipment as trained; have the person **sit at the edge of the bed for a moment** before standing to reduce dizziness.`),
      ],
    },
    {
      title: "4. After a fall",
      summary: "Immediate response and the post-fall huddle.",
      lessons: [
        text("Responding to a fall", 9, `If you find someone on the floor or witness a fall:
1. **Stay with the person and call for help** (licensed nurse or per policy). Do not leave them alone.
2. **Do not move or lift** the person until a licensed nurse or emergency responder has assessed for injury — especially if there is head, neck or back pain, deformity, bleeding, or the person cannot move a limb. Call **911** for serious injury or unresponsiveness.
3. Keep them warm and comfortable; reassure them.
4. Use proper **lift equipment** to get the person up once cleared — never lift alone.
5. Monitor as directed: people who hit their head — especially those on **anticoagulants** — need neurological checks because bleeding in the brain can appear hours later.
6. **Document facts**: time found, position, what the person said, injuries observed, who was notified. Complete an incident report.
7. Notify family and the practitioner per policy.

### Post-fall huddle
Soon after the fall, the team (including the person if able) asks: **What was different this time? What was the person trying to do? Why?** Then updates the care plan — for example, a toileting schedule if they were trying to reach the bathroom.`),
        check("Check your understanding: after a fall", [
          kc("fp3", "You find a resident on the floor complaining of hip pain. What should you do first?", ["Help her back to bed quickly", "Stay with her, call for the nurse and do not move her until assessed", "Give her pain medication", "Leave to get the lift"], 1, "Moving a person with a possible fracture can worsen injury; call for help and stay."),
          kc("fp4", "Why are neurological checks important after a head strike in someone taking an anticoagulant?", ["They are not needed", "Bleeding inside the skull can develop hours later", "To check vision only", "Because they are required for billing"], 1, "Anticoagulants increase the risk of delayed intracranial bleeding."),
        ]),
      ],
    },
    {
      title: "5. Putting it together",
      summary: "Case study.",
      lessons: [
        caseStudy("Case study: the 2 a.m. bathroom trip", 8, `**Situation (fictional).** Mr. D., 82, has mild dementia and takes a diuretic in the morning and a sleep aid at bedtime. He was admitted to a nursing home two days ago. At 2 a.m. he is found on the floor beside his bed, barefoot, saying he "had to go." The call light was clipped to the curtain out of reach. A bed alarm sounded, but staff were in another room.

**Discussion:**
1. Identify the risk factors. *(New environment, dementia, sleep aid, urgency, bare feet, call light out of reach, delayed response.)*
2. What is the immediate response? *(Stay, call the nurse, no moving until assessed, check for head strike, document.)*
3. What might the post-fall huddle change? *(Scheduled toileting before bed and during the night; bedside commode; call light within reach; non-skid socks; ask the prescriber/pharmacist to review the sleep aid and diuretic timing; night light.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Fall Prevention — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("According to CDC, about what share of adults aged 65+ report falling each year?", ["1 in 100", "1 in 4", "3 in 4", "All of them"], 1, "About one in four older adults reports a fall each year."),
      ms("Which are extrinsic (environmental) fall risk factors? (Select all that apply.)", ["Wet floors", "Bed left in a high position", "Call light out of reach", "History of falls"], [0, 1, 2], "History of falls is an intrinsic (person) factor."),
      mc("What are the '4 Ps' of purposeful rounding?", ["Pain, Position, Potty, Possessions", "Pulse, Pressure, Pain, Pills", "Plan, Prepare, Perform, Present", "Posture, Pace, Pause, Position"], 0, "Addressing these needs proactively prevents unassisted attempts to get up."),
      tf("Bed alarms prevent falls by themselves, so they replace rounding.", false, "Alarms only alert staff; prevention requires timely response and addressing needs."),
      mc("Which footwear is safest?", ["Loose slippers", "Socks without grips", "Well-fitting non-skid footwear", "Bare feet"], 2, "Non-skid, well-fitting footwear reduces slips."),
      sc("You witness a resident fall and she says her neck hurts. What should you do?", ["Help her stand to check if she can walk", "Keep her still, stay with her and call for the nurse/911 as indicated", "Put a pillow under her head and leave to get help", "Ask her to roll over"], 1, "Possible spinal injury: do not move; call for help."),
      mc("Orthostatic hypotension means:", ["High blood pressure at night", "A drop in blood pressure when standing up", "Low blood sugar", "A fast pulse during sleep"], 1, "BP drops on standing can cause dizziness and falls."),
      tf("After a fall, the person should be lifted by one staff member as quickly as possible to prevent embarrassment.", false, "Wait for assessment and use proper lift equipment and enough staff."),
      mc("A post-fall huddle primarily aims to:", ["Assign blame", "Identify what happened and why, and update the care plan", "Complete billing", "Notify the media"], 1, "Huddles focus on root causes and prevention."),
      ms("Which interventions might address falls related to toileting? (Select all that apply.)", ["Scheduled toileting", "Bedside commode", "Night light", "Restricting all fluids"], [0, 1, 2], "Restricting fluids risks dehydration; it is not an appropriate fall intervention."),
      mc("Before standing from bed, a person at risk for dizziness should:", ["Stand up quickly", "Sit at the edge of the bed for a moment first", "Hold their breath", "Use a chair with wheels unlocked"], 1, "Sitting first allows blood pressure to adjust."),
      tf("Reporting new confusion or weakness can help prevent falls.", true, "Changes in condition increase fall risk and need prompt assessment."),
      mc("Which person needs neurological monitoring after hitting their head?", ["Only people who lose consciousness", "Anyone who hits their head, especially those on anticoagulants, per policy", "No one if they say they feel fine", "Only children"], 1, "Delayed bleeding is a risk, particularly with anticoagulants."),
      sc("A resident repeatedly tries to get up alone. The team considers restraints. Best approach?", ["Use a lap belt to keep him seated", "Identify why he gets up and address it (toileting, pain, boredom) with individualized interventions", "Sedate him at night", "Keep him in bed all day"], 1, "Restraints increase injury risk and violate rights; address the cause."),
      mc("Which documentation is appropriate after finding a resident on the floor?", ["\"Resident fell because she is careless.\"", "Time found, position, what she said, injuries observed and who was notified", "Nothing if there was no injury", "Only the incident report number"], 1, "Objective facts support care and investigation."),
    ],
  },
};
