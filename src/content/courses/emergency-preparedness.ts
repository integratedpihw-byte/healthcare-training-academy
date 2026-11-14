import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const emergencyPreparedness: CourseContent = {
  code: "CHTA-MC-009",
  title: "Emergency Preparedness for Healthcare Workers",
  categorySlug: "mandatory-compliance",
  isRequiredByDefault: true,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "CMS Emergency Preparedness rules require initial and periodic training that differs by provider type (e.g., 42 CFR 483.73(d), 482.15(d), 484.102(d)). Configure the interval for each facility type in the Compliance Center; this course does not set one.",
  estimatedMinutes: 55,
  clinicalReviewRequired: false,
  description:
    "What every worker must know when disaster strikes: the facility emergency plan and your role in it, hurricanes and extended power outages in Florida, fire response (RACE and PASS), shelter-in-place versus evacuation, active threat response, communication and patient tracking, and returning to normal operations. Your facility's own plan and drills always take precedence.",
  targetAudience: "All staff in hospitals, nursing homes, assisted living facilities, home health and hospice agencies, clinics and other providers.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Participation in facility drills and exercises is documented separately.",
  objectives: [
    "Describe the four core elements of the CMS emergency preparedness rule and where to find your facility's plan.",
    "Prepare for hurricanes and extended power outages, including personal and family readiness.",
    "Respond to a fire using RACE and operate an extinguisher using PASS.",
    "Explain the difference between shelter-in-place and evacuation and the staff role in each.",
    "Apply Run–Hide–Fight principles during an active threat while protecting patients.",
    "Communicate and track patients and residents during and after an emergency.",
  ],
  regulatoryReferences: [
    { agency: "CMS", citation: "42 CFR 483.73", title: "Emergency preparedness — long-term care facilities", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-B/section-483.73" },
    { agency: "CMS", citation: "42 CFR 482.15", title: "Emergency preparedness — hospitals", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-B/section-482.15" },
    { agency: "CMS", citation: "42 CFR 484.102", title: "Emergency preparedness — home health agencies", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-484/subpart-B/section-484.102" },
    { agency: "AHCA", citation: "Rule 59A-36.011(3)(b), F.A.C.", title: "ALF in-service on emergency procedures", url: "https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-59A-36-011" },
  ],
  sourceReferences: [
    { title: "Emergency Preparedness Rule", publisher: "Centers for Medicare & Medicaid Services", url: "https://www.cms.gov/medicare/health-safety-standards/quality-safety-oversight-emergency-preparedness", accessedOn: ACCESSED },
    { title: "ASPR TRACIE — Healthcare Emergency Preparedness Information Gateway", publisher: "U.S. Department of Health and Human Services, ASPR", url: "https://asprtracie.hhs.gov/", accessedOn: ACCESSED },
    { title: "Active Shooter Preparedness", publisher: "Cybersecurity and Infrastructure Security Agency", url: "https://www.cisa.gov/topics/physical-security/active-shooter-preparedness", accessedOn: ACCESSED },
    { title: "Hurricane Preparedness", publisher: "Florida Division of Emergency Management", url: "https://www.floridadisaster.org/", accessedOn: ACCESSED },
    { title: "Health Care Facility Emergency Preparedness", publisher: "Florida Agency for Health Care Administration", url: "https://ahca.myflorida.com/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Your facility's emergency program",
      summary: "The CMS rule and the all-hazards plan.",
      lessons: [
        text("All-hazards planning", 9, `Medicare- and Medicaid-participating providers must maintain an emergency preparedness program with **four core elements**:
1. **Risk assessment and emergency plan** — an *all-hazards* approach based on the facility's location and population (in Florida: hurricanes, flooding, extended power loss, extreme heat, fire, infectious disease, cyberattack, active threats).
2. **Policies and procedures** — e.g., sheltering in place, evacuation, tracking patients and staff, subsistence (food, water, medical supplies, power), and arrangements with other facilities.
3. **Communication plan** — contact lists, alternate means of communication, sharing information with families and authorities while protecting privacy.
4. **Training and testing** — initial and periodic training and exercises (drills, tabletop exercises). The required frequency differs by provider type.

Florida nursing homes and ALFs also maintain a **Comprehensive Emergency Management Plan (CEMP)** reviewed by county emergency management, and must meet AHCA emergency environmental control (power and temperature) rules.

### What you need to know on day one
- Where the plan, evacuation maps, fire alarms and extinguishers are.
- Your role and who is in charge (**incident command**) — usually the administrator or charge nurse until relieved.
- How to reach your supervisor if phones are down, and when you are expected to report to work during a declared emergency.`),
      ],
    },
    {
      title: "2. Hurricanes, heat and power outages",
      summary: "Florida's most common major hazards.",
      lessons: [
        text("Before, during and after the storm", 9, `### Before
- Know your **evacuation zone** and your facility's decision timeline; evacuation decisions are made early because moving frail people is dangerous.
- Prepare a **personal and family plan** so you can work: pets, medications, child care, fuel and a go-bag. Staff who know their families are safe stay on duty.
- Facilities verify supplies (food, water, medications, oxygen, incontinence supplies), generator fuel, resident identification and records, and transportation contracts.

### During
- Follow the incident commander. Keep residents away from windows. Monitor for **heat**: older adults are highly vulnerable to heat illness; facilities must keep temperatures safe using backup power as required by AHCA rules.
- Use generators only as designed — never run a portable generator indoors (carbon monoxide).

### After
- Do not return to evacuated buildings until cleared. Watch for downed power lines, flood water (contamination and electrocution risk) and mold.
- Check on every resident and staff member and update the tracking log.

> Extended power loss after Hurricane Irma (2017) contributed to resident deaths from heat at a Florida nursing home, which led to Florida's emergency power rules for nursing homes and ALFs.`),
        check("Check your understanding: storms and power", [
          kc("ep1", "Why do facilities decide on evacuation early?", ["To give staff time off", "Because moving frail residents safely takes time and becomes dangerous as the storm nears", "Because it is cheaper", "Because the generator must be tested"], 1, "Early decisions allow safe transport and coordination with receiving facilities."),
          kc("ep2", "Where may a portable generator be operated?", ["In the kitchen with a window open", "In the garage with the door open", "Outdoors, away from doors, windows and vents", "In a resident's room"], 2, "Generators produce carbon monoxide; use them only outdoors away from openings."),
        ]),
      ],
    },
    {
      title: "3. Fire response",
      summary: "RACE, PASS and fire safety.",
      lessons: [
        text("RACE and PASS", 9, `### RACE
- **R — Rescue** anyone in immediate danger (if safe to do so).
- **A — Alarm**: pull the fire alarm and call 911 / the facility emergency number.
- **C — Contain**: close doors (and windows) to confine smoke and fire.
- **E — Extinguish** if the fire is small and you are trained, or **Evacuate** per the plan.

### PASS (portable extinguisher)
- **P — Pull** the pin.
- **A — Aim** at the base of the fire.
- **S — Squeeze** the handle.
- **S — Sweep** side to side.

Only fight a fire if it is small, you have a clear exit behind you, and you have the right extinguisher. Most healthcare buildings are designed for **defend in place**: compartments with fire doors let you move people horizontally to a safe smoke compartment before evacuating the building.

### Prevention
Keep corridors and exits clear, never prop fire doors open, report damaged cords, follow oxygen safety (no smoking or open flames near oxygen; store cylinders upright and secured).`),
      ],
    },
    {
      title: "4. Shelter, evacuation and active threats",
      summary: "Protecting people who cannot protect themselves.",
      lessons: [
        text("Evacuation and Run–Hide–Fight", 9, `### Shelter-in-place vs. evacuation
- **Shelter in place** when it is safer to stay (e.g., a hurricane where the building is rated and supplied, or a chemical release outside).
- **Evacuate** when the building is unsafe or authorities order it. Move people who are in immediate danger first, then those who are ambulatory, then those needing more assistance — or follow your plan's order.
- Send with each person: **identification, medication list and key records**, and needed equipment; **track** each person from departure to arrival.

### Active threat (Run–Hide–Fight)
- **Run** if a safe path exists; help others if you can; leave belongings.
- **Hide** if you cannot escape: lock or barricade doors, silence phones, turn off lights, stay out of view.
- **Fight** only as a last resort when your life is in imminent danger.
- When law enforcement arrives, keep hands empty and visible, and follow commands.

Healthcare workers face hard choices about patients who cannot move. Your plan should address this in advance; drills help you decide quickly.`),
        check("Check your understanding: evacuation and threats", [
          kc("ep3", "What should travel with each resident during an evacuation?", ["Nothing — speed matters most", "Identification, medication list and essential records", "All personal belongings", "Only the chart binder for the whole unit"], 1, "Identification and medical information prevent errors at the receiving site; tracking ensures no one is lost."),
          kc("ep4", "During an active threat with no safe escape route, you should:", ["Run into the hallway to look", "Hide: lock or barricade the door, silence phones and stay out of view", "Call everyone you know", "Confront the attacker immediately"], 1, "Hide when you cannot safely run; fight only as a last resort."),
        ]),
      ],
    },
    {
      title: "5. Communication and practice",
      summary: "Communicating, tracking and a case study.",
      lessons: [
        caseStudy("Case study: power fails after a storm", 9, `**Situation (fictional).** A Category 3 hurricane passes near a 60-bed assisted living facility. Utility power fails overnight. The generator runs, but the cooling system on one wing stops; by noon the hallway is 84°F. Cell service is intermittent.

**What staff did:**
1. The night supervisor (incident commander) activated the plan, assigned a staff member to check every resident hourly for signs of heat illness and fluid intake.
2. Residents from the hot wing moved to the cooled common area (horizontal relocation within the building).
3. Staff used the plan's alternate communication (a radio and a satellite phone) to reach the administrator and county emergency management, and logged each call.
4. The administrator contacted the receiving facility in the CEMP in case evacuation became necessary and notified families using the communication plan.
5. Staff documented resident locations on the tracking sheet.

**Discussion:**
- Which CMS core elements did the team use?
- What heat-illness signs would you watch for in older adults? *(Confusion, weakness, dizziness, nausea, flushed or hot dry skin, rapid pulse.)*
- What would trigger the decision to evacuate?`),
      ],
    },
  ],
  finalExam: {
    title: "Emergency Preparedness — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      ms("Which are core elements of the CMS emergency preparedness rule? (Select all that apply.)", ["Risk assessment and emergency plan", "Policies and procedures", "Communication plan", "Training and testing"], [0, 1, 2, 3], "All four are required elements."),
      mc("What does the 'C' in RACE stand for?", ["Call", "Contain", "Cool", "Collect"], 1, "Contain the fire and smoke by closing doors."),
      mc("When using a fire extinguisher, where do you aim?", ["At the top of the flames", "At the base of the fire", "At the ceiling", "At the smoke"], 1, "Aim at the base where the fuel is burning."),
      tf("Fire doors may be propped open on hot days for ventilation.", false, "Propped fire doors let smoke and fire spread; keep them closed or on approved hold-open devices."),
      mc("An 'all-hazards' approach means the plan:", ["Covers only hurricanes", "Addresses the range of emergencies likely for the facility's location and population", "Applies only to fires", "Is written by each employee"], 1, "All-hazards planning covers natural, technological and human-caused events relevant to the facility."),
      sc("A small wastebasket fire starts in an office. You have an extinguisher and a clear exit behind you, and the alarm has been pulled. What may you do?", ["Leave the door open and walk away", "Use PASS to extinguish it, then close the door and report", "Throw water on electrical equipment", "Wait for the fire department before doing anything"], 1, "Small fires may be extinguished by trained staff with a clear exit after rescue and alarm."),
      tf("Portable generators may be run indoors if a window is open.", false, "Carbon monoxide can kill; operate generators outdoors away from openings."),
      mc("What is 'defend in place'?", ["Refusing to evacuate under any circumstances", "Moving people to a protected smoke compartment within the building before full evacuation", "Locking all doors", "Fighting all fires"], 1, "Healthcare buildings use compartments to protect people who cannot move quickly."),
      mc("During evacuation, what helps prevent residents from being lost or misidentified?", ["Sending them without paperwork", "Identification and a tracking log from departure to arrival", "Letting each resident choose a destination", "Taking photos on personal phones"], 1, "Tracking and identification are required elements of the plan."),
      ms("Which signs may indicate heat illness in an older adult? (Select all that apply.)", ["New confusion", "Dizziness or weakness", "Rapid pulse", "Shivering in a cool room"], [0, 1, 2], "Confusion, weakness and rapid pulse are warning signs; heat illness may present atypically in older adults."),
      mc("In Run–Hide–Fight, fighting is:", ["The first option", "A last resort when your life is in imminent danger", "Never allowed", "Required for all staff"], 1, "Run if possible, hide if not, fight only as a last resort."),
      tf("Staff should know their facility's emergency plan, their role, and how to reach supervisors if phones fail.", true, "Knowing the plan and alternate communications is part of required training."),
      mc("Why should staff have personal and family emergency plans?", ["They are required to share them with AHCA", "So they can report for duty knowing their families are safe", "To qualify for overtime", "They are not useful"], 1, "Staff availability during disasters depends on family readiness."),
      sc("Police arrive during an active threat. You should:", ["Run toward the officers waving your arms", "Keep hands empty and visible and follow commands", "Ask officers to escort your patients first", "Point to where you think the attacker went while holding your phone"], 1, "Responding officers cannot immediately tell who is a threat; show empty hands and comply."),
      mc("What is the main purpose of drills and exercises?", ["To satisfy paperwork only", "To practice roles and find gaps in the plan before a real emergency", "To test staff loyalty", "To replace training"], 1, "Exercises test and improve the plan and staff readiness."),
    ],
  },
};
