import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const epidemiologySurveillance: CourseContent = {
  code: "CHITA-PH-002",
  title: "Epidemiology, Disease Surveillance and Outbreak Investigation",
  categorySlug: "public-health-practice",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 90,
  clinicalReviewRequired: false,
  description:
    "The working basics of epidemiology for public health staff: key terms and measures, the chain of infection, types of public health surveillance and Florida's disease reporting rules, the CDC's 10 steps of a field investigation, case definitions and epidemic curves, simple analysis with attack rates and relative risk, and control measures such as isolation and quarantine.",
  targetAudience: "Health department staff, infection preventionists, nurses, environmental health specialists, disease intervention specialists and others who report, investigate or respond to diseases.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Define common epidemiologic terms and calculate incidence, prevalence and attack rates.",
    "Describe the chain of infection and how control measures break it.",
    "Describe passive, active, syndromic and sentinel surveillance and Florida's reportable disease requirements.",
    "List the CDC's 10 steps of a field investigation and write a basic case definition.",
    "Interpret an epidemic curve and a simple two-by-two table, including relative risk.",
  ],
  regulatoryReferences: [
    { agency: "Florida Department of Health", citation: "Rule 64D-3.029, F.A.C.", title: "Diseases or Conditions to be Reported", url: "https://www.flrules.org/gateway/ruleNo.asp?id=64D-3.029" },
    { agency: "Florida Legislature", citation: "s. 381.0031, F.S.", title: "Epidemiological research; report of diseases of public health significance", url: "https://www.flsenate.gov/Laws/Statutes/2025/381.0031" },
  ],
  sourceReferences: [
    { title: "The CDC Field Epidemiology Manual — Conducting a Field Investigation (Chapter 3)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/field-epi-manual/php/chapters/field-investigation.html", accessedOn: ACCESSED },
    { title: "Reportable Diseases/Conditions in Florida — Practitioner List", publisher: "Florida Department of Health", url: "https://www.floridahealth.gov/diseases-and-conditions/disease-reporting-and-management/_documents/reportable-diseases.pdf", accessedOn: ACCESSED },
    { title: "National Notifiable Diseases Surveillance System (NNDSS)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/nndss/index.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Epidemiology basics",
      summary: "Terms, measures and the chain of infection.",
      lessons: [
        text("Key terms and measures", 14, `**Epidemiology** is the study of the distribution and determinants of health-related states and events in populations, and the application of that study to control health problems. Epidemiologists describe disease by **person** (who), **place** (where) and **time** (when), and ask **why**.

### How much disease is "normal"?
- **Endemic** — the usual, expected level of a disease in an area.
- **Outbreak** — more cases than expected in a limited area or group (for example, a nursing home or a wedding).
- **Epidemic** — more cases than expected, often over a wider area. (The terms are sometimes used interchangeably.)
- **Pandemic** — an epidemic that has spread across several countries or continents.
- **Cluster** — cases grouped in place and time that may or may not be more than expected.

### Measures
- **Count** — the number of cases. Useful, but it does not account for population size.
- **Incidence (rate)** — *new* cases during a period ÷ population at risk. *Example: 30 new cases of hepatitis A in a county of 300,000 in a year = 10 per 100,000 per year.*
- **Prevalence** — *all existing* cases at a point or period ÷ population. Chronic conditions with long duration have high prevalence even when incidence is low.
- **Attack rate** — a form of incidence used in outbreaks: people who became ill ÷ people at risk during the outbreak. *Example: 40 of 120 guests became ill = 33%.*
- **Case-fatality rate** — deaths from a disease ÷ people with the disease, usually as a percentage.

Rates let you compare places and groups of different sizes; counts do not.`),
        text("The chain of infection", 8, `Infectious diseases spread through a **chain of infection**:
1. **Infectious agent** — bacteria, virus, parasite or fungus
2. **Reservoir** — where the agent lives and multiplies (people, animals, water, soil)
3. **Portal of exit** — how it leaves the reservoir (respiratory secretions, stool, blood)
4. **Mode of transmission** — contact (direct or indirect), droplet, airborne, vehicle (food, water) or vector (mosquitoes, ticks)
5. **Portal of entry** — how it enters a new host (mouth, mucous membranes, broken skin)
6. **Susceptible host** — someone who can become infected (lack of immunity, age, chronic illness)

**Control measures break a link**: treating or removing the source (agent and reservoir), hand hygiene and respiratory etiquette (exit and entry), safe food and water and mosquito control (transmission), and vaccination or preventive medication (susceptible host).`),
        check("Check your understanding: basics", [
          kc("ep1", "In a county of 200,000 people, 50 new cases of salmonellosis are reported in a year. What is the incidence per 100,000?", ["2.5", "25", "50", "250"], 1, "50 ÷ 200,000 × 100,000 = 25 per 100,000 per year."),
          kc("ep2", "Mosquito control interrupts which link in the chain of infection?", ["Infectious agent", "Mode of transmission", "Susceptible host", "Portal of exit"], 1, "Mosquitoes are vectors — a mode of transmission."),
          kc("ep3", "Which measure counts all existing cases at a point in time?", ["Incidence", "Prevalence", "Attack rate", "Case-fatality rate"], 1, "Prevalence includes all existing cases."),
        ]),
      ],
    },
    {
      title: "2. Public health surveillance",
      summary: "How public health learns that something is wrong.",
      lessons: [
        text("Types of surveillance", 12, `**Public health surveillance** is the ongoing, systematic collection, analysis, interpretation and dissemination of health data so that public health action can follow. Surveillance without action is just data collection.

### Common types
- **Passive surveillance** — health care providers and laboratories report cases to the health department as required by law. Inexpensive and broad, but cases are often under-reported.
- **Active surveillance** — health department staff regularly contact providers, labs or facilities to find cases (for example, calling hospitals daily during an outbreak). More complete but resource-intensive.
- **Syndromic surveillance** — near-real-time monitoring of data such as emergency department chief complaints to detect unusual patterns before diagnoses are confirmed. Florida uses **ESSENCE-FL** for this.
- **Sentinel surveillance** — a selected network of sites (for example, clinics reporting influenza-like illness) that report data representing a wider area.
- **Laboratory-based surveillance** — electronic laboratory reporting of results.

### National notifiable diseases
States decide which diseases must be reported within their borders. States voluntarily share data on nationally notifiable diseases with the CDC through the **National Notifiable Diseases Surveillance System (NNDSS)**.`),
        text("Reporting diseases in Florida", 10, `Florida law (section **381.0031, Florida Statutes**) and **Rule 64D-3.029, Florida Administrative Code** require practitioners, hospitals, laboratories, nursing homes, schools and others providing health services to report listed diseases and conditions to the **county health department** where the patient lives (or as the department directs). Reporting timeframes on the Department of Health's practitioner list include:

- **Report immediately, 24/7 by phone, upon initial suspicion or laboratory test order** — conditions that need an urgent public health response even before confirmation (for example, anthrax, botulism, measles, meningococcal disease, rabies exposure needing intervention, and viral hemorrhagic fevers).
- **Report immediately, 24/7 by phone** (upon diagnosis) — for example, hepatitis A and typhoid fever.
- **Report next business day** — many other conditions, such as salmonellosis, Lyme disease, and chronic hepatitis B and C.
- **Other reporting timeframes** — some conditions, such as cancer, follow specific procedures.

The list is updated periodically. **Always check the current list** published by the Florida Department of Health and your county health department's contact numbers. Reports are entered into the Department's surveillance systems (Florida's disease reporting system is called **Merlin**) and investigated by epidemiology staff.

### Reporting and privacy
HIPAA **permits** disclosures to public health authorities that are required by law, so providers do not need the patient's authorization to report a notifiable disease. Health department staff must keep reported information confidential under Florida law.`),
        check("Check your understanding: surveillance", [
          kc("ep4", "Health department staff phone every hospital each morning to ask about new cases. This is:", ["Passive surveillance", "Active surveillance", "Syndromic surveillance", "No surveillance"], 1, "Health department staff actively seek cases."),
          kc("ep5", "In Florida, when must a practitioner report suspected measles?", ["Within 30 days", "Next business day", "Immediately, 24/7 by phone, upon suspicion", "Only after laboratory confirmation"], 2, "Measles is reportable immediately upon suspicion."),
          kc("ep6", "Does HIPAA require a patient's written authorization before a provider reports a notifiable disease to the health department?", ["Yes, always", "No — HIPAA permits disclosures to public health authorities required by law", "Only for children", "Only for HIV"], 1, "Required public health reporting is a permitted disclosure."),
        ]),
      ],
    },
    {
      title: "3. Investigating an outbreak",
      summary: "The CDC's 10 steps, case definitions and epidemic curves.",
      lessons: [
        text("The 10 steps of a field investigation", 12, `The *CDC Field Epidemiology Manual* describes **10 steps**. They are listed in order, but in practice several happen at the same time:

1. **Prepare for field work** — agree on purpose and roles, gather supplies, arrange approvals, and coordinate with partners.
2. **Confirm the diagnosis** — review clinical findings and laboratory results; make sure cases are what they appear to be.
3. **Determine the existence of an outbreak** — compare the number of cases with the expected number; watch for artifacts such as new tests or reporting changes.
4. **Identify and count cases** — create a **case definition** and find cases systematically (line list).
5. **Tabulate and orient the data in terms of time, place and person** — descriptive epidemiology, including the epidemic curve.
6. **Consider whether control measures can be implemented now** — do not wait for complete answers if people are at risk.
7. **Develop and test hypotheses** — about the source and mode of transmission.
8. **Plan one or more systematic studies** — for example, a cohort or case-control study, environmental sampling or laboratory testing.
9. **Implement and evaluate control and prevention measures.**
10. **Communicate findings** — to partners, leadership and the public, and in a written report.

### Case definitions
A case definition is a standard set of criteria for deciding whether a person should be counted as a case. According to the CDC manual it includes a **clinical** component (symptoms, signs or laboratory findings) plus restrictions on **time** (the epidemic period) and **place** (the setting); many definitions also restrict by **person** (for example, attendees of an event). Cases are often classified as **confirmed** (laboratory evidence), **probable** (clinical picture plus a link to a confirmed case) or **suspected/possible**.

*Example:* "A person who attended the Riverfront church dinner on March 3 and developed diarrhea (three or more loose stools in 24 hours) or vomiting between March 3 and March 6."`),
        text("Epidemic curves", 8, `An **epidemic curve** is a histogram of the number of cases by **date (or time) of illness onset**. Its shape suggests how the outbreak spread:
- **Point source** — a sharp rise and fall, all cases within one incubation period (for example, people who ate the same contaminated food at one meal).
- **Continuous common source** — cases rise and then plateau while exposure continues (for example, a contaminated water supply that is not fixed).
- **Propagated (person-to-person)** — a series of progressively taller peaks about one incubation period apart (for example, measles or norovirus spreading in a facility).

The curve also shows where the outbreak is now, which cases are outliers, and — combined with a known incubation period — the likely exposure period.`),
        check("Check your understanding: investigation", [
          kc("ep7", "Which step of the CDC field investigation comes immediately after confirming the diagnosis?", ["Communicate findings", "Determine the existence of an outbreak", "Plan systematic studies", "Implement control measures"], 1, "Step 3 is to determine that an outbreak exists."),
          kc("ep8", "An epidemic curve shows all cases occurring within 36 hours after a banquet. This suggests:", ["A propagated outbreak", "A point-source exposure", "Endemic disease", "Sentinel surveillance"], 1, "A single sharp peak within one incubation period suggests a point source."),
          kc("ep9", "Should control measures wait until the source is proven?", ["Yes, always", "No — consider whether measures can be put in place now if people are at risk", "Only if the media asks", "Only after the final report"], 1, "Step 6 is to consider control measures early."),
        ]),
      ],
    },
    {
      title: "4. Simple analysis and control",
      summary: "Attack rates, relative risk, isolation and quarantine.",
      lessons: [
        text("Two-by-two tables and relative risk", 12, `In a **cohort study** you compare illness among people who were exposed and not exposed. A **two-by-two table** organizes the data:

|  | Ill | Not ill | Total | Attack rate |
|---|---|---|---|---|
| Ate potato salad | 45 | 15 | 60 | 75% |
| Did not eat potato salad | 5 | 35 | 40 | 12.5% |

**Relative risk (RR)** = attack rate in exposed ÷ attack rate in unexposed = 75% ÷ 12.5% = **6.0**. People who ate the potato salad were six times as likely to become ill.
- RR = 1: no association
- RR > 1: exposure associated with higher risk
- RR < 1: exposure associated with lower risk (possibly protective)

In a **case-control study** (used when you cannot list everyone exposed), you compare exposures in cases and non-ill controls and calculate an **odds ratio**, interpreted similarly.

### Cautions
- Association is not proof of cause. Look for a dose-response effect, biological plausibility, laboratory confirmation and consistency.
- Chance, bias (for example, people who were ill remembering foods differently) and **confounding** (a third factor linked to both exposure and illness) can mislead.

### Isolation and quarantine
- **Isolation** separates people who are **ill** with a contagious disease from people who are not.
- **Quarantine** separates and restricts the movement of people who were **exposed** and **might** become ill, until it is clear they are not infected.
Both are legal tools; in Florida they are carried out under the authority of the State Health Officer and the Department of Health, using the least restrictive effective measure.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: the church dinner", 12, `**Situation (fictional).** On March 5, an emergency department reports four patients with vomiting and diarrhea who all attended a church dinner on March 3. About 150 people attended.

**What the team did:**
1. **Prepared** — epidemiology, environmental health and the laboratory agreed on roles; the church provided the guest list and menu.
2. **Confirmed the diagnosis** — two stool specimens tested positive for norovirus.
3. **Determined an outbreak existed** — 4 ED visits from one event far exceeded the expected number.
4. **Identified cases** — a phone survey of 120 attendees found 50 who met the case definition.
5. **Described the data** — onset times peaked 24–48 hours after the dinner; then a second, smaller peak appeared among household members, about one incubation period later.
6. **Took early control steps** — the kitchen was cleaned with an EPA-registered disinfectant effective against norovirus, and ill food workers were excluded until 48 hours after their symptoms ended.
7–8. **Hypotheses and study** — food histories showed an RR of 6.0 for a salad prepared by a volunteer who had been vomiting the night before.
9. **Control** — guidance on handwashing and exclusion was given to the church and households.
10. **Communicated** — a summary went to the church, providers and the state.

**Discussion:**
- What does the second, smaller peak tell you about transmission?
- Why is alcohol-based hand rub not enough against norovirus? *(Soap-and-water handwashing is recommended.)*
- Which link in the chain of infection did excluding ill food workers break?`),
      ],
    },
  ],
  finalExam: {
    title: "Epidemiology and Surveillance — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Epidemiologists describe disease by:", ["Cost, insurance and provider", "Person, place and time", "Height, weight and age", "Season only"], 1, "Person, place and time are the basis of descriptive epidemiology."),
      mc("More cases of a disease than expected in a limited area or group is:", ["Endemic", "An outbreak", "Prevalence", "A reservoir"], 1, "An outbreak is an excess over the expected level in a limited setting."),
      mc("Of 80 people at a picnic, 20 became ill. What is the attack rate?", ["4%", "20%", "25%", "80%"], 2, "20 ÷ 80 = 25%."),
      mc("Prevalence differs from incidence because prevalence counts:", ["Only new cases", "All existing cases", "Only deaths", "Only hospitalized cases"], 1, "Prevalence includes all existing cases."),
      ms("Which are links in the chain of infection? (Select all that apply.)", ["Reservoir", "Mode of transmission", "Susceptible host", "Insurance status"], [0, 1, 2], "Insurance status is not part of the chain."),
      mc("Vaccination breaks the chain of infection at the:", ["Reservoir", "Portal of exit", "Susceptible host", "Infectious agent"], 2, "Vaccination makes the host less susceptible."),
      mc("Monitoring emergency department chief complaints in near real time is:", ["Passive surveillance", "Syndromic surveillance", "Sentinel surveillance", "A case-control study"], 1, "Syndromic surveillance uses pre-diagnostic data."),
      tf("In Florida, some diseases must be reported immediately upon suspicion, before laboratory confirmation.", true, "Rule 64D-3.029 requires immediate reporting upon suspicion for certain conditions."),
      mc("Which is step 1 of the CDC's 10 steps of a field investigation?", ["Communicate findings", "Prepare for field work", "Develop hypotheses", "Implement control measures"], 1, "Preparing for field work comes first."),
      ms("A case definition typically includes: (Select all that apply.)", ["Clinical criteria", "A time period", "A place or setting", "The investigator's opinion of the patient"], [0, 1, 2], "Clinical criteria with restrictions on time and place (and often person)."),
      mc("An epidemic curve with successive, taller peaks about one incubation period apart suggests:", ["Point-source exposure", "Propagated, person-to-person spread", "No outbreak", "A laboratory error"], 1, "Propagated outbreaks show successive waves."),
      mc("Attack rate in exposed is 60% and in unexposed 10%. The relative risk is:", ["0.17", "6.0", "50", "70"], 1, "60 ÷ 10 = 6.0."),
      mc("A relative risk of 1.0 means:", ["The exposure is protective", "No association between exposure and illness", "Everyone became ill", "The exposure caused all cases"], 1, "RR = 1 indicates no association."),
      mc("Separating people who were exposed but are not ill, to see whether they develop disease, is:", ["Isolation", "Quarantine", "Surveillance", "Triage"], 1, "Quarantine applies to exposed people who may become ill."),
      sc("During an outbreak investigation, early data strongly point to one restaurant, but laboratory results will take five days. What should the team do?", ["Wait for laboratory confirmation before any action", "Consider control measures now, such as closing or correcting the implicated practice, while the investigation continues", "Close every restaurant in the county", "Tell the public nothing"], 1, "Step 6: implement control measures when people are at risk."),
    ],
  },
};
