import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const phFoundations: CourseContent = {
  code: "CHITA-PH-001",
  title: "Foundations of Public Health: Core Functions and the 10 Essential Public Health Services",
  categorySlug: "public-health-practice",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 70,
  clinicalReviewRequired: false,
  description:
    "An orientation for new public health workers and healthcare staff who partner with health departments: how public health differs from clinical care, the three core functions, the revised 10 Essential Public Health Services (2020), how the U.S. public health system is organized (including Florida's state-and-county structure), levels of prevention and the ethics of public health practice.",
  targetAudience: "New health department employees, community health workers, case managers, nurses and other staff who support population health programs.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Distinguish population-focused public health practice from individual clinical care.",
    "Describe the three core public health functions: assessment, policy development and assurance.",
    "List the 10 Essential Public Health Services and connect your own work to them.",
    "Describe how federal, state, local and tribal public health agencies share responsibilities.",
    "Apply the levels of prevention and core ethical principles to public health situations.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "Chapter 381, Florida Statutes", title: "Public health: general provisions", url: "https://www.flsenate.gov/Laws/Statutes/2025/Chapter381" },
    { agency: "Florida Legislature", citation: "Chapter 154, Florida Statutes", title: "Public health facilities (county health departments)", url: "https://www.flsenate.gov/Laws/Statutes/2025/Chapter154" },
  ],
  sourceReferences: [
    { title: "10 Essential Public Health Services", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/public-health-gateway/php/about/index.html", accessedOn: ACCESSED },
    { title: "The 10 Essential Public Health Services (revised September 2020)", publisher: "Public Health National Center for Innovations / de Beaumont Foundation", url: "https://phnci.org/national-frameworks/10-ephs", accessedOn: ACCESSED },
    { title: "The Future of Public Health (1988)", publisher: "Institute of Medicine (National Academies Press)", url: "https://nap.nationalacademies.org/catalog/1091/the-future-of-public-health", accessedOn: ACCESSED },
    { title: "Healthy People 2030", publisher: "Office of Disease Prevention and Health Promotion (HHS)", url: "https://odphp.health.gov/healthypeople", accessedOn: ACCESSED },
    { title: "Public Health Code of Ethics (2019)", publisher: "American Public Health Association", url: "https://www.apha.org/-/media/files/pdf/membergroups/ethics/code_of_ethics.ashx", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. What public health is",
      summary: "Population health, prevention and partnership.",
      lessons: [
        text("Public health and clinical care", 10, `**Public health** is the science and practice of protecting and improving the health of **populations** — whole communities, not one patient at a time. Clinical care asks, *"What is wrong with this person, and how do I treat them?"* Public health asks, *"Why is this happening in this community, and how do we prevent it?"*

| Clinical care | Public health |
|---|---|
| One patient at a time | Whole populations |
| Diagnosis and treatment | Prevention and protection |
| Clinic or hospital setting | Communities, schools, workplaces, the environment |
| Paid largely by insurance | Funded largely by government and grants |

The two depend on each other. Clinicians report diseases that let public health detect outbreaks; public health programs — clean water, safe food, immunization, tobacco control, injury prevention — keep people out of clinics in the first place.

### Public health achievements
Many of the 20th century's biggest gains in U.S. life expectancy came from public health measures: vaccination, motor-vehicle safety, safer workplaces, control of infectious diseases through sanitation and clean water, safer and healthier foods, healthier mothers and babies, family planning, fluoridation, recognition of tobacco as a health hazard and declines in deaths from heart disease and stroke.

### Who works in public health
Epidemiologists, nurses, environmental health specialists, health educators, community health workers, case managers, laboratory scientists, disease intervention specialists, nutritionists, data analysts, emergency planners, administrators and more. Whatever your title, your work contributes to the system described in this course.`),
      ],
    },
    {
      title: "2. Core functions and the 10 Essential Services",
      summary: "The framework for what public health does.",
      lessons: [
        text("Three core functions", 8, `In 1988 the Institute of Medicine's report *The Future of Public Health* defined three **core functions** of public health agencies:

- **Assessment** — regularly collecting, analyzing and sharing information about the health of the community, including health problems and their causes.
- **Policy development** — using that information and scientific knowledge to develop comprehensive policies, plans and laws that protect and improve health.
- **Assurance** — making sure that the services needed to reach community health goals are provided, by the agency directly or by others, and evaluating whether they work.`),
        text("The 10 Essential Public Health Services (2020)", 14, `The **10 Essential Public Health Services** describe the activities all communities should undertake. The framework was first published in 1994 and **revised in September 2020** by the Public Health National Center for Innovations and the de Beaumont Foundation with a task force of practitioners. The revision placed **equity at the center** of the framework's graphic and incorporated it throughout the services.

### Assessment
1. **Assess and monitor population health** status, the factors that influence health, and community needs and assets.
2. **Investigate, diagnose and address health problems and hazards** affecting the population.

### Policy development
3. **Communicate effectively** to inform and educate people about health, the factors that influence it and how to improve it.
4. **Strengthen, support and mobilize communities and partnerships** to improve health.
5. **Create, champion and implement policies, plans and laws** that affect health.
6. **Utilize legal and regulatory actions** designed to improve and protect the public's health.

### Assurance
7. **Enable equitable access** to the individual services and care needed to be healthy.
8. **Build and support a diverse and skilled public health workforce.**
9. **Improve and innovate** public health functions through ongoing evaluation, research and continuous quality improvement.
10. **Build and maintain a strong organizational infrastructure** for public health.

### Where the framework is used
The **Public Health Accreditation Board (PHAB)** uses the 10 Essential Services to structure its national standards for accrediting health departments. Health departments use the framework in community health assessments, strategic plans and workforce development.

### Connect it to your job
- A disease intervention specialist interviewing a patient with syphilis → Service 2.
- A health educator running a heat-safety campaign → Service 3.
- A case manager helping clients enroll in coverage → Service 7.
- A supervisor coaching new staff → Service 8.`),
        check("Check your understanding: core functions and services", [
          kc("pf1", "Monitoring a county's diabetes rates and the factors driving them is part of which core function?", ["Assessment", "Policy development", "Assurance", "Enforcement"], 0, "Collecting and analyzing community health information is assessment."),
          kc("pf2", "Which Essential Service is a restaurant inspection that enforces the food code?", ["Service 1: Assess and monitor", "Service 6: Utilize legal and regulatory actions", "Service 8: Build the workforce", "Service 9: Improve and innovate"], 1, "Enforcing health laws and regulations is Service 6."),
          kc("pf3", "What did the 2020 revision place at the center of the framework?", ["Research", "Equity", "Hospitals", "Funding"], 1, "The revised framework centers equity; the 1994 version had research at the center."),
        ]),
      ],
    },
    {
      title: "3. How the public health system is organized",
      summary: "Federal, state, local and tribal roles.",
      lessons: [
        text("Who does what", 12, `### States hold primary authority
Under the U.S. Constitution, protecting public health is mainly a responsibility of the **states** (part of their "police powers"). States pass public health laws, license health professionals and facilities, and give health departments authority to investigate disease, inspect, and — when necessary — order isolation or quarantine.

### Local health departments
Local (county or city) health departments deliver most day-to-day public health services: disease investigation, immunization, environmental health, maternal and child health, health education and emergency preparedness. Structures differ by state: some states have independent local departments, some run local services centrally, and some share governance.

**Florida** has an integrated state system: the **Florida Department of Health** operates a health department in each of Florida's **67 counties**, in partnership with county governments that help fund them (Chapter 154, Florida Statutes). The **State Surgeon General** heads the department and may declare a public health emergency under section 381.00315, Florida Statutes.

### Federal agencies
The U.S. Department of Health and Human Services (HHS) funds, guides and supports state and local work. Examples:
- **CDC** — disease surveillance and control, preparedness, laboratory science, health promotion.
- **HRSA** — health workforce, community health centers, the Ryan White HIV/AIDS Program, maternal and child health.
- **FDA** — safety of food, drugs, vaccines and medical devices.
- **ASPR** — emergency preparedness and response, the Strategic National Stockpile.
- **CMS** — Medicare and Medicaid.
- **NIH** — medical research.

Federal health agencies have been undergoing reorganization since 2025, so program names and homes may change; the functions remain.

### Tribal public health
Tribal nations are sovereign governments with authority over public health on their lands. The Indian Health Service and tribal health programs provide services, and federal, state and local agencies coordinate with tribes government-to-government.

### Partners
Hospitals, community health centers, schools, employers, faith communities, community organizations, universities and the media are all part of the **public health system**. Most public health goals cannot be reached without them.`),
        check("Check your understanding: organization", [
          kc("pf4", "Under the U.S. Constitution, who holds primary responsibility for public health?", ["The federal government", "The states", "Hospitals", "Insurance companies"], 1, "Public health is mainly a state responsibility under state police powers."),
          kc("pf5", "How are county health departments organized in Florida?", ["Each county runs an independent department with no state role", "The Florida Department of Health operates a health department in each of the 67 counties, in partnership with county governments", "Only large counties have health departments", "They are run by hospitals"], 1, "Florida has an integrated state-county system."),
        ]),
      ],
    },
    {
      title: "4. Prevention and ethics",
      summary: "Levels of prevention and principles of practice.",
      lessons: [
        text("Levels of prevention", 8, `- **Primordial prevention** — preventing risk factors from developing at all (for example, safe places to walk, healthy school meals).
- **Primary prevention** — preventing disease or injury before it occurs (vaccination, seat belts, smoke-free laws).
- **Secondary prevention** — detecting disease early to stop or slow it (cancer screening, HIV and hepatitis C testing, blood pressure checks).
- **Tertiary prevention** — reducing complications and disability from established disease (diabetes self-management education, cardiac rehabilitation, HIV treatment that keeps viral load suppressed).

Public health also distinguishes **upstream** factors (housing, education, income, environment) from **downstream** care. Upstream action often prevents the most illness.`),
        text("Ethics in public health", 8, `Public health decisions often balance the good of the community against individual choices. Commonly cited principles include:
- **Respect for persons** — informed choice, privacy and confidentiality.
- **Beneficence and harm reduction** — act to improve health and reduce harm.
- **Justice and fairness** — distribute benefits and burdens fairly; pay attention to groups at higher risk.
- **Least restrictive means** — when restricting freedom (for example, isolation), use the least restrictive measure that works, for no longer than necessary.
- **Transparency and trust** — explain decisions and the evidence behind them; communities that trust public health are more likely to follow guidance.
- **Accountability** — use public resources responsibly and evaluate results.

The **American Public Health Association's Public Health Code of Ethics (2019)** sets out values and practical guidance for these decisions.

### Confidentiality
Public health collects sensitive information — disease reports, HIV and STI results, home addresses. Use it only for its public health purpose, share it only as the law and your agency's policies allow, and protect it. A breach can harm people and destroy community trust for years.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: rising congenital syphilis", 10, `**Situation (fictional).** A Florida county reports four cases of congenital syphilis in one year, up from none. The health department forms a team.

**What the team did, by Essential Service:**
- **Service 1 & 2:** Epidemiologists reviewed surveillance data and found most mothers had no prenatal care in the first trimester and several had been tested early in pregnancy but not again in the third trimester. Disease intervention specialists interviewed patients and notified partners.
- **Service 3:** Staff created plain-language materials in English, Spanish and Haitian Creole about testing during pregnancy.
- **Service 4:** The team partnered with OB practices, emergency departments, jails and a community health center.
- **Service 5 & 6:** Leaders reviewed state testing requirements for pregnant women with partner clinicians and sent a health alert reminding providers of them.
- **Service 7:** Case managers helped pregnant women enroll in coverage and find prenatal care; the clinic added walk-in testing hours.
- **Service 9:** The team tracked monthly testing rates to see whether the changes worked.

**Discussion:**
- Which level of prevention does prenatal syphilis testing represent?
- What ethical issues arise in partner notification, and how is confidentiality protected?
- Which partners would you add?`),
      ],
    },
  ],
  finalExam: {
    title: "Foundations of Public Health — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Public health primarily focuses on:", ["Individual diagnosis and treatment", "The health of populations and prevention", "Hospital billing", "Private insurance"], 1, "Public health is population-focused and prevention-oriented."),
      ms("Which are the three core public health functions? (Select all that apply.)", ["Assessment", "Policy development", "Assurance", "Litigation"], [0, 1, 2], "Assessment, policy development and assurance."),
      mc("The 10 Essential Public Health Services were revised in:", ["1988", "1994", "2020", "2025"], 2, "The revised framework was released in September 2020."),
      mc("Investigating a cluster of Legionnaires' disease cases is Essential Service:", ["1", "2", "7", "10"], 1, "Investigate, diagnose and address health problems and hazards."),
      mc("Helping residents enroll in health coverage and find care best fits Essential Service:", ["3", "5", "7", "9"], 2, "Enable equitable access to individual services and care."),
      mc("Which Essential Service covers training and supporting public health staff?", ["Service 4", "Service 6", "Service 8", "Service 10"], 2, "Build and support a diverse and skilled public health workforce."),
      tf("The Public Health Accreditation Board uses the 10 Essential Public Health Services to structure its standards.", true, "PHAB standards are organized around the Essential Services."),
      mc("Under the U.S. Constitution, primary authority for public health rests with:", ["The states", "The federal government only", "Private hospitals", "Insurance companies"], 0, "States hold police powers for public health."),
      mc("In Florida, county health departments are:", ["Independent agencies with no state role", "Operated by the Florida Department of Health in partnership with county governments", "Run by hospitals", "Found only in large cities"], 1, "Florida has an integrated state-county system in all 67 counties."),
      mc("Which federal agency runs the Ryan White HIV/AIDS Program?", ["FDA", "HRSA", "NIH", "FEMA"], 1, "HRSA administers the Ryan White HIV/AIDS Program."),
      mc("Childhood vaccination is an example of:", ["Primary prevention", "Secondary prevention", "Tertiary prevention", "Rehabilitation"], 0, "Preventing disease before it occurs is primary prevention."),
      mc("Screening for colorectal cancer is an example of:", ["Primordial prevention", "Primary prevention", "Secondary prevention", "Tertiary prevention"], 2, "Early detection is secondary prevention."),
      sc("A health officer must restrict the movement of a person with infectious tuberculosis who refuses treatment. Which ethical principle guides the choice of measure?", ["Use the most restrictive measure available", "Use the least restrictive measure that is effective, for no longer than necessary", "Avoid any restriction regardless of risk", "Let the public vote"], 1, "Least restrictive means."),
      tf("Public health data, such as disease reports, may be shared freely because it serves the public good.", false, "Sensitive data must be used and shared only as law and policy allow."),
      sc("A new employee asks how her job processing WIC benefits relates to the 10 Essential Services. The best answer:", ["It does not relate to them", "It helps families access nutrition services needed to be healthy (Service 7) and supports maternal and child health", "It is Service 6 enforcement", "Only epidemiologists perform Essential Services"], 1, "Every public health role contributes to the Essential Services."),
    ],
  },
};
