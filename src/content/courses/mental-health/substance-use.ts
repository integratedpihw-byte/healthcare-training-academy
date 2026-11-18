import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, CFR_PART_2, FS_381_887, SAMHSA_RECOVERY, SCOPE_NOTICE } from "./_shared";

export const substanceUse: CourseContent = {
  code: "CHITA-MH-004",
  title: "Behavioral Health and Substance Use: Overdose Response, Harm Reduction and Recovery (Intermediate)",
  categorySlug: "mental-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 155,
  clinicalReviewRequired: true,
  programClassification: "GENERAL_EDUCATION",
  certificateType: "SPECIALIZED_TRAINING",
  credentialNotice: `${SCOPE_NOTICE} It is not addiction counselor, peer specialist or prevention credential training. Naloxone practice uses a training device; follow your organization's protocol and the product's instructions in a real emergency.`,
  instructorResources: "Use a naloxone nasal spray training device for the COMP-MH-NALOXONE skills checklist. Invite a certified peer recovery specialist to discuss recovery and stigma. Share your county's harm reduction and treatment resources as a Download lesson.",
  competencyCodes: ["COMP-MH-NALOXONE"],
  description:
    "Foundations of substance use and co-occurring conditions for health and social service workers: substance use disorders; opioid, alcohol and stimulant use disorders; co-occurring mental health conditions; harm reduction principles; overdose recognition; naloxone awareness and use; evidence-based treatment, including medications; recovery support and relapse prevention; and community resources in Florida.",
  targetAudience: "Health care, home care, residential, social service, outreach and public health staff.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Naloxone response is evaluated separately by simulation.",
  objectives: [
    "Describe substance use disorders as treatable medical conditions and use non-stigmatizing language.",
    "Describe the main features and risks of opioid, alcohol and stimulant use disorders.",
    "Explain co-occurring disorders and integrated care.",
    "Apply harm reduction principles.",
    "Recognize an overdose and respond, including with naloxone.",
    "Describe evidence-based treatment, recovery support and relapse prevention, and connect people to resources.",
  ],
  regulatoryReferences: [FS_381_887, CFR_PART_2],
  sourceReferences: [
    SAMHSA_RECOVERY,
    { title: "Substance Use Disorder Treatment Options", publisher: "Substance Abuse and Mental Health Services Administration", url: "https://www.samhsa.gov/substance-use/treatment/options", accessedOn: ACCESSED },
    { title: "Drug Facts: Fentanyl", publisher: "National Institute on Drug Abuse", url: "https://nida.nih.gov/publications/drugfacts/fentanyl", accessedOn: ACCESSED },
    { title: "FindTreatment.gov", publisher: "Substance Abuse and Mental Health Services Administration", url: "https://findtreatment.gov/", accessedOn: ACCESSED },
    { title: "FDA Approves First Over-the-Counter Naloxone Nasal Spray (March 29, 2023)", publisher: "U.S. Food and Drug Administration", url: "https://www.fda.gov/news-events/press-announcements/fda-approves-first-over-counter-naloxone-nasal-spray", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Understanding substance use disorders",
      summary: "A treatable medical condition; language matters.",
      lessons: [
        text("Substance use disorders", 14, `A **substance use disorder (SUD)** is a treatable medical condition in which a person keeps using alcohol or drugs despite significant problems. Clinicians use criteria in four broad groups:
- **Impaired control** — using more or longer than intended, wanting but failing to cut down, spending a lot of time getting, using or recovering, cravings
- **Social problems** — failing to meet obligations, relationship problems, giving up activities
- **Risky use** — using in dangerous situations, continuing despite physical or psychological harm
- **Physical dependence** — tolerance and withdrawal (these alone, when a medicine is taken as prescribed, do not mean a disorder)

Severity ranges from mild to severe based on how many criteria are present. Only qualified clinicians diagnose.

### Why it happens
Genetics, trauma and adverse childhood experiences, mental health conditions, early use, stress, availability and social environment all affect risk. Repeated use changes brain circuits for reward, stress and self-control, which is why stopping is hard.

### Language matters
| Avoid | Use |
|---|---|
| addict, junkie, alcoholic | person with a substance use disorder; person who uses drugs |
| clean / dirty (tests) | negative / positive; in recovery |
| substance abuse | substance use, misuse, substance use disorder |
| relapse = failure | return to use; part of many recovery journeys |`),
        check("Check your understanding: SUD", [
          kc("su1", "Which phrase is non-stigmatizing?", ["\"He's an addict.\"", "\"He is a person with a substance use disorder.\"", "\"Her test was dirty.\"", "\"She's a junkie.\""], 1, "Person-first language reduces stigma."),
          kc("su2", "Tolerance and withdrawal from a medicine taken exactly as prescribed:", ["Always mean a substance use disorder", "Do not by themselves mean a substance use disorder", "Never happen", "Mean the person is lying"], 1, "Physical dependence is not the same as SUD."),
        ]),
      ],
    },
    {
      title: "2. Opioids, alcohol and stimulants",
      summary: "Key risks and effective treatments.",
      lessons: [
        text("Opioid use disorder", 14, `Opioids include prescription pain relievers (oxycodone, hydrocodone, morphine), heroin and **fentanyl**. Fentanyl is a synthetic opioid similar to morphine but 50 to 100 times more potent (NIDA); illegally made fentanyl is often mixed into other drugs or pressed into counterfeit pills, so people may not know they are taking it.

**Risks:** overdose (breathing slows or stops), especially after a period of not using (lower tolerance — for example after detox, treatment or jail), when mixing with alcohol or sedatives such as benzodiazepines, or when using alone.

**Effective treatment:** FDA-approved **medications for opioid use disorder** — **methadone**, **buprenorphine** and **naltrexone** — combined with counseling and support as needed. These medications reduce cravings, return to use and overdose deaths. Taking them is **treatment, not "replacing one drug with another."**

**Withdrawal** (aches, sweating, diarrhea, anxiety, cravings) is very uncomfortable; medical support is available.`),
        text("Alcohol and stimulant use disorders", 14, `### Alcohol use disorder (AUD)
- Risks: injuries, liver disease, heart problems, several cancers, depression, interactions with medicines, and alcohol poisoning.
- **Withdrawal can be dangerous**: tremors, sweating, anxiety, hallucinations, **seizures** and delirium tremens. People who drink heavily should not stop suddenly without medical guidance.
- Treatment: counseling, mutual-help groups, and FDA-approved medications (**naltrexone, acamprosate, disulfiram**).

### Stimulant use disorders
Cocaine and methamphetamine (and misuse of prescription stimulants).
- Effects: energy, alertness, euphoria; then crash, depression, sleep problems.
- Risks: heart attack, stroke, seizures, overheating, paranoia and psychosis; unintentional fentanyl exposure from contaminated supply.
- Treatment: behavioral therapies such as **contingency management** and cognitive behavioral therapy. There are currently no FDA-approved medications specifically for stimulant use disorder.`),
        check("Check your understanding: substances", [
          kc("su3", "Which are FDA-approved medications for opioid use disorder?", ["Methadone, buprenorphine and naltrexone", "Antibiotics", "Insulin and metformin", "There are none"], 0, "These medications save lives."),
          kc("su4", "Why should a person who drinks heavily not stop suddenly without medical guidance?", ["Withdrawal can cause seizures and delirium tremens", "It is illegal", "It has no effect", "They will gain weight"], 0, "Alcohol withdrawal can be life-threatening."),
          kc("su5", "Overdose risk is higher after a period of not using because:", ["Tolerance drops", "Drugs get weaker", "It is safer then", "Naloxone stops working"], 0, "Lower tolerance raises overdose risk."),
        ]),
      ],
    },
    {
      title: "3. Co-occurring conditions and harm reduction",
      summary: "Integrated care and meeting people where they are.",
      lessons: [
        text("Co-occurring mental health conditions", 10, `Mental health conditions and substance use disorders often occur together. Either can come first; each can worsen the other. People may use substances to cope with symptoms such as anxiety, trauma memories or insomnia.

- **Integrated care** — treating both at the same time, by a coordinated team — works better than treating one and ignoring the other.
- "No wrong door": wherever someone asks for help, connect them to care for both.
- Watch for higher suicide risk when depression and substance use occur together; ask directly and connect to help (988).`),
        text("Harm reduction principles", 12, `**Harm reduction** is a public health approach that reduces the negative consequences of drug use, meets people "where they are," and treats them with dignity, without requiring abstinence first. It works alongside prevention, treatment and recovery.

### Principles
- Every life has value; keep people alive so recovery is possible.
- Respect autonomy and choice; avoid judgment and coercion.
- Any positive change counts.
- Involve people who use drugs in planning services.
- Address social conditions (housing, poverty, trauma) that increase harm.

### Common strategies
- **Naloxone** distribution and training
- **Never use alone**; go slow; test a small amount
- **Fentanyl test strips** (decriminalized in Florida in 2023) to check drugs for fentanyl
- Sterile syringe services where legally authorized
- Safer sex supplies, vaccination, HIV and hepatitis C testing and treatment
- Linkage to treatment, including medications, whenever the person is ready`),
        check("Check your understanding: harm reduction", [
          kc("su6", "Harm reduction:", ["Requires abstinence before any help", "Reduces negative consequences of drug use and meets people where they are", "Encourages drug use", "Is illegal in Florida"], 1, "It keeps people alive and connected to care."),
        ]),
      ],
    },
    {
      title: "4. Overdose recognition and naloxone",
      summary: "Recognize, call, give naloxone, support breathing, stay.",
      lessons: [
        text("Responding to an overdose", 16, `### Recognize an opioid overdose
- Unresponsive or cannot be woken
- Slow, shallow or no breathing; snoring or gurgling sounds
- Pinpoint pupils
- Blue, gray or pale lips and fingertips; cold, clammy skin

### Respond
1. **Check responsiveness:** shout the person's name; rub knuckles firmly on the breastbone.
2. **Call 911.**
3. **Give naloxone:** for nasal spray, lay the person on their back, tilt the head back, insert the nozzle into one nostril and press the plunger.
4. **Support breathing:** give rescue breaths or CPR as trained.
5. **Recovery position** if breathing: on their side, top knee bent, head supported.
6. **Second dose** if there is no response in 2–3 minutes (product instructions).
7. **Stay** until EMS arrives. Naloxone may wear off in 30–90 minutes, and overdose can return, especially with potent opioids.

### Naloxone facts
- The FDA approved 4 mg naloxone nasal spray for over-the-counter use in March 2023.
- Florida's s. 381.887 authorizes a patient or caregiver who has naloxone to administer it, when a physician is not immediately available, to a person believed in good faith to be experiencing an opioid overdose.
- Naloxone only reverses opioids. It is safe to give if you are unsure, and it may cause sudden withdrawal (agitation, vomiting).
- Keep naloxone where people who use opioids, or their families, can reach it. Check expiration dates.

### Mixed overdoses
Stimulants, alcohol or sedatives may also be involved. Always call 911.`),
        check("Check your understanding: naloxone", [
          kc("su7", "After giving nasal naloxone, there is no response in 2–3 minutes. You should:", ["Give up", "Give a second dose per product instructions and continue supporting breathing", "Shake the person hard", "Give coffee"], 1, "A second dose may be needed."),
          kc("su8", "Naloxone works on:", ["All drugs", "Opioids only", "Alcohol only", "Stimulants only"], 1, "It reverses opioids; it is safe if unsure."),
        ]),
      ],
    },
    {
      title: "5. Recovery, relapse prevention and resources",
      summary: "Supporting the long road and connecting people to help.",
      lessons: [
        text("Recovery support and relapse prevention awareness", 12, `SAMHSA's working definition of recovery is a process of change through which individuals improve their health and wellness, live a self-directed life, and strive to reach their full potential — supported by **health, home, purpose and community**. There are **many pathways**: medications, counseling, mutual-help groups, faith-based approaches, peer recovery support, and family support.

### Supporting recovery
- Show respect and hope; avoid shame.
- Encourage connection to treatment, medications, peers and community.
- Help with practical barriers: transportation, appointments, housing, employment, ID documents.
- Support healthy routines, sleep and stress management.

### Relapse (return to use) awareness
Return to use is common in chronic conditions and is not failure. Warning signs may include stress, isolation, skipping supports, romanticizing past use, contact with people or places linked to use, and untreated mental health symptoms. Encourage the person's own relapse prevention plan and quick reconnection with support. After a period of not using, **overdose risk is higher** — share naloxone and harm reduction information.`),
        text("Community resources in Florida", 8, `- **911** for overdose or medical emergency
- **988** Suicide & Crisis Lifeline (call or text) — includes substance use crises
- **SAMHSA National Helpline:** 1-800-662-HELP (4357), free, confidential, 24/7 treatment referral
- **FindTreatment.gov** to locate treatment, including medications for opioid use disorder
- **Florida 2-1-1** for local services
- County health departments and community organizations for naloxone, testing and harm reduction services
- Mutual-help and peer recovery groups

Follow your organization's referral process and confidentiality rules (including 42 CFR Part 2 for SUD treatment records).`),
        caseStudy("Case study: Angela after detox", 12, `**Situation (fictional).** Angela, 31, completed a 7-day detox for opioid use disorder and returned home yesterday. You are her home care aide for a leg wound. She says she wants to stay off drugs, but her friend who still uses is visiting tonight. She did not start medication after detox.

**Discuss:**
1. What risks do you notice? *(Lower tolerance after detox; contact with someone who uses; no medication for OUD.)*
2. How can you respond without judgment? *("It sounds like staying off drugs really matters to you. Some people find medication like buprenorphine helps with cravings — would you like help talking to your doctor or finding a program?")*
3. What harm reduction information is appropriate? *(Naloxone in the home and how to use it; never use alone; overdose risk is higher now.)*
4. What do you report? *(Her goals and concerns, and that she may benefit from a referral, to your supervisor and nurse per policy, respecting confidentiality.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Behavioral Health and Substance Use — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      tf("A substance use disorder is a treatable medical condition.", true, "SUD is treatable; recovery is possible."),
      mc("Which language is preferred?", ["\"Addict\"", "\"Person with a substance use disorder\"", "\"Junkie\"", "\"Dirty test\""], 1, "Person-first language reduces stigma."),
      mc("Fentanyl is dangerous partly because:", ["It is weak", "It is very potent and often mixed into other drugs without people knowing", "It cannot cause overdose", "Naloxone never works on it"], 1, "Contaminated supply increases overdose risk."),
      mc("Medications for opioid use disorder:", ["Replace one addiction with another", "Are evidence-based treatment that reduces overdose deaths", "Are illegal", "Only work for alcohol"], 1, "MOUD is effective treatment."),
      mc("Which FDA-approved medications treat alcohol use disorder?", ["Naltrexone, acamprosate, disulfiram", "Methadone only", "Antibiotics", "None exist"], 0, "Three FDA-approved options."),
      mc("Severe alcohol withdrawal can cause:", ["Only mild headache", "Seizures and delirium tremens", "Improved sleep immediately", "No symptoms"], 1, "It can be life-threatening."),
      mc("Contingency management is a treatment approach often used for:", ["Stimulant use disorder", "Broken bones", "Diabetes", "Hearing loss"], 0, "It is one of the most effective approaches for stimulant use disorder."),
      mc("Co-occurring disorders are best treated:", ["One at a time, years apart", "Together in an integrated, coordinated way", "Only with medication", "Never"], 1, "Integrated care improves outcomes."),
      ms("Which are harm reduction strategies? (Select all that apply.)", ["Naloxone distribution", "Fentanyl test strips", "Never using alone", "Refusing services unless the person is abstinent"], [0, 1, 2], "Requiring abstinence first is not harm reduction."),
      mc("Fentanyl test strips in Florida:", ["Remain illegal paraphernalia", "Were decriminalized in 2023", "Are only for police", "Do not exist"], 1, "SB 164 (2023) removed them from banned paraphernalia."),
      ms("Signs of opioid overdose include: (Select all that apply.)", ["Pinpoint pupils", "Slow or stopped breathing", "Blue or gray lips", "Hyperactivity"], [0, 1, 2], "Opioids depress breathing."),
      mc("The first steps when you find someone unresponsive with slow breathing are:", ["Leave and get help tomorrow", "Try to wake them, call 911, and give naloxone if available", "Put them in a cold bath", "Give them coffee"], 1, "Recognize, call, give naloxone, support breathing."),
      mc("Why stay with someone after naloxone revives them?", ["Naloxone may wear off before the opioid and overdose can return", "To make an arrest", "It is not necessary", "To give a second opioid"], 0, "Monitor until EMS arrives."),
      mc("Returning to use after a period of recovery:", ["Means treatment failed forever", "Is common and is a time of higher overdose risk; reconnect with support quickly", "Never happens", "Should be punished"], 1, "Respond with support and harm reduction."),
      sc("A client says she wants to stop using opioids but is afraid of withdrawal. What is the best response?", ["\"Just quit cold turkey.\"", "Listen, affirm her goal, and offer to help connect her with a provider about medication and support", "Tell her family", "Ignore it"], 1, "Connect to evidence-based treatment."),
    ],
  },
};
