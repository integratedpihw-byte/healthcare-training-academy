import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, FEMA_COMPLETION, FEMA_NOTICE } from "./_shared";

export const icsIntroduction: CourseContent = {
  code: "CHITA-EM-001",
  title: "Introduction to the Incident Command System (ICS 100 Topics)",
  categorySlug: "emergency-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 75,
  clinicalReviewRequired: false,
  description:
    "The Incident Command System for public health and healthcare workers: why it exists, the 14 NIMS management characteristics, the Command and General Staff, incident facilities and the Incident Action Plan, and what is expected of you when you are assigned to an incident. Covers the topics of FEMA IS-100.c. This course does not award a FEMA certificate.",
  targetAudience: "All public health, healthcare and support staff who may be assigned to an emergency response, vaccination or dispensing clinic, shelter or planned event.",
  prerequisites: [],
  completionCriteria: FEMA_COMPLETION,
  objectives: [
    "Explain what the Incident Command System is and why public health and healthcare organizations use it.",
    "Describe the 14 NIMS management characteristics that form the basis of ICS.",
    "Identify the roles of the Incident Commander, the Command Staff and the General Staff sections.",
    "Describe common incident facilities and the purpose of the Incident Action Plan and operational period.",
    "Apply ICS expectations for check-in, unity of command, accountability and demobilization to your own role.",
  ],
  regulatoryReferences: [
    { agency: "White House", citation: "HSPD-5 (2003)", title: "Management of Domestic Incidents — established NIMS", url: "https://www.dhs.gov/publication/homeland-security-presidential-directive-5" },
  ],
  sourceReferences: [
    { title: "IS-100.c: Introduction to the Incident Command System, ICS 100", publisher: "FEMA Independent Study Program", url: "https://training.fema.gov/is/courseoverview.aspx?code=IS-100.c&lang=en", accessedOn: ACCESSED },
    { title: "National Incident Management System, Third Edition (2017)", publisher: "Federal Emergency Management Agency", url: "https://www.fema.gov/emergency-managers/nims", accessedOn: ACCESSED },
    { title: "ICS Resource Center", publisher: "FEMA Emergency Management Institute", url: "https://training.fema.gov/emiweb/is/icsresource/", accessedOn: ACCESSED },
    { title: "Independent Study Program — how to access exams", publisher: "FEMA National Disaster & Emergency Management University", url: "https://training.fema.gov/is/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Why ICS exists",
      summary: "A common way to organize any incident.",
      lessons: [
        text("What ICS is and where it came from", 10, `${FEMA_NOTICE}

The **Incident Command System (ICS)** is a standardized, on-scene, all-hazards approach to managing incidents. It gives everyone who responds — from a county health department, a hospital, fire rescue, law enforcement or a volunteer group — the same organization, the same position titles and the same vocabulary.

### Why it was created
ICS grew out of the wildfires in Southern California in the 1970s. Agencies working the same fires discovered that most failures were not about equipment or courage but about **management**: unclear lines of authority, different terminology, no common plan, radios that could not talk to each other and resources that were never tracked.

### Why public health uses it
Since Homeland Security Presidential Directive 5 (2003), federal policy has required the **National Incident Management System (NIMS)**, and ICS is the part of NIMS used to manage an incident at the scene. In public health you will see ICS used for:
- Hurricanes and special-needs shelters
- Disease outbreaks and exposure investigations
- Mass vaccination and medication dispensing clinics
- Boil-water notices, heat emergencies and environmental releases
- Large **planned events**, such as a festival or a community health fair

Hospitals use the **Hospital Incident Command System (HICS)**, which applies the same ICS principles to a healthcare facility.

### What ICS is not
ICS does not replace your agency's authority or your professional license. It is a way of organizing people and resources so that they work toward the same objectives without getting in each other's way.`),
        check("Check your understanding: what ICS is", [
          kc("ics1", "Which statement best describes the Incident Command System?", ["A federal agency that takes over local incidents", "A standardized, on-scene, all-hazards approach to managing incidents", "A software program for tracking patients", "A plan used only for fires"], 1, "ICS is a standardized management approach for incidents of any type or size."),
          kc("ics2", "Which of these could be managed using ICS? (Select all that apply.)", ["A mass vaccination clinic", "A hurricane shelter", "A measles exposure investigation", "A planned community health fair"], [0, 1, 2, 3], "ICS applies to emergencies and planned events of any size."),
        ]),
      ],
    },
    {
      title: "2. The 14 NIMS management characteristics",
      summary: "The features that make ICS work.",
      lessons: [
        text("The characteristics, one by one", 14, `ICS is built on **14 NIMS management characteristics**:

1. **Common terminology** — plain language for organizational functions, facilities, resources and position titles. No radio codes or agency jargon.
2. **Modular organization** — the structure expands and contracts with the size and complexity of the incident. Only the positions that are needed are filled.
3. **Management by objectives** — the Incident Commander sets measurable objectives; every activity supports them.
4. **Incident action planning** — objectives, strategies and assignments are captured in an **Incident Action Plan (IAP)** for each operational period.
5. **Manageable span of control** — the number of people or resources one supervisor can manage effectively (see module 4).
6. **Incident facilities and locations** — designated places such as the Incident Command Post and Staging Areas.
7. **Comprehensive resource management** — identifying, ordering, tracking and returning people, teams, equipment and supplies.
8. **Integrated communications** — a common communications plan and interoperable equipment and procedures.
9. **Establishment and transfer of command** — command is established at the start of an incident, and transferred with a full briefing when leadership changes.
10. **Unified Command** — when several agencies or jurisdictions share responsibility, their leaders work together to set one set of objectives, without giving up their own authority.
11. **Chain of command and unity of command** — authority flows through the organization in an orderly line; **each person reports to only one supervisor**.
12. **Accountability** — checking in, following the IAP, staying within your span, keeping records of your actions, and checking out.
13. **Dispatch/deployment** — resources respond only when requested and dispatched through established channels. **Self-dispatching** creates confusion and safety risks.
14. **Information and intelligence management** — gathering, analyzing and sharing incident information appropriately.

### Plain language in public health
Say "the Hillsborough County vaccination site needs 2,000 more doses by 1400" rather than using program acronyms or internal codes. Responders from other agencies — and the public — must understand you the first time.`),
        check("Check your understanding: characteristics", [
          kc("ics3", "A nurse is assigned to a dispensing clinic. How many supervisors should she take assignments from?", ["As many as ask her", "One — her assigned supervisor", "Two — her agency manager and the incident commander", "None; she works independently"], 1, "Unity of command: each person reports to only one supervisor."),
          kc("ics4", "A health department employee hears about a shelter opening and drives there to help without being requested. This is:", ["Encouraged initiative", "Self-dispatching, which ICS discourages", "Unified Command", "Required by NIMS"], 1, "Resources should respond only when requested and dispatched through established channels."),
          kc("ics5", "Why does ICS insist on common terminology and plain language?", ["To shorten radio messages", "So responders from different agencies understand each other the first time", "Because codes are illegal", "To avoid writing reports"], 1, "Agency-specific codes and jargon cause misunderstandings across organizations."),
        ]),
      ],
    },
    {
      title: "3. The ICS organization",
      summary: "Incident Commander, Command Staff and General Staff.",
      lessons: [
        text("Who does what", 12, `### Incident Commander (IC)
The IC has overall responsibility for the incident: setting objectives and priorities, approving the IAP and ordering and releasing resources. **The IC performs every function that has not been delegated.** On a small incident the IC may do everything; on a large one the IC delegates to the Command Staff and General Staff. The IC may have one or more **Deputies**.

### Command Staff (report directly to the IC)
- **Public Information Officer (PIO)** — the single point for releasing information to the public and media, and for monitoring rumors and public reaction.
- **Safety Officer** — monitors conditions and has authority to **stop or prevent unsafe acts**.
- **Liaison Officer** — the point of contact for representatives of other agencies and organizations who are not part of Unified Command.

### General Staff (the sections)
- **Operations Section** — directs the tactical work that achieves the objectives (for example, running dispensing sites, conducting interviews, staffing shelters).
- **Planning Section** — collects and evaluates information, tracks resources, prepares the IAP and maintains documentation.
- **Logistics Section** — provides facilities, services, supplies, food, transportation and communications equipment.
- **Finance/Administration Section** — tracks costs, time, procurement and compensation/claims.

An **Intelligence/Investigations** function may be added when an incident needs it — for example, a suspected deliberate contamination.

### Remember
- ICS positions are filled based on **qualifications**, not rank in your home agency. A program manager may work as a dispensing site staff member; a staff epidemiologist may serve as a Planning Section Chief.
- Titles are standard: *Officer* for Command Staff and *Section Chief* for General Staff.`),
        check("Check your understanding: organization", [
          kc("ics6", "Which position has authority to stop an unsafe act?", ["Liaison Officer", "Safety Officer", "Finance/Administration Section Chief", "Any member of the public"], 1, "The Safety Officer monitors conditions and can stop or prevent unsafe acts."),
          kc("ics7", "Which section prepares the Incident Action Plan and tracks resources?", ["Operations", "Planning", "Logistics", "Finance/Administration"], 1, "The Planning Section collects information, tracks resources and prepares the IAP."),
          kc("ics8", "On a small incident where no positions have been delegated, who performs the Logistics function?", ["Nobody", "The Incident Commander", "The PIO", "The state"], 1, "The Incident Commander performs all functions that have not been delegated."),
        ]),
      ],
    },
    {
      title: "4. Facilities, span of control and the Incident Action Plan",
      summary: "Where the incident is run and how the plan works.",
      lessons: [
        text("Facilities and the IAP", 12, `### Common incident facilities
- **Incident Command Post (ICP)** — where the IC and Command Staff work. There is only one ICP per incident, even under Unified Command.
- **Staging Area** — where resources wait, ready for assignment (for example, nurses and supplies waiting to open a second dispensing line).
- **Base** — where primary logistics and administrative functions are located.
- **Camp** — where resources may be housed and fed when the base cannot serve them.
- **Helibase** and **Helispot** — locations for helicopter operations.

### Span of control
Span of control is the number of people or resources a single supervisor can manage effectively. In ICS it typically ranges from about **three to seven**, and **one supervisor to five** is often used as a guideline. When a supervisor has too many direct reports, add a layer (for example, split a dispensing site into two lines with a leader each). Complex or hazardous work may need a narrower span.

### Management by objectives and the IAP
The IC sets **objectives** that are specific and measurable — for example, "Dispense prophylaxis to all 1,200 exposed employees by 1800 Thursday." Strategies and tactics follow from the objectives.

The **Incident Action Plan** captures, for one **operational period** (often 12 or 24 hours):
- Incident objectives
- Organization and assignments
- Communications plan
- Safety and medical plans

On small incidents the IAP may be **oral**. Larger incidents use a **written IAP**, assembled from standard ICS forms. Incidents involving **hazardous materials require a written IAP**.

### ICS forms you may see
- **ICS 201** Incident Briefing — the first summary of the situation and actions.
- **ICS 202** Incident Objectives
- **ICS 204** Assignment List — who does what, where, during the operational period.
- **ICS 211** Check-In List
- **ICS 214** Activity Log — your record of what you did and when.`),
        check("Check your understanding: facilities and the IAP", [
          kc("ics9", "Twelve nurses report to the dispensing-site supervisor directly. What should be done?", ["Nothing; there is no limit", "Add a layer of leaders so each supervises a manageable number", "Send half the nurses home", "Have the Liaison Officer supervise them"], 1, "Twelve direct reports exceeds a manageable span of control; add supervisors."),
          kc("ics10", "Where do resources wait until they are assigned?", ["The Incident Command Post", "A Staging Area", "The Base", "The Joint Information Center"], 1, "Staging Areas hold resources that are available for assignment."),
          kc("ics11", "Which incidents always require a written Incident Action Plan?", ["All incidents", "Incidents involving hazardous materials", "Incidents with fewer than 10 responders", "Only planned events"], 1, "Hazardous materials incidents require a written IAP; small incidents may use an oral IAP."),
        ]),
      ],
    },
    {
      title: "5. Your role on an incident",
      summary: "What every assigned worker must do.",
      lessons: [
        text("From check-in to check-out", 10, `When you are deployed to an incident — even one in your own building — you are expected to:

1. **Receive your assignment before you leave.** Know your job, where to report, when, who your supervisor is, how you will communicate and any special instructions (safety equipment, credentials, travel).
2. **Check in** at the designated location (ICS 211). Check-in is how the incident knows who is there and keeps you safe.
3. **Report to your supervisor** and work only on the tasks you are assigned. Take direction from one supervisor.
4. **Use plain language** and the communications plan.
5. **Keep records** of your actions and decisions (ICS 214), including times.
6. **Raise safety concerns** immediately to your supervisor or the Safety Officer.
7. **Stay within your scope** — your license, training and assignment.
8. **Do not speak to the media** unless the PIO has authorized you; refer questions to the PIO.
9. **Demobilize properly**: complete your work, return equipment, turn in records, take part in a debrief and **check out**.

### Taking care of yourself
Long shifts, emotional situations and disrupted sleep are common. Eat, hydrate, rest and tell your supervisor if you cannot continue safely. Your health is part of incident safety.`),
        caseStudy("Case study: a county exposure clinic", 10, `**Situation (fictional).** A county health department learns that 900 employees at a food processing plant were exposed to a co-worker with confirmed **measles**. The Health Officer establishes command and opens an exposure clinic at the plant the next morning to review immunity and offer vaccine.

**What happened:**
- The Health Officer was the **Incident Commander** and wrote three objectives: verify immunity status for all exposed workers within 72 hours; vaccinate eligible susceptible workers within 72 hours of exposure where possible; issue exclusion guidance to non-immune workers who could not be vaccinated.
- An epidemiologist served as **Planning Section Chief**, tracking the exposed list and producing a written IAP for each 12-hour operational period.
- A nursing supervisor became **Operations Section Chief**, with two **clinic line leaders** each supervising five staff.
- The plant's human resources manager joined as an agency representative through the **Liaison Officer**.
- A reporter arrived at the clinic and asked a nurse how many workers were infected. The nurse said, "I can't answer that, but our Public Information Officer can," and gave the PIO's contact.

**Discussion:**
- Which NIMS characteristics can you identify? *(Management by objectives, IAP, span of control, unity of command, Liaison, PIO.)*
- Why was the nurse right to refer the reporter?
- What should staff do at the end of their shift? *(Turn in logs and records, return supplies, take part in a debrief and check out.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Introduction to ICS — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("The Incident Command System is best described as:", ["A federal takeover procedure", "A standardized, on-scene, all-hazards approach to incident management", "A hospital billing system", "A list of emergency phone numbers"], 1, "ICS is a standardized management approach usable for any incident."),
      tf("ICS can be used for planned events, such as a large community vaccination clinic.", true, "ICS applies to emergencies and planned events."),
      mc("Unity of command means:", ["Every agency has one vote", "Each person reports to only one supervisor", "The Incident Commander supervises everyone directly", "Only one agency may respond"], 1, "Each individual reports to one designated supervisor."),
      mc("Which position releases information to the public and media?", ["Safety Officer", "Liaison Officer", "Public Information Officer", "Planning Section Chief"], 2, "The PIO is the single point for public and media information."),
      ms("Which are General Staff sections? (Select all that apply.)", ["Operations", "Planning", "Logistics", "Finance/Administration"], [0, 1, 2, 3], "These four sections make up the General Staff; Intelligence/Investigations may be added."),
      mc("Who performs any ICS function that has not been delegated?", ["The Safety Officer", "The Incident Commander", "The state emergency manager", "The first person to arrive"], 1, "The IC retains responsibility for every function not delegated."),
      mc("Which section provides supplies, facilities, food and communications equipment?", ["Operations", "Planning", "Logistics", "Finance/Administration"], 2, "Logistics provides support resources and services."),
      sc("A supervisor at a shelter has eleven volunteers reporting directly to her and cannot keep track of them. What is the ICS solution?", ["Ask the volunteers to supervise themselves", "Add leaders so each supervises a manageable number of people", "Close the shelter", "Send the extra volunteers home without checking out"], 1, "Restore a manageable span of control by adding a layer of supervision."),
      mc("What does an Incident Action Plan cover?", ["The entire incident from start to finish", "Objectives, assignments, communications and safety for one operational period", "Only the budget", "Only the names of volunteers"], 1, "The IAP is written for an operational period."),
      tf("An Incident Action Plan for a hazardous materials incident may always be oral.", false, "Hazardous materials incidents require a written IAP."),
      mc("Responding to an incident without being requested through established channels is called:", ["Mutual aid", "Self-dispatching", "Unified Command", "Staging"], 1, "Self-dispatching is discouraged because it disrupts accountability and safety."),
      mc("Where do resources wait while available for assignment?", ["Incident Command Post", "Staging Area", "Camp", "Joint Field Office"], 1, "Staging Areas hold available resources."),
      sc("A reporter asks you, a clinic nurse, how many people are sick. What should you do?", ["Give your best estimate", "Refer the reporter to the Public Information Officer", "Tell the reporter to leave without explanation", "Post the number on social media"], 1, "Only the PIO or authorized spokespersons release information."),
      mc("Unified Command is used when:", ["The IC is on break", "Multiple agencies or jurisdictions share responsibility for an incident", "An incident is very small", "Volunteers outnumber staff"], 1, "Agency leaders jointly set objectives while keeping their own authority."),
      ms("Which actions are part of your accountability on an incident? (Select all that apply.)", ["Checking in", "Keeping an activity log", "Following your assignment", "Checking out at demobilization"], [0, 1, 2, 3], "Accountability runs from check-in to check-out."),
    ],
  },
};
