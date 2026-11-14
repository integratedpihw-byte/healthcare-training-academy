import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const vitalSigns: CourseContent = {
  code: "CHTA-CP-001",
  title: "Vital Signs: Measurement, Accuracy and Reporting",
  categorySlug: "clinical-patient-care",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "No regulatory interval; skills competency is verified by an evaluator per facility policy.",
  estimatedMinutes: 60,
  clinicalReviewRequired: true,
  description:
    "How to measure temperature, pulse, respirations, blood pressure and oxygen saturation accurately in adults, what typical adult ranges look like, common sources of error, and when and how to report abnormal or changed findings. Reporting thresholds are set by the person's care plan, the prescriber and facility policy — this course teaches you to recognize and escalate, not to diagnose or treat.",
  targetAudience: "Certified nursing assistants, medical assistants, patient care technicians, home health aides, ALF caregivers who take vital signs, and new nurses.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Hands-on measurement skills must be observed and signed off by a qualified evaluator before independent practice.",
  objectives: [
    "Measure temperature, pulse, respirations, blood pressure and SpO₂ using correct technique.",
    "State typical adult ranges and recognize findings outside them.",
    "Identify common sources of measurement error, including cuff size and positioning.",
    "Explain limitations of pulse oximetry, including reduced accuracy in some people with darker skin pigmentation.",
    "Report abnormal or changed findings promptly using SBAR and document accurately.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    { title: "Understanding Blood Pressure Readings", publisher: "American Heart Association", url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings", accessedOn: ACCESSED },
    { title: "Measure Your Blood Pressure / Self-Measured Blood Pressure", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/high-blood-pressure/measure/index.html", accessedOn: ACCESSED },
    { title: "Pulse Oximeter Accuracy and Limitations: FDA Safety Communication", publisher: "U.S. Food and Drug Administration", url: "https://www.fda.gov/medical-devices/safety-communications/pulse-oximeter-accuracy-and-limitations-fda-safety-communication", accessedOn: ACCESSED },
    { title: "Vital Signs (Body Temperature, Pulse Rate, Respiration Rate, Blood Pressure)", publisher: "Johns Hopkins Medicine", url: "https://www.hopkinsmedicine.org/health/conditions-and-diseases/vital-signs-body-temperature-pulse-rate-respiration-rate-blood-pressure", accessedOn: ACCESSED },
    { title: "SBAR Tool: Situation-Background-Assessment-Recommendation", publisher: "Institute for Healthcare Improvement", url: "https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Why vital signs matter",
      summary: "Baselines, trends and early warning.",
      lessons: [
        text("Vital signs as early warning", 7, `Vital signs are objective measurements of the body's most basic functions. **Changes from a person's own baseline** are often the first sign of infection, dehydration, bleeding, heart problems or medication side effects — sometimes hours before other symptoms.

### Typical adult resting ranges (general reference)
| Measurement | Typical adult range |
|---|---|
| Temperature (oral) | about 97.8–99.1 °F (36.5–37.3 °C); varies by person, time of day and route |
| Pulse | 60–100 beats per minute |
| Respirations | 12–20 breaths per minute |
| Blood pressure | Normal: less than 120 systolic **and** less than 80 diastolic (AHA category) |
| Oxygen saturation (SpO₂) | usually 95–100% in healthy adults; targets may differ for people with lung disease |

Older adults may not mount a fever with serious infection; a **change** (e.g., temperature 2 °F above their usual) or new confusion can matter more than a number. Always follow the **reporting parameters** in the care plan or physician's orders.`),
      ],
    },
    {
      title: "2. Temperature, pulse and respirations",
      summary: "Technique and pitfalls.",
      lessons: [
        text("Measuring T, P and R", 10, `### Temperature
- Routes: **oral, tympanic (ear), temporal artery (forehead), axillary (armpit), rectal**. Use the route in policy; record the route.
- Oral: wait **15–30 minutes** after the person eats, drinks hot or cold fluids, or smokes (per device and policy).
- Axillary readings run lower and are less reliable; rectal readings run higher. Use probe covers and clean devices between people.

### Pulse
- Radial pulse is most common. Use **two fingers** (not your thumb, which has its own pulse).
- Count for **30 seconds × 2** if regular; count a **full 60 seconds** if irregular, or measure an **apical pulse** with a stethoscope when ordered.
- Note rhythm (regular/irregular) and strength (strong, weak, bounding).

### Respirations
- Count for a full **30–60 seconds** while appearing to still count the pulse — people change their breathing when they know it is being watched.
- Note depth, effort and sounds (wheezing, gurgling), and use of accessory muscles.`),
        check("Check your understanding: T, P, R", [
          kc("vs1", "A resident's radial pulse is irregular. How long should you count?", ["15 seconds × 4", "30 seconds × 2", "A full 60 seconds", "10 seconds × 6"], 2, "Irregular rhythms require a full minute (or an apical pulse if ordered)."),
          kc("vs2", "Why count respirations without telling the person?", ["To save time", "Because people often change their breathing when aware it is observed", "It is required by HIPAA", "So the count is lower"], 1, "Awareness alters breathing pattern and rate."),
        ]),
      ],
    },
    {
      title: "3. Blood pressure",
      summary: "Accurate measurement and categories.",
      lessons: [
        text("Getting an accurate blood pressure", 11, `### Preparation (AHA/CDC guidance)
- Person **rests 5 minutes**, seated, back supported, **feet flat** on the floor, legs uncrossed; empty bladder if possible.
- **No talking** during the measurement; avoid caffeine, exercise and smoking for 30 minutes before when possible.
- **Bare arm**, supported at **heart level**.
- **Correct cuff size**: the bladder should encircle about 80% of the upper arm. A cuff that is **too small reads falsely high**; too large can read falsely low.
- Do not use an arm with an IV, dialysis access (fistula/graft), or on the side of a mastectomy or lymphedema unless permitted.

### Categories for adults (American Heart Association)
| Category | Systolic | | Diastolic |
|---|---|---|---|
| Normal | < 120 | and | < 80 |
| Elevated | 120–129 | and | < 80 |
| High blood pressure stage 1 | 130–139 | or | 80–89 |
| High blood pressure stage 2 | ≥ 140 | or | ≥ 90 |
| **Severe / crisis range** | **> 180** | and/or | **> 120** |

A reading above 180/120 needs **prompt reporting**; with symptoms such as chest pain, shortness of breath, weakness, vision or speech changes, or severe headache, treat it as an **emergency** per policy.

**Low blood pressure** (e.g., systolic below 90, or a drop with dizziness when standing) also needs reporting — especially in older adults at risk of falls.`),
      ],
    },
    {
      title: "4. Pulse oximetry and reporting",
      summary: "SpO₂ limitations, SBAR and documentation.",
      lessons: [
        text("SpO₂, reporting and documentation", 10, `### Pulse oximetry
- Place the sensor on a warm finger; remove dark nail polish or artificial nails if they interfere; keep the hand still.
- Wait for a stable reading and a good waveform/signal.
- **Limitations**: cold hands, poor circulation, movement and bright light reduce accuracy. The FDA has reported that pulse oximeters may be **less accurate in people with darker skin pigmentation**, sometimes **overestimating** oxygen levels. **Never rely on the number alone** — report breathing difficulty, confusion or blue/gray lips or nail beds even if SpO₂ looks normal.

### Reporting with SBAR
- **S**ituation: "Mr. J in room 12 has a BP of 86/50 and is dizzy."
- **B**ackground: "He started a new blood pressure medicine yesterday; his usual BP is 130s/70s."
- **A**ssessment (what you observed): "He is pale and says he feels faint when he sits up."
- **R**equest: "Can you come assess him now?"

### Documentation
Record the **value, time, route/site, position** (e.g., sitting) and any action taken, immediately after measuring. Never estimate or copy previous values.`),
        check("Check your understanding: SpO₂ and reporting", [
          kc("vs3", "A resident's SpO₂ is 96% but she is breathing fast and her lips look dusky. What should you do?", ["Document 96% and continue", "Report immediately — symptoms matter even when the number looks normal", "Move the sensor until it reads 100%", "Wait one hour and recheck"], 1, "Pulse oximeters can overestimate; report concerning signs right away."),
          kc("vs4", "Which cuff error gives a falsely HIGH reading?", ["Cuff too large", "Cuff too small", "Arm at heart level", "Person seated quietly"], 1, "A cuff that is too small overestimates blood pressure."),
        ]),
      ],
    },
    {
      title: "5. Putting it together",
      summary: "Case study.",
      lessons: [
        caseStudy("Case study: \"just a little off\"", 8, `**Situation (fictional).** At 2 p.m., a CNA takes vital signs for Mrs. P., 88, in a nursing home: T 99.6 °F oral, P 108 regular, R 24, BP 102/58, SpO₂ 93% on room air. Her usual values are T 97.6, P 76, R 16, BP 128/72, SpO₂ 96%. She is more sleepy than usual and did not finish lunch.

**Discussion:**
1. Which values are changed from baseline? *(All of them — a pattern of higher temperature, pulse and breathing rate, with lower BP and SpO₂.)*
2. Does a temperature of 99.6 °F matter? *(Yes — it is 2 °F above her baseline, and older adults may not develop high fevers with infection.)*
3. What should the CNA do? *(Report immediately to the nurse using SBAR, recheck as directed, document values and observations.)*
4. Write an SBAR. *(S: Mrs. P is drowsier with P 108, R 24, BP 102/58, SpO₂ 93%. B: Usual P 76, BP 128/72; ate little lunch. A: Changed from baseline; she's hard to keep awake. R: Please assess her now.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Vital Signs — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("What is the typical resting pulse range for adults?", ["40–60", "60–100", "100–140", "12–20"], 1, "60–100 beats per minute is the typical adult resting range."),
      mc("What is the typical adult respiratory rate?", ["6–10", "12–20", "24–30", "60–100"], 1, "12–20 breaths per minute is typical."),
      mc("According to AHA categories, 134/84 is classified as:", ["Normal", "Elevated", "High blood pressure stage 1", "High blood pressure stage 2"], 2, "Systolic 130–139 or diastolic 80–89 is stage 1."),
      tf("A blood pressure cuff that is too small gives a falsely high reading.", true, "Undersized cuffs overestimate blood pressure."),
      mc("How long should a person rest before a blood pressure measurement?", ["No rest needed", "About 5 minutes", "30 minutes lying flat", "1 hour"], 1, "Five minutes of seated rest is recommended."),
      ms("Which improve blood pressure accuracy? (Select all that apply.)", ["Feet flat, legs uncrossed", "Arm supported at heart level", "Talking during the reading to relax the person", "Correct cuff size on a bare arm"], [0, 1, 3], "Talking raises blood pressure."),
      mc("Which arm should NOT be used for a blood pressure without permission?", ["The arm with a dialysis fistula", "The dominant arm", "The arm with a wristwatch removed", "Either arm of a healthy adult"], 0, "Avoid arms with dialysis access, IVs, or on the side of mastectomy/lymphedema."),
      tf("If the pulse is irregular, count it for a full 60 seconds.", true, "Irregular pulses need a full-minute count or an apical pulse."),
      sc("A resident's BP is 192/124 and he reports a severe headache and blurred vision. What should you do?", ["Recheck tomorrow", "Treat as an emergency per policy and notify the nurse immediately", "Give him water and document", "Use a larger cuff until the reading is lower"], 1, "Severely elevated BP with symptoms can be a hypertensive emergency."),
      mc("Why might SpO₂ readings be misleading in some people with darker skin pigmentation?", ["Pulse oximeters do not work on fingers", "Studies show oximeters may overestimate oxygen saturation", "They always read too low", "They measure blood pressure instead"], 1, "FDA has communicated reduced accuracy, often overestimation, in some people with darker skin."),
      mc("Which thumb fact is relevant to taking a pulse?", ["The thumb is most sensitive", "Your thumb has its own pulse and can cause a miscount", "Thumbs must be used for apical pulses", "It does not matter which finger"], 1, "Use the index and middle fingers."),
      tf("Older adults always develop a high fever when they have a serious infection.", false, "Older adults may have low-grade or no fever; changes from baseline and behavior matter."),
      mc("Which is the correct order of SBAR?", ["Summary, Background, Action, Result", "Situation, Background, Assessment, Recommendation/Request", "Symptoms, Blood pressure, Airway, Respirations", "Status, Baseline, Analysis, Report"], 1, "SBAR structures urgent communication."),
      sc("You took a BP but forgot the number before writing it down. What should you do?", ["Write the previous shift's value", "Estimate based on how the person looks", "Retake the measurement and document the actual value", "Leave it blank and say nothing"], 2, "Never estimate or copy values; remeasure."),
      mc("Which is best practice for oral temperature?", ["Measure right after a hot drink", "Wait about 15–30 minutes after eating or drinking per policy", "Use the same probe cover for several residents", "Record without the route"], 1, "Food and drink temporarily alter oral temperature."),
    ],
  },
};
