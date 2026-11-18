import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const phEmergencyResponse: CourseContent = {
  code: "CHITA-EM-005",
  title: "Public Health Emergency Response: Mass Dispensing, the Strategic National Stockpile and Responder Safety",
  categorySlug: "emergency-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 80,
  clinicalReviewRequired: true,
  description:
    "What public health workers do when a community needs medicines or vaccines fast: CDC's 15 public health emergency preparedness and response capabilities, the Strategic National Stockpile and how medical countermeasures reach the public, open and closed points of dispensing (PODs), working a POD station, volunteer management, and protecting your own health and safety as a responder.",
  targetAudience: "Health department staff, nurses, pharmacists, Medical Reserve Corps volunteers and closed-POD partners who may staff dispensing or vaccination operations.",
  prerequisites: ["CHITA-EM-001"],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Clinical tasks at a POD (screening decisions, dispensing, vaccination) also require your license or scope of practice, your agency's protocols and just-in-time training at the site.",
  objectives: [
    "Name the 15 CDC public health emergency preparedness and response capabilities and their purpose.",
    "Describe the Strategic National Stockpile and the path medical countermeasures take from the stockpile to the public.",
    "Compare open and closed points of dispensing and describe the stations of a typical POD.",
    "Explain how volunteers are registered, trained and managed during a response.",
    "Apply responder safety and health practices, including stress management, before, during and after deployment.",
  ],
  regulatoryReferences: [
    { agency: "Congress", citation: "42 U.S.C. 247d-6b", title: "Strategic National Stockpile (PHS Act sec. 319F-2)", url: "https://www.law.cornell.edu/uscode/text/42/247d-6b" },
  ],
  sourceReferences: [
    { title: "Public Health Emergency Preparedness and Response Capabilities: National Standards for State, Local, Tribal, and Territorial Public Health", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/readiness/php/capabilities/index.html", accessedOn: ACCESSED },
    { title: "Strategic National Stockpile — Jurisdictional Stockpile Program", publisher: "Administration for Strategic Preparedness and Response (HHS)", url: "https://www.aspr.gov/readiness-response/medical-countermeasures-biodefense/sns/training-preparedness-support/jurisdictional-stockpile", accessedOn: ACCESSED },
    { title: "Cities Readiness Initiative", publisher: "Florida Department of Health in Orange County", url: "https://orange.floridahealth.gov/programs-and-services/emergency-preparedness-and-response/cities-readiness-initiative/", accessedOn: ACCESSED },
    { title: "Emergency Responder Health Monitoring and Surveillance (ERHMS)", publisher: "CDC National Institute for Occupational Safety and Health", url: "https://www.cdc.gov/niosh/erhms/", accessedOn: ACCESSED },
    { title: "Stand Ready, Move Fast, Save Lives (ASPR overview of SNS and response programs)", publisher: "Administration for Strategic Preparedness and Response (HHS)", url: "https://www.aspr.gov/news-updates/blog/2025-12/stand-ready-move-fast-save-lives", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Public health preparedness capabilities",
      summary: "The national standards health departments plan against.",
      lessons: [
        text("CDC's 15 capabilities", 12, `In 2011 the CDC established **15 public health emergency preparedness and response capabilities** as national standards for state, local, tribal and territorial health departments. They were updated in 2018 (published as the 2019 edition) without changing the list. Health departments funded through CDC's **Public Health Emergency Preparedness (PHEP)** cooperative agreement plan, train and exercise against them.

| Domain | Capabilities |
|---|---|
| Community resilience | 1. Community Preparedness · 2. Community Recovery |
| Incident management | 3. Emergency Operations Coordination |
| Information management | 4. Emergency Public Information and Warning · 6. Information Sharing |
| Countermeasures and mitigation | 8. Medical Countermeasure Dispensing and Administration · 9. Medical Materiel Management and Distribution · 11. Nonpharmaceutical Interventions · 14. Responder Safety and Health |
| Surge management | 5. Fatality Management · 7. Mass Care · 10. Medical Surge · 15. Volunteer Management |
| Biosurveillance | 12. Public Health Laboratory Testing · 13. Public Health Surveillance and Epidemiological Investigation |

### What this means for you
Your health department's plans — and the drills you take part in — are organized around these capabilities. This course focuses on **capabilities 8, 9, 14 and 15**: getting medicines to people, managing the supplies, and keeping responders and volunteers safe and effective.

### Healthcare partners
Hospitals and healthcare coalitions plan against a companion set, ASPR's **Health Care Preparedness and Response Capabilities**. Public health and healthcare plans are meant to fit together.`),
        check("Check your understanding: capabilities", [
          kc("pe1", "How many CDC public health emergency preparedness and response capabilities are there?", ["5", "10", "15", "24"], 2, "There are 15 capabilities."),
          kc("pe2", "Which capability covers getting medicines or vaccines to the public in an emergency?", ["Fatality Management", "Medical Countermeasure Dispensing and Administration", "Community Recovery", "Information Sharing"], 1, "Capability 8 covers dispensing and administration."),
        ]),
      ],
    },
    {
      title: "2. The Strategic National Stockpile",
      summary: "How medical countermeasures reach your community.",
      lessons: [
        text("From the stockpile to the public", 12, `### What the SNS is
The **Strategic National Stockpile (SNS)** is the federal government's largest supply of emergency **medical countermeasures** — antibiotics, antivirals, vaccines, antitoxins, antidotes, personal protective equipment and other medical supplies — for public health emergencies so severe that local supplies could run out. It is managed by HHS's **Administration for Strategic Preparedness and Response (ASPR)**; responsibility moved from the CDC to ASPR in 2018.

The SNS includes products stored in secure warehouses, inventory held by vendors, and pre-positioned caches such as **CHEMPACK** containers of nerve-agent antidotes kept near hospitals and EMS agencies.

### How assets are requested and delivered
1. A local health department identifies a need beyond local supplies and requests help through the **state**.
2. The **state** requests SNS assets from the federal government.
3. Federal officials decide what to deploy.
4. SNS materiel is delivered to the state's **Receiving, Staging and Storage (RSS)** site.
5. The state distributes it to local health departments, hospitals and **points of dispensing**.
6. Local responders dispense or administer the countermeasures to the public.

### Speed matters
For some threats, such as an outdoor release of anthrax spores, people must start preventive antibiotics within about two days to have the best chance of protection. The CDC's **Cities Readiness Initiative (CRI)** helps large metropolitan areas plan to provide preventive medication to their **entire population within 48 hours** of a decision to do so. Florida's largest metropolitan areas take part.

### Managing the materiel
Medical materiel management means receiving, storing at the right temperature, tracking inventory (lot numbers and expiration dates), securing it, distributing it and accounting for what was used. Errors here can make medicine unusable or impossible to recall.`),
        check("Check your understanding: the SNS", [
          kc("pe3", "Which HHS component manages the Strategic National Stockpile?", ["CDC", "ASPR", "HRSA", "FDA"], 1, "ASPR has managed the SNS since 2018."),
          kc("pe4", "Who requests SNS assets from the federal government?", ["Individual citizens", "Each hospital directly", "The state", "Pharmaceutical companies"], 2, "Local needs go to the state, which requests federal assets."),
          kc("pe5", "The Cities Readiness Initiative plans to provide preventive medication to a metropolitan area's entire population within:", ["6 hours", "48 hours", "7 days", "30 days"], 1, "CRI's planning goal is 48 hours."),
        ]),
      ],
    },
    {
      title: "3. Points of dispensing",
      summary: "Open PODs, closed PODs and how a POD runs.",
      lessons: [
        text("Open and closed PODs", 14, `A **point of dispensing (POD)** is a site where medication or vaccine is given to a large number of people quickly.

### Open PODs
Open to the **general public**, run by the health department at places such as schools, community centers or fairgrounds. Most of the population is served through open PODs.

### Closed PODs
Run by a **partner organization** — for example, a large employer, university, hospital, nursing home or correctional facility — for its own employees, residents or members (and often their families). Closed PODs need an agreement with the health department in advance, a trained internal team and a plan. They reduce crowds at open PODs and help reach people who cannot easily travel.

### Dispensing models
- **Medical model** — includes clinical screening and assessment; used when the countermeasure or population requires it, such as vaccination.
- **Non-medical model** — streamlined screening with forms and algorithms; trained non-clinical staff can hand out pre-packaged medication under protocols, with clinicians available for people who are screened out. Used when speed is essential.
- **Head-of-household** pick-up lets one adult collect medication for family members to reduce crowding, where protocols allow.

### Typical POD stations
1. **Greeting and triage** — direct people, identify anyone who is ill (who should be sent for medical evaluation, not dispensing) and those needing help.
2. **Forms and screening** — collect information on allergies, medications, pregnancy, age and weight, using translated and easy-to-read forms.
3. **Medical evaluation** — clinicians see people who are screened out or have questions.
4. **Dispensing or vaccination**
5. **Exit and education** — written instructions in plain language and multiple languages, how to report side effects, and follow-up information.

### Access and functional needs
Plan for people who use mobility devices, are deaf or hard of hearing, are blind, have limited English proficiency, have cognitive disabilities or arrive with children. Provide seating, interpreters, large print and a fast lane where needed.

### Clinical and legal rules
Countermeasures may be given under **standing orders**, an **Emergency Use Authorization** or other emergency authorities. Follow your agency's protocols and your license or scope of practice; do not improvise dosing or screening decisions.`),
        check("Check your understanding: PODs", [
          kc("pe6", "A large employer agrees in advance to dispense medication to its own employees and their families. This is:", ["An open POD", "A closed POD", "A staging area", "An RSS site"], 1, "Closed PODs serve a defined population and need a prior agreement."),
          kc("pe7", "At greeting, a person arrives with fever and difficulty breathing. What should happen?", ["Send them through the dispensing line", "Direct them to medical evaluation rather than routine dispensing", "Ask them to come back tomorrow", "Give them extra medication"], 1, "Ill people need medical evaluation, not routine prophylaxis."),
          kc("pe8", "Which model lets trained non-clinical staff hand out pre-packaged medication under protocols when speed is essential?", ["Medical model", "Non-medical model", "Inpatient model", "Telehealth model"], 1, "The non-medical model is used for rapid dispensing, with clinicians available for those screened out."),
        ]),
      ],
    },
    {
      title: "4. Volunteers and responder safety",
      summary: "Managing helpers and protecting the people who respond.",
      lessons: [
        text("Volunteer management", 10, `### Registered volunteers
Spontaneous, unregistered volunteers are hard to verify, insure and assign. Health departments therefore recruit and pre-register volunteers through:
- The **Medical Reserve Corps (MRC)** — local units of medical and non-medical volunteers, supported nationally by ASPR.
- Each state's **Emergency System for Advance Registration of Volunteer Health Professionals (ESAR-VHP)**, which verifies licenses and credentials ahead of time.

### Managing volunteers during a response
- **Check in** and verify identity and credentials.
- Give **just-in-time training** for the specific task, plus a safety briefing.
- Assign within the person's training and license, under a supervisor (unity of command).
- Track hours and tasks, provide food, water and breaks, and **check out** at the end.
- Thank volunteers and offer a debrief; well-treated volunteers come back.`),
        text("Responder safety and health", 12, `Responders get hurt and sick during emergencies — from injuries, heat, infectious exposures, chemicals, fatigue and emotional stress. **Responder Safety and Health** is one of the 15 CDC capabilities.

### Before deployment
- Keep routine vaccinations current (for example, influenza, hepatitis B for those exposed to blood, tetanus).
- Prepare a personal and family plan and a go-kit, including your own medications.
- Know your agency's safety and PPE policies; be fit-tested for respirators if required.

### During deployment
- Attend the safety briefing and follow the **Safety Officer**.
- Wear the PPE your assignment requires, and take it off safely.
- Watch for **heat illness** (Florida PODs and shelters often run in heat): drink water, rest in shade or cooling and watch co-workers.
- Respect **shift limits**; fatigue causes errors. Report injuries and exposures right away.

### Health monitoring
NIOSH's **Emergency Responder Health Monitoring and Surveillance (ERHMS)** framework describes monitoring responders' health before, during and after deployment — rostering, health screening, tracking exposures and injuries, and post-deployment follow-up.

### Stress and psychological first aid
Long hours, distressed people and loss can affect anyone. Signs of strain include irritability, trouble sleeping, poor concentration, withdrawal and increased alcohol use.
- Use the buddy system and check on each other.
- Take breaks, eat and sleep when you can.
- **Psychological first aid** principles — promote safety, calm, connectedness, self-efficacy and hope — help both the public and colleagues.
- Use your employee assistance program after deployment. Asking for help is part of staying ready.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: an anthrax exposure exercise", 10, `**Situation (fictional full-scale exercise).** A simulated release of anthrax spores at a downtown event exposes an estimated 150,000 people. The state requests SNS assets, which arrive at the state RSS site within 12 hours. The county must begin dispensing preventive antibiotics through 12 open PODs and 40 closed PODs.

**Exercise highlights:**
- The county opened PODs using the **non-medical model** with a head-of-household option; clinicians staffed medical evaluation at every POD.
- Closed POD partners — two hospitals, a university and a large employer — picked up pre-allocated medication and dispensed to employees and families, cutting open-POD lines.
- MRC volunteers checked in, received **just-in-time training** and were assigned to greeting and exit stations.
- At one POD, the line backed up because screening forms were only in English. The POD manager requested forms in Spanish and Haitian Creole and assigned bilingual volunteers.
- Temperatures reached 92°F. The Safety Officer set up shade and water and required 15-minute cooling breaks every hour for outdoor staff.

**Discussion:**
- Which CDC capabilities were exercised?
- What should go in the after-action report about the screening forms?
- How did closed PODs help meet the 48-hour goal?`),
      ],
    },
  ],
  finalExam: {
    title: "Public Health Emergency Response — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("The CDC's public health emergency preparedness and response capabilities number:", ["8", "12", "15", "20"], 2, "There are 15 capabilities."),
      ms("Which are among the 15 capabilities? (Select all that apply.)", ["Medical Countermeasure Dispensing and Administration", "Volunteer Management", "Responder Safety and Health", "Hospital Billing"], [0, 1, 2], "Billing is not a preparedness capability."),
      mc("The Strategic National Stockpile is managed by:", ["The CDC", "HHS's Administration for Strategic Preparedness and Response", "FEMA", "Each county"], 1, "ASPR manages the SNS."),
      mc("SNS materiel delivered to a state first goes to:", ["Individual pharmacies", "The state's Receiving, Staging and Storage site", "A hospital emergency department", "The FEMA headquarters"], 1, "States receive assets at an RSS site, then distribute them."),
      tf("The Cities Readiness Initiative aims to provide preventive medication to a metropolitan area's entire population within 48 hours.", true, "That is the CRI planning goal."),
      mc("An open POD serves:", ["Only health department staff", "The general public", "Only hospital patients", "Only a partner's employees"], 1, "Open PODs are open to the public."),
      mc("A key benefit of closed PODs is that they:", ["Replace open PODs entirely", "Reduce crowding at open PODs and reach defined groups quickly", "Avoid the need for any agreement", "Allow unlimited medication per person"], 1, "Closed PODs take pressure off open PODs."),
      sc("At the forms station, a client says she is allergic to the antibiotic being dispensed. What should happen?", ["Give her the medication anyway", "Refer her to medical evaluation for an alternative under protocol", "Send her home without medication", "Ask her to choose another POD"], 1, "Screened-out clients see a clinician for an alternative."),
      mc("In the non-medical dispensing model:", ["Only physicians may hand out medication", "Trained non-clinical staff dispense pre-packaged medication under protocols, with clinicians available for those screened out", "No screening occurs at all", "Medication is mailed"], 1, "That describes the non-medical model."),
      mc("Which organization supports local units of medical and non-medical volunteers nationally?", ["The Medical Reserve Corps program at ASPR", "The Joint Commission", "OSHA", "The Census Bureau"], 0, "ASPR supports the Medical Reserve Corps."),
      ms("What should happen when a volunteer arrives at a POD? (Select all that apply.)", ["Check in and verify credentials", "Just-in-time training and a safety briefing", "An assignment within their training and license", "Starting work wherever they like"], [0, 1, 2], "Volunteers are assigned by a supervisor."),
      mc("Which is a sign of stress in a responder?", ["Steady sleep and appetite", "Irritability, poor concentration and withdrawal", "Taking scheduled breaks", "Using the buddy system"], 1, "These are common warning signs."),
      sc("It is 93°F at an outdoor POD and a co-worker becomes confused and stops sweating. What should you do?", ["Tell them to keep working", "Treat it as a possible heat emergency: alert your supervisor and call for medical help immediately while starting to cool them", "Give them coffee", "Wait until the shift ends"], 1, "Confusion and hot, dry skin can signal heat stroke, a medical emergency."),
      tf("Responder health monitoring should continue after deployment ends.", true, "ERHMS includes post-deployment follow-up."),
      mc("Which principle is part of psychological first aid?", ["Promoting calm and connectedness", "Telling people to forget what happened", "Forcing people to describe every detail", "Avoiding offers of practical help"], 0, "PFA promotes safety, calm, connectedness, self-efficacy and hope."),
    ],
  },
};
