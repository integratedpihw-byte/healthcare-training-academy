import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, NOT_A_CREDENTIAL } from "./_shared";

export const specializedHomeHealth: CourseContent = {
  code: "CHITA-HH-006",
  title: "Specialized Home Health: Chronic Conditions, Disability and Older Adults",
  categorySlug: "home-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 155,
  clinicalReviewRequired: true,
  programClassification: "PROFESSION_SPECIFIC",
  certificateType: "SPECIALIZED_TRAINING",
  credentialNotice: `Awareness training for home care workers supporting people with chronic conditions. It does not teach nursing tasks such as adjusting insulin, oxygen settings or medicines; those stay with licensed staff. It can count toward in-service training hours when your employer approves it. ${NOT_A_CREDENTIAL}`,
  instructorResources: "Use the local care plan examples your agency serves most (for example heart failure, diabetes, COPD). Invite the nurse educator to review each patient-specific reporting limit, such as weight gain for heart failure, with aides.",
  competencyCodes: ["COMP-VS", "COMP-FALLS", "COMP-HHA-FEED"],
  description:
    "Awareness training for home care workers on the conditions they see most often: chronic disease basics, diabetes, high blood pressure and heart failure, HIV and viral hepatitis, COPD and home oxygen safety, supporting people with disabilities, fall prevention and the needs of older adults — with clear guidance on what to observe, report and leave to licensed staff.",
  targetAudience: "Home health aides, personal care assistants, CNAs and companions, as in-service or specialized training.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Explain how chronic diseases affect daily life and care at home.",
    "Recognize and report signs of low and high blood sugar and diabetic foot problems.",
    "Support people with high blood pressure and heart failure, including reporting weight and breathing changes.",
    "Use standard precautions and reduce stigma when caring for people with HIV or hepatitis.",
    "Support people with COPD and use home oxygen safely.",
    "Support people with disabilities and older adults with dignity and safety.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    { title: "Diabetes Basics", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/diabetes/about/index.html", accessedOn: ACCESSED },
    { title: "Low Blood Sugar (Hypoglycemia)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/diabetes/about/low-blood-sugar-hypoglycemia.html", accessedOn: ACCESSED },
    { title: "High Blood Pressure Symptoms and Causes", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/high-blood-pressure/about/index.html", accessedOn: ACCESSED },
    { title: "Heart Failure", publisher: "National Heart, Lung, and Blood Institute", url: "https://www.nhlbi.nih.gov/health/heart-failure", accessedOn: ACCESSED },
    { title: "COPD", publisher: "National Heart, Lung, and Blood Institute", url: "https://www.nhlbi.nih.gov/health/copd", accessedOn: ACCESSED },
    { title: "HIV Basics", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/hiv/about/index.html", accessedOn: ACCESSED },
    { title: "Viral Hepatitis", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/hepatitis/index.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Chronic disease awareness",
      summary: "Living with long-term conditions and the aide's role.",
      lessons: [
        text("Living with chronic conditions", 10, `Chronic diseases — such as heart disease, diabetes, lung disease, kidney disease, arthritis and dementia — last a year or more and need ongoing care or limit daily activities. Many home care patients live with several at once.

### How you help
- **Follow the care plan** for diet, activity, positioning and reporting limits.
- **Observe and report** changes early. Small changes (a little more swelling, slightly less appetite, more tiredness) are often the first signs of a flare-up that can be treated at home instead of in the hospital.
- **Encourage** the patient's self-care: taking medicines as prescribed (with assistance only as permitted), eating well, staying active as allowed, keeping appointments.
- **Listen** for worries, sadness or money problems that affect self-care, and report them.
- Stay within your role: you do not change medicines, diets or equipment settings.`),
        check("Check your understanding: chronic disease", [
          kc("sp1", "Why report small changes such as slightly more swelling?", ["They are never important", "They can be early signs of a flare-up that can be treated before hospitalization", "To fill the form", "The family requires it"], 1, "Early reporting prevents emergencies."),
        ]),
      ],
    },
    {
      title: "2. Diabetes",
      summary: "Blood sugar, foot care and what to report.",
      lessons: [
        text("Diabetes care fundamentals", 15, `**Diabetes** is a condition in which the body does not make enough insulin or cannot use it well, so blood sugar (glucose) rises. Over time it can damage the heart, kidneys, eyes, nerves and blood vessels.

### Low blood sugar (hypoglycemia) — can be an emergency
**Signs:** shaky, sweaty, fast heartbeat, dizzy, hungry, irritable, confused, blurred vision, sleepy; it can lead to seizures or unconsciousness.
**What to do:** follow the care plan. If the patient is awake and can swallow, the plan usually calls for a fast-acting sugar source (for example juice or glucose tablets) and rechecking as directed. **Call the nurse.** If the patient is unconscious or cannot swallow, **call 911** and do not give anything by mouth.

### High blood sugar (hyperglycemia)
**Signs:** very thirsty, urinating often, tired, blurred vision, headache; severe cases can cause nausea, vomiting, fruity breath and confusion — call the nurse; call 911 for severe symptoms.

### Your role
- Encourage meals and snacks on time and follow the meal plan.
- Report missed meals, vomiting or illness — these affect blood sugar and medicine needs.
- If a patient checks their own blood sugar, you may record the number they show you if your care plan allows; **do not adjust insulin or other medicines**.

### Foot care
Nerve damage can stop people from feeling cuts or blisters.
- Look at the feet daily (with permission): report cuts, blisters, redness, swelling, color change, drainage or sores.
- Wash and dry carefully, especially between the toes; apply lotion but not between the toes.
- Clean socks and well-fitting shoes; never barefoot.
- **Do not** cut toenails or remove corns or calluses unless the care plan and agency policy allow.`),
        check("Check your understanding: diabetes", [
          kc("sp2", "A patient with diabetes becomes shaky, sweaty and confused before lunch. What is most likely?", ["High blood sugar", "Low blood sugar", "Normal", "A cold"], 1, "These are classic signs of hypoglycemia; follow the care plan and call the nurse."),
          kc("sp3", "A diabetic patient is unresponsive. What do you do?", ["Give juice by mouth", "Call 911 and give nothing by mouth", "Let them sleep", "Give insulin"], 1, "Never put food or drink in the mouth of an unresponsive person."),
          kc("sp4", "Why check the feet of people with diabetes?", ["For cosmetic reasons", "Nerve damage may stop them feeling injuries that can become serious", "It is not needed", "To trim calluses"], 1, "Report any foot problem promptly."),
        ]),
      ],
    },
    {
      title: "3. High blood pressure and heart failure",
      summary: "Silent pressure and fluid build-up.",
      lessons: [
        text("Hypertension and heart failure awareness", 14, `### High blood pressure (hypertension)
High blood pressure often has **no symptoms**, which is why it is called a silent condition. Over time it raises the risk of heart attack, stroke, kidney disease and heart failure.
- Support the care plan: lower-sodium foods, activity as allowed, medicines as prescribed (assistance only as permitted), limiting alcohol, not smoking.
- Measure blood pressure only if trained and assigned; report readings outside the limits your nurse sets.
- **Call 911** for stroke signs (BE FAST) or chest pain.

### Heart failure
The heart does not pump as well as it should, so fluid can build up in the lungs and body.
**Report to the nurse promptly:**
- **Weight gain** above the limit your nurse gives (a common example is 2–3 pounds in a day or 5 pounds in a week — follow the care plan). Weigh at the same time each morning, after urinating, in similar clothing, on the same scale.
- More swelling in feet, ankles, legs or abdomen
- More shortness of breath, needing more pillows to sleep, waking up breathless, coughing
- Tiredness, dizziness, less urine
**Call 911** for severe shortness of breath, chest pain, fainting or pink frothy sputum.

**Support:** follow sodium and fluid limits exactly, elevate legs as directed, help the patient pace activities and rest.`),
        check("Check your understanding: heart", [
          kc("sp5", "Why is high blood pressure called a silent condition?", ["It makes no noise", "It often has no symptoms", "It always causes headaches", "It only occurs at night"], 1, "Many people feel nothing until damage is done."),
          kc("sp6", "A heart failure patient gained more weight overnight than the care plan limit. What should you do?", ["Nothing", "Report it to the nurse promptly", "Give an extra water pill", "Tell them to skip breakfast"], 1, "Rapid weight gain can mean fluid build-up."),
        ]),
      ],
    },
    {
      title: "4. HIV and viral hepatitis",
      summary: "Facts, standard precautions and stigma.",
      lessons: [
        text("HIV and hepatitis awareness", 14, `### HIV
HIV (human immunodeficiency virus) attacks the immune system. With effective treatment (antiretroviral therapy), people with HIV can live long, healthy lives, and people who take HIV medicine as prescribed and get and keep an **undetectable viral load** have effectively no risk of transmitting HIV to sexual partners (CDC).
- HIV is **not** spread by touching, hugging, sharing dishes, toilets, or caring for someone using standard precautions.
- At work, risk comes from exposure to blood or certain body fluids through needlesticks or mucous membranes — prevented by standard precautions.

### Viral hepatitis
- **Hepatitis A** — spread by food or water contaminated with stool; prevented by handwashing and vaccination.
- **Hepatitis B** — spread by blood and certain body fluids; a **vaccine** prevents it (offered by employers to workers with occupational exposure).
- **Hepatitis C** — spread mainly by blood; there is no vaccine, but curative treatment exists.

### Your role
- Use **standard precautions** for everyone — you should not treat people differently because of a diagnosis.
- **Confidentiality:** HIV status is especially protected in Florida (s. 381.004, F.S.). Never discuss it except with the care team as needed.
- **Respect and reduce stigma:** use person-first language ("a person with HIV"), avoid judgment, and treat everyone with the same care.
- Report signs of infection, weight loss, new rashes, mouth sores, or yellowing skin or eyes (jaundice).`),
        check("Check your understanding: HIV and hepatitis", [
          kc("sp7", "Can HIV be spread by sharing a toilet or dishes?", ["Yes", "No", "Only in Florida", "Only in hot weather"], 1, "HIV is not spread through casual contact."),
          kc("sp8", "Which hepatitis can be prevented with a vaccine offered by employers to exposed workers?", ["Hepatitis B", "Hepatitis C", "Neither", "Only hepatitis D"], 0, "There is no vaccine for hepatitis C."),
        ]),
      ],
    },
    {
      title: "5. Respiratory disease and oxygen safety",
      summary: "COPD, breathing difficulty and home oxygen.",
      lessons: [
        text("Respiratory disease awareness", 14, `### COPD
Chronic obstructive pulmonary disease (including emphysema and chronic bronchitis) makes it hard to breathe. Smoking is the main cause.
- Help the patient pace activities and rest; sitting upright or leaning forward may ease breathing.
- Encourage the **pursed-lip breathing** the care team teaches (breathe in through the nose, out slowly through pursed lips).
- Avoid smoke, strong scents, dust and aerosol sprays.

**Report:** more shortness of breath than usual, more coughing, change in color or amount of mucus, fever, swelling of the ankles, new confusion or sleepiness. **Call 911** for severe breathing difficulty, blue or gray lips, or chest pain.

### Home oxygen safety
Oxygen is a medicine. **Never change the flow rate** — only the prescriber can order a change.
- **No smoking, vaping, open flames, candles or gas stoves near oxygen.** Post "No smoking" signs. Keep oxygen equipment away from heat sources by at least the distance the supplier specifies.
- Do not use oil-based products (such as petroleum jelly) on the face or near the tubing; use water-based products as the care plan allows.
- Secure tanks upright so they cannot fall; store in a well-ventilated area.
- Keep tubing off walkways to prevent falls.
- Check that the tubing is not kinked and the nasal cannula is positioned in the nostrils; look for sore spots behind the ears and on the nose and report them.
- Know the supplier's contact number and the backup plan for power outages and hurricanes.`),
        check("Check your understanding: oxygen", [
          kc("sp9", "A patient asks you to turn up his oxygen because he feels short of breath. What do you do?", ["Turn it up a little", "Do not change the flow; check him, call the nurse, and call 911 if breathing is severe", "Turn it off", "Tell him to wait"], 1, "Only the prescriber orders flow changes."),
          kc("sp10", "Which is unsafe near home oxygen?", ["A water-based lip balm", "A lit candle", "Secured tanks", "Tubing kept off walkways"], 1, "Open flames are a serious fire risk."),
        ]),
      ],
    },
    {
      title: "6. Disability support and care for older adults",
      summary: "Dignity, independence and common risks in later life.",
      lessons: [
        text("Supporting people with disabilities", 12, `- **Person-first and respectful language:** "a person who uses a wheelchair" — or the person's preferred terms.
- **Ask before helping** and ask how they prefer to be helped. The person is the expert on their own needs.
- **Mobility equipment** (wheelchairs, walkers, scooters) is part of the person's personal space; do not move it out of reach.
- **Communication:** speak directly to the person, not to an interpreter or companion; allow extra time; use the person's communication method (sign language, communication boards, devices).
- **Intellectual and developmental disabilities:** clear, simple language; visual supports; consistent routines; respect choices and rights.
- **Service animals** are working animals — do not pet or distract them.
- Watch for and report signs of abuse, neglect or exploitation; people with disabilities are at higher risk.`),
        text("Care for older adults", 14, `### Common risks in later life
- **Falls** — the leading cause of injury in older adults. Use the fall prevention steps from the HHA and PCA courses; report dizziness, new medicines, unsteady walking and any fall.
- **Delirium** — sudden confusion is a medical issue; report it immediately.
- **Dehydration and malnutrition** — encourage fluids and meals; report weight loss and poor intake.
- **Skin breakdown** — reposition, keep skin clean and dry, report red areas.
- **Polypharmacy** — many medicines raise the risk of side effects and falls; report new symptoms.
- **Incontinence** — common but not normal; report new problems.
- **Sensory loss** — check glasses and hearing aids are clean and in use.
- **Depression and loneliness** — not a normal part of aging; report sadness, withdrawal or talk of suicide (988 Suicide & Crisis Lifeline; 911 for immediate danger).
- **Heat illness** — Florida heat is dangerous for older adults: keep the home cool, encourage fluids (within any fluid limit) and report dizziness, confusion or hot dry skin.

### Respect
Older adults are adults. Avoid "elderspeak" (baby talk, "sweetie," "honey"). Ask about their preferences and life experience.`),
        caseStudy("Case study: three patients, one afternoon", 15, `**Situation (fictional).** You care for three patients on your route today:

1. **Mr. Johnson**, 66, heart failure and diabetes. He tells you his shoes feel tight, he slept sitting up last night, and his scale shows 4 pounds more than yesterday. He skipped lunch and now looks pale and sweaty.
2. **Ms. Rivera**, 72, COPD on 2 liters of oxygen. Her grandson is lighting a cigarette in the living room near her oxygen concentrator.
3. **Mr. Kim**, 58, uses a wheelchair after a spinal cord injury and has a service dog. A visitor keeps petting the dog and moves his wheelchair to the hallway "to make room."

**Discuss what you would do and report for each patient.**
*(1: Possible fluid build-up and low blood sugar — follow the care plan for low blood sugar, call the nurse immediately, call 911 if he becomes confused or unresponsive. 2: Ask that the cigarette be put out and taken outside, away from oxygen; report the fire hazard. 3: Return his wheelchair within reach, politely ask the visitor not to distract the service dog, and respect Mr. Kim's wishes.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Specialized Home Health — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which is a sign of low blood sugar?", ["Very thirsty and urinating often", "Shaky, sweaty and confused", "Fruity breath only", "Increased appetite only"], 1, "These are typical signs of hypoglycemia."),
      mc("For an unconscious patient with diabetes, you should:", ["Give juice", "Call 911 and give nothing by mouth", "Give insulin", "Wait"], 1, "Nothing by mouth for unresponsive patients."),
      tf("Home care aides may adjust insulin doses if the blood sugar reading is high.", false, "Adjusting medicines is outside an aide's role."),
      mc("Which foot problem should be reported for a person with diabetes?", ["Clean, dry skin", "A blister or cut", "Lotion on the heels", "Clean socks"], 1, "Small injuries can become serious."),
      mc("High blood pressure is often called silent because:", ["It is rare", "It often causes no symptoms", "It only affects children", "It cannot be measured"], 1, "Regular checks matter."),
      ms("Which should be reported for a patient with heart failure? (Select all that apply.)", ["Weight gain above the care plan limit", "New or increased ankle swelling", "Needing more pillows to breathe at night", "A good appetite"], [0, 1, 2], "These can mean fluid build-up."),
      mc("Heart failure patients should be weighed:", ["At any random time", "At the same time each morning, after urinating, in similar clothing, on the same scale", "Only monthly", "After meals"], 1, "Consistency makes changes meaningful."),
      mc("HIV is NOT spread by:", ["Needlesticks with infected blood", "Sharing dishes or hugging", "Blood splashes into the eyes", "Sharing needles"], 1, "Casual contact does not spread HIV."),
      mc("Which hepatitis has a vaccine that employers offer to workers with occupational exposure?", ["Hepatitis B", "Hepatitis C", "Hepatitis E", "None"], 0, "OSHA requires the hepatitis B vaccine to be offered."),
      mc("Person-first language is:", ["\"The AIDS patient\"", "\"A person with HIV\"", "\"The diabetic\"", "\"The wheelchair-bound\""], 1, "Person-first language reduces stigma."),
      mc("Pursed-lip breathing helps people with:", ["Diabetes", "COPD", "Hearing loss", "Arthritis only"], 1, "It slows breathing and eases shortness of breath."),
      sc("A patient on home oxygen says, \"Turn it up, I can't breathe.\" What do you do?", ["Turn it up to the maximum", "Do not change the flow; help her sit up, call the nurse, and call 911 if breathing difficulty is severe", "Remove the oxygen", "Give her water and leave"], 1, "Oxygen is a prescribed medicine."),
      mc("Which is a safe practice with a service animal?", ["Petting it while it works", "Not distracting or petting it without permission", "Feeding it treats", "Moving it to another room"], 1, "Service animals are working."),
      mc("Sudden confusion in an older adult should be:", ["Ignored as normal aging", "Reported immediately as possible delirium", "Treated with coffee", "Reported next week"], 1, "Delirium needs prompt medical attention."),
      mc("Which helps prevent heat illness in older Florida patients?", ["Keeping windows closed with no cooling", "Keeping the home cool and encouraging fluids within any fluid limit", "Heavy blankets", "Limiting all drinks"], 1, "Older adults are vulnerable to heat."),
    ],
  },
};
