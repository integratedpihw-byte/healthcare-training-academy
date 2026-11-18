import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, FEMA_COMPLETION, FEMA_NOTICE } from "./_shared";

export const icsInitialResponse: CourseContent = {
  code: "CHITA-EM-002",
  title: "ICS for Initial Response and Single Resources (ICS 200 Topics)",
  categorySlug: "emergency-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 90,
  clinicalReviewRequired: false,
  description:
    "Builds on ICS 100 for staff who may lead a team, a site or a single resource during the first hours of an incident: leadership and accountability, delegation of authority, management by objectives, ICS positions and resource types, briefings, transfer of command, and demobilization. Covers the topics of FEMA IS-200.c (Basic Incident Command System for Initial Response). This course does not award a FEMA certificate.",
  targetAudience: "Supervisors, team leads, site leads and anyone who may take charge of a small team, clinic line, shelter unit or field team during a response.",
  prerequisites: ["CHITA-EM-001"],
  completionCriteria: FEMA_COMPLETION,
  objectives: [
    "Describe leadership and accountability expectations for supervisors in ICS.",
    "Explain delegation of authority and management by objectives, including incident priorities.",
    "Identify ICS position titles, organizational elements and resource terms such as strike team and task force.",
    "Describe the types of briefings and the steps of a transfer of command.",
    "Explain how ICS organizations expand, contract and demobilize as incident complexity changes.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    { title: "IS-200.c: Basic Incident Command System for Initial Response, ICS 200", publisher: "FEMA Independent Study Program", url: "https://training.fema.gov/is/courseoverview.aspx?code=IS-200.c&lang=en", accessedOn: ACCESSED },
    { title: "National Incident Management System, Third Edition (2017)", publisher: "Federal Emergency Management Agency", url: "https://www.fema.gov/emergency-managers/nims", accessedOn: ACCESSED },
    { title: "ICS Forms", publisher: "FEMA Emergency Management Institute", url: "https://training.fema.gov/icsresource/icsforms.aspx", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Leadership and accountability",
      summary: "What ICS expects of the people in charge.",
      lessons: [
        text("Leading in an incident", 12, `${FEMA_NOTICE}

### Chain of command and unity of command
**Chain of command** is the orderly line of authority within the organization. **Unity of command** means every person reports to one supervisor. Together they prevent conflicting orders and make sure every assignment can be traced.

Unity of command does not stop people from **sharing information** across the organization — it means direction comes through one supervisor.

### What every supervisor must know before deploying staff
Each person should receive:
- Their assignment and where to report
- Who their supervisor is
- Reporting time and travel instructions
- How they will communicate
- Special instructions, safety equipment and any credentials needed

### Common responsibilities of supervisors
- Brief your staff and make sure they understand the objectives and the safety message.
- Keep your span of control manageable — typically about three to seven, with one to five often used as a guideline.
- Track your people and their work; record actions and decisions on an **ICS 214 Activity Log**.
- Report progress and problems through your chain of command.
- **Stop unsafe actions** and report safety concerns.
- Model integrity: follow the plan, give credit, be honest about problems.

### Leadership values
FEMA's ICS training emphasizes **duty, respect and integrity**: take responsibility for your assignment and your people, treat others well and be honest. A good incident leader communicates the *why* behind the task and listens to the people doing the work.`),
        check("Check your understanding: leadership", [
          kc("ir1", "Does unity of command prevent staff from sharing information with other units?", ["Yes, all information must go through the IC", "No — direction comes through one supervisor, but information can be shared", "Yes, sharing information is a violation", "Only during the first hour"], 1, "Unity of command is about direction, not about limiting information sharing."),
          kc("ir2", "Which items should staff receive before deploying? (Select all that apply.)", ["Assignment and reporting location", "Supervisor's name", "Communication instructions", "Special instructions and safety equipment"], [0, 1, 2, 3], "All of these are part of a complete assignment."),
        ]),
      ],
    },
    {
      title: "2. Delegation of authority and management by objectives",
      summary: "Who is in charge, and what they are trying to achieve.",
      lessons: [
        text("Authority and objectives", 12, `### Delegation of authority
Authority to manage an incident belongs to the **agency or jurisdiction** responsible for it — for example, a county or the state health department. That authority is delegated to the Incident Commander. For routine incidents within an agency, the delegation is usually part of standard procedures. For complex incidents, or when an Incident Commander comes from outside the jurisdiction, a **written delegation of authority** states:
- The legal authority and the IC's responsibilities
- Priorities and expectations
- Constraints and limits (for example, spending authority)
- Requirements for reporting back to the agency executive

### Incident priorities
Across ICS, objectives follow three general priorities:
1. **Life safety** — responders and the public
2. **Incident stabilization**
3. **Property and environmental preservation**

### Objectives, strategies and tactics
- **Objectives** state what must be achieved. Good objectives are specific, measurable, achievable, relevant and time-bound — for example, "Open two special-needs shelters with capacity for 300 residents by 1800 today."
- **Strategies** describe the general approach.
- **Tactics** are the specific actions assigned to resources.

Every assignment in the Incident Action Plan should trace back to an objective. If you cannot see how your task supports an objective, ask your supervisor.`),
        check("Check your understanding: objectives", [
          kc("ir3", "What is the first incident priority?", ["Property preservation", "Incident stabilization", "Life safety", "Cost control"], 2, "Life safety for responders and the public comes first."),
          kc("ir4", "Which is a well-written incident objective?", ["Help as many people as possible", "Do vaccinations", "Vaccinate 600 eligible residents at the fairgrounds site by 1900 Saturday", "Be safe"], 2, "It is specific, measurable and time-bound."),
        ]),
      ],
    },
    {
      title: "3. ICS positions, elements and resources",
      summary: "Titles, building blocks and resource terms.",
      lessons: [
        text("The building blocks", 14, `### Standard position titles
| Organizational level | Title |
|---|---|
| Incident command | Incident Commander |
| Command Staff | Officer (PIO, Safety, Liaison) |
| Section | Section Chief |
| Branch | Director |
| Division or Group | Supervisor |
| Unit (within Planning, Logistics or Finance/Admin) | Leader |
| Strike Team or Task Force | Leader |
| Single resource | Boss or Leader |

Standard titles let anyone — from any agency — know a person's role and level of authority without knowing their home job title.

### Organizational elements in Operations
- **Divisions** organize work by **geography** (for example, North Shelter, East Shelter).
- **Groups** organize work by **function** (for example, Medical Screening Group, Vaccination Group).
- **Branches** are used when the number of divisions or groups exceeds span of control, or when work is split by jurisdiction or function.

### Resource terms
- **Single resource** — an individual, a piece of equipment and its personnel, or an established team with an identified supervisor.
- **Strike team** — a set number of resources of the **same kind and type** with common communications and a leader (for example, five ambulances).
- **Task force** — a combination of **mixed** resources assembled for a particular task, with common communications and a leader (for example, a nurse, an epidemiologist, an environmental health specialist and a driver for a field investigation).

### Resource status
- **Assigned** — working on an assignment
- **Available** — ready for assignment
- **Out of service** — not ready (for example, rest, maintenance, no staff)

**Kind** describes what a resource is (for example, a vaccination team); **type** describes its capability or size, with Type 1 being the most capable.`),
        check("Check your understanding: positions and resources", [
          kc("ir5", "A unit that organizes work by function, such as vaccination, is called a:", ["Division", "Group", "Camp", "Base"], 1, "Groups are functional; divisions are geographic."),
          kc("ir6", "What do you call a mix of different resources assembled for one task with a common leader?", ["Strike team", "Task force", "Single resource", "Branch"], 1, "Task forces combine different kinds of resources."),
          kc("ir7", "The title for a person in charge of a Division is:", ["Director", "Chief", "Supervisor", "Officer"], 2, "Division and Group leaders are Supervisors."),
        ]),
      ],
    },
    {
      title: "4. Briefings and transfer of command",
      summary: "Keeping everyone informed when the situation or the leader changes.",
      lessons: [
        text("Briefings and handoffs", 12, `### Types of briefings
- **Staff-level briefings** — a supervisor briefs the team they lead at the start of an assignment or shift.
- **Field-level briefings** — delivered to individuals or crews at the work site.
- **Section-level briefings** — delivered to an entire section (for example, the Operations Section).
- **Operational period briefing** — held at the start of each operational period to present the Incident Action Plan to supervisors.

A good briefing is short and covers: the current situation, objectives, assignments, safety concerns, communications and what to do if things change.

### Transfer of command
Command is transferred when a more qualified person arrives, the incident changes in complexity, a jurisdiction or agency changes, or for normal turnover such as shift changes. A transfer should always include:
1. A **face-to-face briefing** whenever possible from the outgoing to the incoming Incident Commander.
2. A review of the situation, objectives, current organization, resource assignments, safety issues and communications — often using the **ICS 201 Incident Briefing** form.
3. **Notification** to all personnel that command has changed, and when.
4. **Documentation** of the transfer time.

The arrival of a more senior person does not by itself mean command has transferred; transfer happens only after the briefing and announcement.`),
        check("Check your understanding: briefings", [
          kc("ir8", "A senior manager arrives at the incident. When does command transfer to her?", ["Immediately on arrival", "After a transfer-of-command briefing and notification to staff", "Only at midnight", "Never — command cannot be transferred"], 1, "Transfer happens after a briefing and an announcement."),
          kc("ir9", "Which form is commonly used to brief an incoming Incident Commander?", ["ICS 201 Incident Briefing", "ICS 214 Activity Log", "ICS 211 Check-In List", "ICS 206 Medical Plan"], 0, "The ICS 201 summarizes the situation, objectives, organization and resources."),
        ]),
      ],
    },
    {
      title: "5. Expanding, contracting and demobilizing",
      summary: "Matching the organization to the incident.",
      lessons: [
        text("Complexity and demobilization", 10, `### Incident complexity
Incidents are often described by **type**, from **Type 5** (the least complex — handled by a few resources within one operational period) to **Type 1** (the most complex — requiring national resources, multiple operational periods and a large organization). Complexity depends on size, hazards, the number of agencies involved, public and political attention, and how long the incident will last.

The ICS organization **expands** by adding positions only as they are needed and **contracts** as work is completed. Expanding too slowly overwhelms supervisors; expanding too fast wastes resources and confuses roles.

### Demobilization
Demobilization begins with planning early in the incident. When you are released:
- Complete or hand off your work, with a briefing to whoever takes over.
- Return equipment and supplies.
- Turn in your Activity Log and any records.
- Take part in a **debrief** — what went well, what did not, safety issues.
- **Check out** following the demobilization plan, and follow any travel and rest instructions.

Your observations help the after-action report and the improvement plan for the next response.`),
        caseStudy("Case study: the first hours of a shelter operation", 10, `**Situation (fictional).** A tropical storm floods neighborhoods overnight. The county opens a general population shelter at a high school at 0400. A health department nurse, Lena, is the first public health staff member on site and is asked by the county emergency manager to lead the shelter's health services.

**What Lena did:**
1. Confirmed she was reporting to the **Shelter Manager** (one supervisor) and received her assignment: screen arrivals for medical needs and refer residents who need a special-needs shelter or hospital.
2. Gave a **staff-level briefing** to the three nurses who arrived at 0500: objectives, safety (wet floors, infection control), how to reach her and when the next briefing would be.
3. When eight volunteers arrived, she organized them into a **Screening Group** and a **First Aid Group**, each with a leader, so she supervised two people instead of eleven.
4. Recorded actions and times on an **ICS 214**.
5. At 1600, a health department supervisor arrived to take over. Lena gave a **face-to-face transfer briefing** using her notes, the Shelter Manager announced the change, and Lena documented the time, turned in her log and **checked out**.

**Discussion:**
- Which ICS principles did Lena apply?
- What would have happened if the volunteers had all reported directly to her?
- What should be included in her handoff briefing?`),
      ],
    },
  ],
  finalExam: {
    title: "ICS for Initial Response — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Chain of command refers to:", ["The order in which resources arrive", "The orderly line of authority within the organization", "The list of phone numbers", "The sequence of operational periods"], 1, "Chain of command is the line of authority."),
      tf("Unity of command prohibits sharing information with other units.", false, "Direction comes through one supervisor; information can be shared."),
      mc("A written delegation of authority is most likely needed when:", ["A routine task is assigned within an agency", "An incident is complex or the IC comes from outside the jurisdiction", "A volunteer checks in", "A shift ends"], 1, "Complex incidents and outside ICs need a written delegation."),
      mc("Put the incident priorities in order:", ["Property, life safety, stabilization", "Life safety, incident stabilization, property and environmental preservation", "Stabilization, cost, life safety", "Environment, property, life safety"], 1, "Life safety comes first."),
      mc("Which describes a tactic rather than an objective?", ["Reduce new cases to zero within 30 days", "Assign two nurses to administer vaccine at Table 3", "Protect all shelter residents from heat illness", "Open shelters for 300 people by 1800"], 1, "Tactics are specific actions assigned to resources."),
      mc("A unit organized by geographic area is a:", ["Group", "Division", "Branch", "Strike team"], 1, "Divisions are geographic."),
      mc("A set number of resources of the same kind and type with a common leader is a:", ["Task force", "Strike team", "Single resource", "Section"], 1, "Strike teams are same kind and type."),
      ms("Which are standard resource statuses? (Select all that apply.)", ["Assigned", "Available", "Out of service", "Self-dispatched"], [0, 1, 2], "Self-dispatched is not a status — it is discouraged."),
      mc("The title for the leader of a Branch is:", ["Supervisor", "Director", "Chief", "Officer"], 1, "Branches are led by Directors."),
      mc("A briefing given to a crew at the work site is a:", ["Section-level briefing", "Field-level briefing", "Operational period briefing", "Press briefing"], 1, "Field-level briefings occur at the work site."),
      sc("You are the site lead and a more senior manager arrives and starts giving orders before any briefing. What should happen?", ["Staff follow both of you", "Pause and conduct a transfer-of-command briefing, then announce the change", "Ignore the manager", "Leave the site immediately"], 1, "Command transfers after a briefing and announcement, preventing conflicting orders."),
      ms("A transfer of command should include: (Select all that apply.)", ["A briefing, face to face when possible", "Review of objectives, organization and safety issues", "Notification to all personnel", "Documentation of the time"], [0, 1, 2, 3], "All four are expected."),
      mc("Which incident type is the least complex?", ["Type 1", "Type 3", "Type 5", "Type 10"], 2, "Type 5 is the least complex; Type 1 is the most complex."),
      tf("Demobilization planning should begin early in the incident.", true, "Planning release and check-out early prevents confusion and unsafe travel."),
      sc("At the end of your assignment you are tired and want to leave quickly. What must you do before leaving?", ["Nothing — just go", "Hand off work, return equipment, turn in your log, debrief and check out", "Post photos of the incident online", "Take the equipment home to return later"], 1, "Proper demobilization maintains accountability and safety."),
    ],
  },
};
