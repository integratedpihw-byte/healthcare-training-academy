import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, FEMA_COMPLETION, FEMA_NOTICE } from "./_shared";

export const nrfIntroduction: CourseContent = {
  code: "CHITA-EM-004",
  title: "The National Response Framework: An Introduction (IS-800 Topics)",
  categorySlug: "emergency-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 75,
  clinicalReviewRequired: false,
  description:
    "How the nation responds to disasters and emergencies: the National Preparedness Goal and mission areas, roles from households to the federal government, the NRF's guiding principles, community lifelines, Emergency Support Functions (including ESF #8 Public Health and Medical Services), and how federal assistance is requested and coordinated. Covers the topics of FEMA IS-800.d. This course does not award a FEMA certificate.",
  targetAudience: "Public health, healthcare and emergency management staff who work with county, state and federal partners during disasters.",
  prerequisites: ["CHITA-EM-003"],
  completionCriteria: FEMA_COMPLETION,
  objectives: [
    "Describe the purpose and scope of the National Response Framework and its place in the National Preparedness System.",
    "Identify the roles of individuals, communities, the private sector and each level of government in response.",
    "Explain the NRF guiding principles and the community lifelines.",
    "Identify the Emergency Support Functions and describe the role of ESF #8, Public Health and Medical Services.",
    "Describe how federal assistance is requested and coordinated, including Stafford Act declarations.",
  ],
  regulatoryReferences: [
    { agency: "Congress", citation: "42 U.S.C. 5121 et seq.", title: "Robert T. Stafford Disaster Relief and Emergency Assistance Act", url: "https://www.fema.gov/disaster/stafford-act" },
  ],
  sourceReferences: [
    { title: "IS-800.d: National Response Framework, An Introduction", publisher: "FEMA Independent Study Program", url: "https://training.fema.gov/is/courseoverview.aspx?code=IS-800.d&lang=en", accessedOn: ACCESSED },
    { title: "National Response Framework, Fourth Edition (October 28, 2019)", publisher: "Federal Emergency Management Agency", url: "https://www.fema.gov/sites/default/files/2020-04/NRF_FINALApproved_2011028.pdf", accessedOn: ACCESSED },
    { title: "Community Lifelines", publisher: "Federal Emergency Management Agency", url: "https://www.fema.gov/emergency-managers/practitioners/lifelines", accessedOn: ACCESSED },
    { title: "FEMA Adds Water Systems to Community Lifelines (August 1, 2023)", publisher: "WaterISAC / U.S. EPA", url: "https://www.epa.gov/waterresilience/femas-community-lifelines-construct", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. The Framework in context",
      summary: "What the NRF is and how it fits national preparedness.",
      lessons: [
        text("Purpose and scope", 12, `${FEMA_NOTICE}

The **National Response Framework (NRF)** is a guide to how the nation responds to **all types of disasters and emergencies**. It is built on scalable, flexible and adaptable concepts drawn from NIMS so that responders can align roles and responsibilities across the whole community. The current edition is the **fourth edition (October 2019)**.

The NRF is **always in effect**. Its structures can be used for any incident — a small local event as well as a catastrophe — and it applies whether or not a federal disaster declaration has been made.

### The National Preparedness System
The NRF is one of five **National Planning Frameworks**, one for each **mission area** of the National Preparedness Goal:
- **Prevention** — avoiding, preventing or stopping a threatened or actual act of terrorism
- **Protection** — protecting people and assets against threats and hazards
- **Mitigation** — reducing loss of life and property by lessening the impact of disasters
- **Response** — saving lives, protecting property and the environment and meeting basic human needs after an incident
- **Recovery** — restoring, strengthening and revitalizing communities

Each mission area has **core capabilities**. In the Response mission area these include, for example, *Public Health, Healthcare, and Emergency Medical Services*; *Mass Care Services*; *Public Information and Warning*; *Operational Coordination*; and *Logistics and Supply Chain Management*.

### Response begins locally
Most incidents are handled entirely by local responders. When needs exceed local capacity, the county or city asks the **state**; when the state is overwhelmed, the **Governor** may ask for federal assistance. This is often summarized as response being **locally executed, state managed and federally supported**.`),
        check("Check your understanding: the Framework", [
          kc("nr1", "When is the National Response Framework in effect?", ["Only after a presidential declaration", "Always — its structures can be used for any incident", "Only during hurricanes", "Only when FEMA is on site"], 1, "The NRF is always in effect and scalable."),
          kc("nr2", "Which is NOT one of the five mission areas?", ["Prevention", "Mitigation", "Response", "Prosecution"], 3, "The mission areas are Prevention, Protection, Mitigation, Response and Recovery."),
        ]),
      ],
    },
    {
      title: "2. Roles and responsibilities",
      summary: "Everyone has a part in response.",
      lessons: [
        text("From households to the federal government", 12, `### The whole community
- **Individuals, families and households** — prepare emergency kits and plans, help neighbors, and follow official instructions. A prepared public reduces the demand on responders.
- **Communities and nongovernmental organizations (NGOs)** — faith-based groups, community organizations and voluntary agencies (for example, the American Red Cross) provide sheltering, feeding, donations management and support for people with access and functional needs.
- **Private sector** — owners and operators of critical infrastructure (power, water, communications, healthcare, pharmacies, grocery) restore services and supply chains. Their recovery is essential to the community's.

### Government
- **Local governments** — the first line of response. The local chief executive (mayor or county administrator) is responsible for public safety and welfare; local emergency managers, health departments, fire, EMS and law enforcement carry out response.
- **States, tribes, territories and insular area governments** — supplement local efforts, coordinate statewide resources and mutual aid, and request federal assistance. The **Governor** leads the state response and may declare a state emergency and activate the National Guard. Tribal governments are sovereign and may request federal assistance directly.
- **Federal government** — supports state and local efforts when needs exceed their capacity, and leads response where it has primary jurisdiction (for example, on federal property).

### Public health's roles
A county health department may lead disease control and environmental health, support sheltering and mass care, coordinate with hospitals and long-term care, and give guidance to the public — all while keeping its usual services going as far as possible.`),
        check("Check your understanding: roles", [
          kc("nr3", "Who typically requests federal disaster assistance for a state?", ["Any county health officer", "The Governor", "The hospital CEO", "A FEMA field employee"], 1, "The Governor requests federal assistance; tribal governments may request directly."),
          kc("nr4", "Why does the NRF include the private sector?", ["Because businesses replace government", "Because restoring critical services and supply chains is essential to community response and recovery", "To collect fees", "It does not"], 1, "Private sector owners operate most critical infrastructure."),
        ]),
      ],
    },
    {
      title: "3. Guiding principles and community lifelines",
      summary: "How the response is organized and prioritized.",
      lessons: [
        text("Principles and lifelines", 12, `### The five NRF guiding principles
1. **Engaged partnership** — leaders at all levels communicate shared goals and work together before and during incidents.
2. **Tiered response** — incidents are managed at the lowest jurisdictional level possible and supported by more resources as needed.
3. **Scalable, flexible and adaptable operational capabilities** — the response grows or shrinks with the incident.
4. **Unity of effort through unified command** — organizations coordinate while respecting each other's authority.
5. **Readiness to act** — responders act quickly and effectively, balancing speed with the need for accurate information.

### Community lifelines
The fourth edition of the NRF introduced **community lifelines**: the most fundamental services in a community that, when stable, allow all other aspects of society to function. Responders use them to assess impacts, report status in plain language and prioritize stabilization.

FEMA's current lifelines (Community Lifelines Toolkit, updated in 2023) are:
1. **Safety and Security**
2. **Food, Hydration, Shelter**
3. **Health and Medical**
4. **Energy** (power and fuel)
5. **Communications**
6. **Transportation**
7. **Hazardous Materials**
8. **Water Systems** — potable water and wastewater, added as a separate lifeline on August 1, 2023 (previously part of "Food, Water, Shelter")

### The Health and Medical lifeline
Covers medical care, public health, patient movement, the medical supply chain and fatality management. Public health staff often report on it: hospital and dialysis status, pharmacy availability, shelter health needs and disease threats.`),
        check("Check your understanding: principles and lifelines", [
          kc("nr5", "Managing an incident at the lowest jurisdictional level possible, with added support as needed, is:", ["Engaged partnership", "Tiered response", "Readiness to act", "Area Command"], 1, "Tiered response."),
          kc("nr6", "Which community lifeline was added as a separate lifeline in 2023?", ["Health and Medical", "Water Systems", "Energy", "Transportation"], 1, "Water Systems became the eighth lifeline on August 1, 2023."),
        ]),
      ],
    },
    {
      title: "4. Emergency Support Functions and federal coordination",
      summary: "How federal agencies organize support.",
      lessons: [
        text("ESFs and declarations", 14, `### Emergency Support Functions (ESFs)
ESFs group federal resources and capabilities into functional areas most often needed in a response. Each has a coordinator and primary and support agencies.

| ESF | Function |
|---|---|
| 1 | Transportation |
| 2 | Communications |
| 3 | Public Works and Engineering |
| 4 | Firefighting |
| 5 | Information and Planning |
| 6 | Mass Care, Emergency Assistance, Temporary Housing and Human Services |
| 7 | Logistics |
| 8 | **Public Health and Medical Services** |
| 9 | Search and Rescue |
| 10 | Oil and Hazardous Materials Response |
| 11 | Agriculture and Natural Resources |
| 12 | Energy |
| 13 | Public Safety and Security |
| 14 | Cross-Sector Business and Infrastructure |
| 15 | External Affairs |

**ESF #8** is coordinated by the U.S. Department of Health and Human Services through the **Administration for Strategic Preparedness and Response (ASPR)**. It supports public health and medical needs, including patient movement, medical surge, behavioral health, medical countermeasures, food and drug safety, and mass fatality support. Many states and counties use the same ESF numbering in their own plans; in Florida, the Department of Health leads ESF 8 in the State Emergency Operations Center.

### Requesting federal assistance
Under the **Robert T. Stafford Disaster Relief and Emergency Assistance Act**, the President can issue:
- An **emergency declaration** — to supplement state and local efforts to save lives and protect property, usually for a specific need or imminent threat.
- A **major disaster declaration** — for a natural catastrophe (or any fire, flood or explosion) that exceeds state and local capacity, opening a wider range of assistance programs.

The Governor makes the request, generally after a joint preliminary damage assessment. Federal agencies can also support incidents **without** a Stafford Act declaration using their own authorities (for example, HHS during a disease outbreak).

### Federal coordinating structures
- **National Response Coordination Center (NRCC)** — FEMA's national multiagency center.
- **Regional Response Coordination Centers (RRCCs)** — coordinate in each FEMA region until field offices are set up.
- **Joint Field Office (JFO)** — temporary federal facility near the incident, led by a **Federal Coordinating Officer (FCO)** working with the state's coordinating officer in a unified coordination group.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: a hurricane strikes the Gulf Coast", 10, `**Situation (fictional).** A Category 4 hurricane makes landfall in Florida's Big Bend. Power is out for 500,000 customers, several hospitals are on generators and a nursing home must evacuate.

**How the Framework played out:**
- County EOCs activated and opened shelters; the county health departments staffed special-needs shelters and checked on facilities (**locally executed**).
- Counties requested additional nurses and generators from the **State EOC**, where the Department of Health led **ESF 8** and arranged help from unaffected counties and other states through **EMAC** (**state managed**).
- The Governor requested a **major disaster declaration**. Once it was granted, a **Joint Field Office** opened and federal ESF #8 resources, including medical teams and patient movement support, deployed to support the state (**federally supported**).
- Daily situation reports described the status of each **community lifeline** — for example, Health and Medical "unstable" while two hospitals depended on generator fuel.

**Discussion:**
- Which NRF guiding principles can you identify?
- What would the health department report under the Health and Medical lifeline?
- Why are households asked to prepare their own supplies for at least several days?`),
      ],
    },
  ],
  finalExam: {
    title: "National Response Framework — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("The National Response Framework is:", ["A federal law that replaces state authority", "A guide to how the nation responds to all types of disasters and emergencies", "A list of FEMA employees", "A hospital accreditation standard"], 1, "The NRF is a guide to national response."),
      tf("The NRF applies only after a presidential disaster declaration.", false, "The NRF is always in effect and scalable."),
      ms("Which are National Preparedness Goal mission areas? (Select all that apply.)", ["Prevention", "Protection", "Mitigation", "Response", "Recovery"], [0, 1, 2, 3, 4], "There are five mission areas."),
      mc("Most incidents are handled by:", ["The federal government", "Local responders", "The military", "International agencies"], 1, "Response begins and usually ends locally."),
      mc("Who leads a state's response and may request federal assistance?", ["The Governor", "The FEMA Administrator", "A county health officer", "The Secretary of HHS"], 0, "The Governor leads the state response and makes the request."),
      mc("Which guiding principle means incidents are managed at the lowest jurisdictional level possible?", ["Engaged partnership", "Tiered response", "Readiness to act", "Standardization"], 1, "Tiered response."),
      mc("Community lifelines are used to:", ["Replace ICS", "Assess impacts, communicate status in plain language and prioritize stabilization", "Calculate insurance claims", "Rank hospitals"], 1, "Lifelines frame incident impacts and priorities."),
      ms("Which are current FEMA community lifelines? (Select all that apply.)", ["Health and Medical", "Water Systems", "Food, Hydration, Shelter", "Entertainment"], [0, 1, 2], "Entertainment is not a lifeline; there are eight lifelines."),
      mc("Which ESF covers Public Health and Medical Services?", ["ESF #6", "ESF #8", "ESF #10", "ESF #13"], 1, "ESF #8 is Public Health and Medical Services."),
      mc("Which federal department coordinates ESF #8?", ["Department of Homeland Security", "Department of Health and Human Services (through ASPR)", "Department of Defense", "Department of Agriculture"], 1, "HHS, through ASPR, coordinates ESF #8."),
      mc("Mass Care, Emergency Assistance, Temporary Housing and Human Services is:", ["ESF #3", "ESF #6", "ESF #9", "ESF #15"], 1, "ESF #6."),
      mc("A temporary federal facility near the incident, led by a Federal Coordinating Officer, is the:", ["Joint Field Office", "Incident Command Post", "Staging Area", "Point of Dispensing"], 0, "The JFO coordinates federal support in the field."),
      tf("Federal agencies can support some incidents, such as disease outbreaks, without a Stafford Act declaration.", true, "Agencies may use their own authorities."),
      sc("After a hurricane, your county's hospitals are on generator power with fuel for 18 hours. Under which community lifeline would you report this?", ["Communications", "Health and Medical (and Energy)", "Transportation", "Safety and Security"], 1, "Hospital status falls under Health and Medical; the fuel issue also affects Energy."),
      sc("A resident asks why the county urges households to keep several days of food, water and medications. Best answer:", ["The government will not help at all", "Prepared households reduce demand on responders, who prioritize life-threatening needs in the first days", "It is required by federal law", "Stores will be closed permanently"], 1, "Individual preparedness is part of the whole-community approach."),
    ],
  },
};
