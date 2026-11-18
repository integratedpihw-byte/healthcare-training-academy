import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, FEMA_COMPLETION, FEMA_NOTICE } from "./_shared";

export const nimsIntroduction: CourseContent = {
  code: "CHITA-EM-003",
  title: "An Introduction to the National Incident Management System (NIMS / IS-700 Topics)",
  categorySlug: "emergency-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 80,
  clinicalReviewRequired: false,
  description:
    "How the whole community works together during incidents of any size: NIMS guiding principles, resource management and mutual aid, the four command and coordination structures (ICS, emergency operations centers, multiagency coordination groups and the joint information system), and communications and information management. Covers the topics of FEMA IS-700.b. This course does not award a FEMA certificate.",
  targetAudience: "Public health, healthcare and emergency management staff, managers and partners who coordinate with other agencies during incidents.",
  prerequisites: [],
  completionCriteria: FEMA_COMPLETION,
  objectives: [
    "Describe the purpose and guiding principles of NIMS and who it applies to.",
    "Explain the elements of NIMS resource management, including typing, credentialing and mutual aid.",
    "Identify the four NIMS command and coordination structures and how they relate to one another.",
    "Describe emergency operations center organization options and activation levels.",
    "Apply the principles of NIMS communications and information management.",
  ],
  regulatoryReferences: [
    { agency: "White House", citation: "HSPD-5 (2003)", title: "Management of Domestic Incidents — established NIMS", url: "https://www.dhs.gov/publication/homeland-security-presidential-directive-5" },
  ],
  sourceReferences: [
    { title: "IS-700.b: An Introduction to the National Incident Management System", publisher: "FEMA Independent Study Program", url: "https://training.fema.gov/is/courseoverview.aspx?code=IS-700.b&lang=en", accessedOn: ACCESSED },
    { title: "National Incident Management System, Third Edition (October 2017)", publisher: "Federal Emergency Management Agency", url: "https://www.fema.gov/emergency-managers/nims", accessedOn: ACCESSED },
    { title: "Emergency Management Assistance Compact (EMAC)", publisher: "National Emergency Management Association", url: "https://www.emacweb.org/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. What NIMS is",
      summary: "A shared approach for the whole community.",
      lessons: [
        text("Purpose, scope and principles", 12, `${FEMA_NOTICE}

The **National Incident Management System (NIMS)** provides a common, nationwide approach that lets the **whole community** — all levels of government, nongovernmental organizations and the private sector — work together to prevent, protect against, mitigate, respond to and recover from incidents of **any cause, size, location or complexity**.

NIMS was established under **Homeland Security Presidential Directive 5 (2003)**. The current doctrine is the **third edition, released in October 2017**. It made clear that NIMS is more than the Incident Command System: it applies to everyone involved in an incident, from the incident scene to emergency operations centers and policy groups.

### Guiding principles
- **Flexibility** — NIMS components work for any incident, whether a single-day outbreak investigation or a months-long hurricane recovery.
- **Standardization** — common terminology, structures and practices let organizations work together.
- **Unity of effort** — organizations with different authorities coordinate toward shared objectives while keeping their own authorities.

### The three NIMS components
1. **Resource Management**
2. **Command and Coordination**
3. **Communications and Information Management**

### Why it matters to a health department
Health departments are often a **lead agency** (outbreaks, medical countermeasures) and a **support agency** (hurricane sheltering, environmental releases). Using NIMS means your plans, positions and requests make sense to emergency management, hospitals and neighboring jurisdictions.`),
        check("Check your understanding: NIMS basics", [
          kc("ni1", "Which are the three NIMS components?", ["Planning, Logistics, Finance", "Resource Management; Command and Coordination; Communications and Information Management", "Prevention, Response, Recovery", "Federal, State, Local"], 1, "These are the three components of NIMS (2017)."),
          kc("ni2", "NIMS applies to:", ["Only federal agencies", "Only large disasters", "Incidents of any cause, size, location or complexity, and the whole community", "Only fire departments"], 2, "NIMS is designed for all incidents and all partners."),
        ]),
      ],
    },
    {
      title: "2. Resource management",
      summary: "Getting the right resources to the right place at the right time.",
      lessons: [
        text("Typing, credentialing and mutual aid", 14, `### Preparing resources before an incident
- **Identifying and typing** — describing resources by **kind** (what they are) and **type** (their capability), so a request for "a Type 2 vaccination strike team" means the same thing everywhere.
- **Qualifying, certifying and credentialing personnel** — making sure people meet the training and experience standards for their position (qualifying), that an authority has confirmed it (certifying), and that their identity and qualifications can be verified on site (credentialing). NIMS describes a **National Qualification System** for this.
- **Planning, acquiring, storing and inventorying** resources.

### Mutual aid
Mutual aid agreements let jurisdictions share resources. Within a state, many jurisdictions use a statewide mutual aid agreement. Between states, the **Emergency Management Assistance Compact (EMAC)** — adopted by all 50 states, the District of Columbia, Puerto Rico, Guam and the U.S. Virgin Islands — provides a legal framework for one state to send personnel and equipment to another during a declared emergency, including licensing recognition and reimbursement.

### Managing resources during an incident
The NIMS resource management process:
1. **Identify requirements** — what is needed, how many, where and when.
2. **Order and acquire** — through established channels.
3. **Mobilize** — check in, brief and assign.
4. **Track and report** — know where every resource is and its status.
5. **Demobilize** — release in an orderly, safe way.
6. **Reimburse and restock** — pay for, replace and repair resources.

### In practice
If your dispensing site needs 20 more nurses, the request goes through your supervisor to the Logistics Section (or the EOC), not by calling friends at neighboring agencies. Orderly requests prevent duplication and keep track of who is on site.`),
        check("Check your understanding: resources", [
          kc("ni3", "Which compact provides a framework for states to share resources across state lines?", ["HSPD-5", "EMAC", "The Stafford Act", "HIPAA"], 1, "The Emergency Management Assistance Compact supports interstate mutual aid."),
          kc("ni4", "What is the first step of the NIMS resource management process during an incident?", ["Demobilize", "Identify requirements", "Reimburse and restock", "Track and report"], 1, "First identify what is needed, how much, where and when."),
          kc("ni5", "Confirming on site that a responder is who they say they are and holds the stated qualifications is called:", ["Typing", "Credentialing", "Staging", "Mobilizing"], 1, "Credentialing verifies identity and qualifications."),
        ]),
      ],
    },
    {
      title: "3. Command and coordination",
      summary: "ICS, EOCs, MAC Groups and the JIS.",
      lessons: [
        text("The four NIMS structures", 14, `NIMS describes four structures that work together:

1. **Incident Command System (ICS)** — manages the incident **on scene** (tactical direction).
2. **Emergency Operations Centers (EOCs)** — locations where staff from multiple agencies come together to **support** incidents: gathering information, setting priorities across incidents, acquiring resources and coordinating with partners. A county EOC may support several incident command posts at once.
3. **Multiagency Coordination Groups (MAC Groups)** — also called policy groups. Senior officials or agency administrators who make **policy-level decisions**, set priorities among incidents and allocate scarce resources. They do not direct tactics.
4. **Joint Information System (JIS)** — the processes and people that coordinate public information across agencies so the public hears **consistent** messages. A **Joint Information Center (JIC)** is a physical or virtual location where Public Information Officers work together.

### EOC organization options
Jurisdictions organize EOC staff in one of three common ways:
- An **ICS or ICS-like structure** (sections similar to an incident command post).
- An **Incident Support Model**, which groups situational awareness, planning support, resources and center management to support on-scene command.
- A **Departmental structure**, where agency representatives coordinate using their usual organization.

### EOC activation levels
- **Level 3 — Normal operations / steady state**: routine monitoring.
- **Level 2 — Enhanced steady state / partial activation**: some staff and agencies activated to monitor or support a developing situation.
- **Level 1 — Full activation**: all staff and partner agencies activated.

### Other command terms
- **Unified Command** — agencies with jurisdictional or functional responsibility jointly manage an incident with one set of objectives.
- **Area Command** — oversees multiple incidents, each with its own ICS organization, typically when they compete for the same resources.

### Where public health fits
A health department may run its own **Department Operations Center**, send a representative to the county EOC to staff **ESF #8 (Public Health and Medical)**, and have its leadership take part in a policy group.`),
        check("Check your understanding: coordination", [
          kc("ni6", "Which NIMS structure makes policy decisions and allocates scarce resources among incidents, without directing tactics?", ["Incident Command Post", "MAC Group", "Staging Area", "Strike team"], 1, "Multiagency Coordination Groups work at the policy level."),
          kc("ni7", "An EOC at Level 1 is:", ["Closed", "At routine monitoring", "Fully activated", "Partly activated"], 2, "Level 1 is full activation; Level 3 is steady state."),
          kc("ni8", "What is the purpose of the Joint Information System?", ["To store medical records", "To coordinate consistent public information across agencies", "To direct tactical operations", "To credential responders"], 1, "The JIS integrates public information so messages are consistent."),
        ]),
      ],
    },
    {
      title: "4. Communications and information management",
      summary: "Sharing the right information with the right people.",
      lessons: [
        text("Principles and practice", 10, `### Communications principles
NIMS calls for communications systems and plans that support:
- **Interoperability** — responders from different organizations can communicate with each other.
- **Reliability, scalability and portability** — systems work under stress, grow with the incident and can move where needed.
- **Resilience and redundancy** — backups exist if a primary system fails (for example, radios, satellite phones and runners when cellular service is down).
- **Security** — sensitive information, including protected health information, is protected.

Use **plain language**, not codes, in all communications between agencies.

### Information management
Good decisions depend on good information:
- **Situational awareness** — knowing what is happening and what it means.
- Information is **collected, verified, analyzed and shared** through established channels, such as the Planning Section or EOC situation unit.
- **Essential elements of information** are the key data decision-makers need (for example, the number of residents needing dialysis in the evacuation zone).

### Protecting information
Public health data shared during an incident must still follow privacy laws. Share the **minimum necessary** information with partners who need it for the response, and use secure channels. HIPAA permits disclosures needed for public health activities and to prevent serious threats to health or safety, but staff should follow their agency's procedures and ask a privacy officer when unsure.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: a regional boil-water emergency", 10, `**Situation (fictional).** A water main failure contaminates the supply for three counties. Each county activates its EOC. Hospitals, long-term care facilities and dialysis centers are affected.

**How NIMS structures worked together:**
- The water utility and each county established **Unified Command** for the repair and flushing operation.
- County **EOCs** moved to **Level 1**, coordinating bottled water distribution and checking on facilities whose patients depend on water.
- The health department staffed **ESF #8** in each EOC, tracking dialysis patients and long-term care facilities, and issuing boil-water guidance.
- A **policy group** of county administrators decided how to share a limited supply of tanker trucks among the three counties.
- PIOs from the utility, counties and health department formed a **Joint Information Center**, so the public received one consistent boil-water notice in English, Spanish and Haitian Creole.
- When one county ran short of environmental health staff, the state arranged help from a neighboring county through **mutual aid**.

**Discussion:**
- Which decisions belonged to the policy group rather than to incident command?
- Why was a single joint message important?
- How would you request more environmental health inspectors?`),
      ],
    },
  ],
  finalExam: {
    title: "Introduction to NIMS — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("NIMS was established under:", ["HIPAA", "Homeland Security Presidential Directive 5", "The Affordable Care Act", "OSHA regulations"], 1, "HSPD-5 (2003) directed the creation of NIMS."),
      ms("Which are NIMS guiding principles? (Select all that apply.)", ["Flexibility", "Standardization", "Unity of effort", "Centralized federal control"], [0, 1, 2], "NIMS does not place incidents under federal control."),
      tf("NIMS applies only to large, catastrophic incidents.", false, "NIMS applies to incidents of any size or complexity."),
      mc("Describing resources by capability so requests mean the same thing everywhere is:", ["Credentialing", "Typing", "Staging", "Mutual aid"], 1, "Resource typing standardizes descriptions."),
      mc("Which agreement supports sharing personnel between states during declared emergencies?", ["EMAC", "CLAS", "PREP Act", "FERPA"], 0, "The Emergency Management Assistance Compact."),
      mc("Which comes last in the NIMS resource management process?", ["Identify requirements", "Mobilize", "Track and report", "Reimburse and restock"], 3, "Reimburse and restock follows demobilization."),
      ms("Which are NIMS command and coordination structures? (Select all that apply.)", ["Incident Command System", "Emergency Operations Centers", "MAC Groups", "Joint Information System"], [0, 1, 2, 3], "These are the four structures."),
      mc("Which structure directs tactical operations at the scene?", ["MAC Group", "Incident Command System", "Joint Information Center", "Policy group"], 1, "ICS manages on-scene tactics."),
      mc("A county EOC at Level 3 is at:", ["Full activation", "Partial activation", "Normal operations / steady state", "Closure"], 2, "Level 3 is steady state."),
      sc("Two hospitals and a shelter all need the same scarce supply of oxygen concentrators. Who should decide how to allocate them across incidents?", ["The first person who asks", "A multiagency coordination (policy) group", "The PIO", "Each shelter volunteer"], 1, "MAC Groups set priorities and allocate scarce resources among incidents."),
      mc("Several agencies with jurisdiction jointly manage an incident with one set of objectives. This is:", ["Area Command", "Unified Command", "Single Command", "Mutual aid"], 1, "Unified Command shares responsibility without giving up authority."),
      mc("Which communications principle means backup systems exist if the primary fails?", ["Interoperability", "Resilience and redundancy", "Portability", "Standardization"], 1, "Resilience and redundancy keep communications working."),
      tf("Responders should use plain language rather than codes when communicating across agencies.", true, "Plain language prevents misunderstanding."),
      mc("A Joint Information Center is:", ["A storage warehouse", "A location where PIOs from multiple agencies coordinate public information", "The Incident Command Post", "A hospital"], 1, "The JIC supports the Joint Information System."),
      sc("Your dispensing site needs 15 additional nurses. What should you do?", ["Call friends at other agencies to come", "Submit the request through your supervisor to Logistics or the EOC", "Post the request on social media", "Close part of the site without telling anyone"], 1, "Requests go through established channels to prevent duplication and maintain accountability."),
    ],
  },
};
