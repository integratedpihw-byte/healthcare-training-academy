import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const floridaAlfStaffOrientation: CourseContent = {
  code: "CHTA-FP-001",
  title: "Florida Assisted Living Facility Staff Orientation",
  categorySlug: "facility-programs",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "One-time preservice orientation of at least 2 hours under s. 429.52(1), F.S., completed before interacting with residents. In-service topics under Rule 59A-36.011(3), F.A.C. are separate requirements tracked in the Compliance Center.",
  estimatedMinutes: 120,
  clinicalReviewRequired: true,
  description:
    "A preservice orientation for new employees of Florida assisted living facilities (ALFs), designed to support the 2-hour orientation required by s. 429.52(1), F.S., which must 'cover topics that help the employee provide responsible care and respond to the needs of facility residents.' Covers the ALF setting and your role, resident rights and dignity, recognizing and reporting abuse, infection control basics, emergencies and elopement, supporting daily living and residents with dementia, medication assistance limits, documentation and confidentiality, and incident reporting. Your facility adds its own policies and must keep a signed statement of completion.",
  targetAudience: "All new ALF employees who have not previously completed core training — caregivers, med techs, dietary, housekeeping, activities, maintenance and administrative staff.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher, then sign the facility's orientation statement with the administrator (kept in your personnel file). This orientation does not replace the in-service trainings, the Department of Elder Affairs dementia training, the HIV/AIDS course or medication-assistance training, which are tracked separately.",
  objectives: [
    "Describe the ALF setting in Florida and your role on the care team.",
    "Respect resident rights, dignity, choice and privacy in daily work.",
    "Recognize and report suspected abuse, neglect and exploitation to the Florida Abuse Hotline.",
    "Apply infection control basics and know your facility's emergency and elopement procedures.",
    "Support residents with activities of daily living and dementia-related needs safely.",
    "Explain the limits on medication assistance and document and report incidents correctly.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "s. 429.52(1), F.S.", title: "ALF staff preservice orientation", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0429/Sections/0429.52.html" },
    { agency: "Florida Legislature", citation: "s. 429.28, F.S.", title: "Resident bill of rights", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0429/Sections/0429.28.html" },
    { agency: "Florida Legislature", citation: "s. 429.256, F.S.", title: "Assistance with self-administration of medication", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0429/Sections/0429.256.html" },
    { agency: "AHCA", citation: "Rule 59A-36.011, F.A.C.", title: "ALF staff training requirements", url: "https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-59A-36-011" },
    { agency: "Florida Legislature", citation: "s. 430.5025, F.S.", title: "Dementia-related training", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0430/Sections/0430.5025.html" },
  ],
  sourceReferences: [
    { title: "Section 429.52, Florida Statutes — Staff training and educational requirements", publisher: "Florida Legislature", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0429/Sections/0429.52.html", accessedOn: ACCESSED },
    { title: "Assisted Living Facilities", publisher: "Florida Agency for Health Care Administration", url: "https://ahca.myflorida.com/health-care-policy-and-oversight/bureau-of-health-facility-regulation/assisted-living-facilities", accessedOn: ACCESSED },
    { title: "Florida Abuse Hotline", publisher: "Florida Department of Children and Families", url: "https://www.myflfamilies.com/services/abuse/abuse-hotline", accessedOn: ACCESSED },
    { title: "Florida Long-Term Care Ombudsman Program", publisher: "Florida Department of Elder Affairs", url: "https://ombudsman.elderaffairs.org/", accessedOn: ACCESSED },
    { title: "Dementia Care and Cure Initiative / Training resources", publisher: "Florida Department of Elder Affairs", url: "https://elderaffairs.org/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Welcome to assisted living in Florida",
      summary: "The ALF setting, licensure and your role.",
      lessons: [
        text("What an ALF is and who we serve", 15, `An **assisted living facility** provides housing, meals and one or more **personal services** (help with activities of daily living such as bathing, dressing, eating, toileting and walking), along with supervision, to adults who do not need ongoing nursing-home–level care. ALFs in Florida are licensed and inspected by the **Agency for Health Care Administration (AHCA)** under **part I of chapter 429, F.S.**, and Rule chapter 59A-36, F.A.C. Some ALFs hold additional licenses — **limited nursing services**, **extended congregate care**, or **limited mental health**.

### The resident is at home
For residents, the ALF **is their home**. Our job is to support independence, choice and dignity while keeping people safe.

### Your role
Every employee — caregiver, cook, housekeeper, receptionist — sees and hears what residents experience. Everyone:
- Treats residents with respect and protects their privacy
- Notices changes (eating less, new confusion, falls, bruises, sadness) and **tells the supervisor**
- Follows policies for infection control, emergencies and confidentiality
- Reports suspected abuse

### Your training path
This orientation is the **first step**. Depending on your job, you will also complete in-service training (infection control, emergency procedures, resident rights and abuse reporting, resident behavior and daily living, food handling, elopement response), the Department of Elder Affairs **dementia training**, the **HIV/AIDS** course, and — only if you will assist with medications — the separate **medication assistance** training taught by a nurse or pharmacist. Florida training requirements may change; your administrator will tell you about updates.

At the end of orientation, **you and the administrator sign a statement** that you completed it; the facility keeps it in your personnel file.`),
      ],
    },
    {
      title: "2. Resident rights and abuse reporting",
      summary: "Dignity, choice and the duty to report.",
      lessons: [
        text("Rights and reporting", 20, `### Resident bill of rights (s. 429.28, F.S.) — highlights
Residents have the right to:
- Live in a safe and decent environment, **free from abuse and neglect**
- Be treated with **consideration and respect** and with due recognition of personal dignity, individuality and privacy
- Retain and use their own clothes and possessions; **manage their own money** or choose who will
- Share a room with a spouse who is also a resident; private communication, mail and phone calls; visitors
- Participate in social, religious and community activities
- Have **access to adequate and appropriate health care**, and choose their providers and pharmacy
- At least **45 days' notice** of relocation or termination of residency (with limited exceptions)
- **Present grievances** and recommend changes without fear of retaliation; contact the **Long-Term Care Ombudsman**, AHCA and other agencies (contact information is posted in the facility)

### Abuse, neglect and exploitation
You are a **mandatory reporter**. If you **know or have reasonable cause to suspect** that a resident is being abused, neglected or exploited — by anyone, including staff, family or another resident — you must report to the **Florida Abuse Hotline: 1-800-96-ABUSE (1-800-962-2873)** or online, and tell your supervisor per policy. **Call 911** if someone is in immediate danger. Telling your supervisor does not replace your duty to report. Good-faith reporters are protected; retaliation is prohibited.

Examples to report: unexplained bruises or injuries, a resident who is afraid of a caregiver, missing money or belongings, residents left soiled or without food or water, rough handling, threats or humiliation, demeaning photos posted online.`),
        check("Check your understanding: rights and reporting", [
          kc("alf1", "A resident wants to keep her own furniture and photos in her room. This is:", ["Against the rules", "Her right, within safety and space limits", "Only allowed on weekends", "Up to her family"], 1, "Residents may retain and use personal possessions."),
          kc("alf2", "You suspect a coworker is taking money from a resident's purse. What must you do?", ["Confront the coworker", "Report to the Florida Abuse Hotline and notify your supervisor per policy", "Wait until you have proof", "Tell the resident to hide her purse"], 1, "Reasonable suspicion of exploitation must be reported."),
        ]),
      ],
    },
    {
      title: "3. Safety: infection control, emergencies and elopement",
      summary: "Keeping residents and coworkers safe.",
      lessons: [
        text("Infection control and emergency basics", 25, `### Infection control basics
- **Hand hygiene**: before and after resident contact, before handling food, after removing gloves, after using the restroom. Use soap and water when hands are visibly dirty and for diarrheal illness.
- Use **gloves** for contact with blood, body fluids, broken skin or soiled items; change gloves between residents and perform hand hygiene.
- Cover coughs and sneezes; **stay home when ill** (fever, vomiting, diarrhea) and tell your supervisor.
- Clean shared equipment and high-touch surfaces as scheduled.
- Report residents with new fever, cough, vomiting or diarrhea promptly — clusters can mean an outbreak.

### Emergency procedures
- Know where the **emergency plan**, exits, fire alarms and extinguishers are, and who is in charge.
- Fire: **RACE** (Rescue, Alarm, Contain, Extinguish/Evacuate) and **PASS** for extinguishers.
- Hurricanes and power outages: your facility has a **Comprehensive Emergency Management Plan** and must keep residents at safe temperatures. Know whether you are expected to work during a storm and make a family plan.
- Medical emergencies: call for help, call 911 when needed, stay with the resident, and follow the resident's **DNR order** if one is on file and valid.

### Elopement
**Elopement** is when a resident who is at risk leaves the facility without staff knowledge. ALFs must have elopement response policies, and staff must be trained to carry them out.
- Know which residents are at risk (often those with dementia) and check on them as directed.
- Watch doors; never prop alarmed doors open; respond to every door alarm.
- If a resident is missing: **alert the supervisor immediately**, start the search per the plan (rooms, building, grounds) and call **911** when the plan says to — minutes matter, especially in Florida heat.
- Facilities keep a **current photo** of residents for this purpose.`),
      ],
    },
    {
      title: "4. Daily living, dementia and medications",
      summary: "Supporting residents safely and within your role.",
      lessons: [
        text("Helping with daily living", 20, `### Activities of daily living (ADLs)
- **Explain** what you are going to do and ask permission; let residents do as much as they can for themselves.
- **Privacy**: close doors and curtains; cover the resident during bathing and dressing.
- **Safety**: lock wheelchair brakes, use gait belts as trained, check water temperature, keep floors dry, make sure call devices and walkers are in reach.
- **Nutrition and hydration**: offer fluids often; report if a resident eats or drinks much less than usual, has trouble swallowing or coughs while eating.
- **Skin**: report redness, open areas or bruises.

### Residents with dementia
- Approach from the front, at eye level; say your name; speak slowly with short, simple sentences.
- Offer simple choices; avoid arguing or correcting ("Let's walk together to see"); redirect gently.
- Behaviors (pacing, calling out, resisting care) often signal an **unmet need** — pain, hunger, toileting, boredom, fear. Look for the cause and tell your supervisor.
- You will complete the Department of Elder Affairs dementia training separately (within the deadlines set by law).

### Medication assistance — know the limits
Florida law allows **trained** unlicensed staff to **assist residents with self-administration** of medication only within the limits of **s. 429.256, F.S.**, and only after completing the required training taught by a registered nurse or pharmacist. **Until you complete that training and your facility authorizes you, do not help with medications.** Even trained staff may not perform tasks the law reserves for licensed nurses (such as injections). If a resident asks for help with medication and you are not authorized, get the person who is.`),
        check("Check your understanding: daily living and medications", [
          kc("alf3", "A resident with dementia keeps trying to leave the dining room. What is the best first approach?", ["Tell her firmly to sit down", "Look for an unmet need (toileting, pain, restlessness) and redirect gently", "Lock the dining room", "Ignore it"], 1, "Behaviors often signal needs; respond calmly and report patterns."),
          kc("alf4", "You were hired as a caregiver yesterday. A resident asks you to hand her the pills from her blister pack. What should you do?", ["Help her since it is easy", "Get a staff member who is trained and authorized to assist with medication", "Give her the pills from the cart", "Tell her to wait until tomorrow"], 1, "Only staff who have completed the required training may assist with self-administration."),
        ]),
      ],
    },
    {
      title: "5. Documentation, confidentiality and incidents",
      summary: "Recording, privacy, incident reporting and a case study.",
      lessons: [
        text("Records, privacy and incidents", 15, `### Documentation
Write **objective facts** (what you saw and did, times, the resident's own words), sign your entries, and never chart for someone else or before care is done.

### Confidentiality
Resident information — health, finances, family matters — is **private**. Discuss it only with staff who need it for care, in private. Never post about residents on social media or take photos of residents on your personal phone.

### Incidents
Report falls, injuries, medication errors, missing residents, altercations and any unusual event **to your supervisor immediately** and follow the facility's incident procedure. Florida ALFs must report certain **adverse incidents** to AHCA within deadlines set by s. 429.23, F.S. — the facility's risk management process handles those reports, which is why prompt, accurate staff reporting matters.`),
        caseStudy("Case study: Ms. G.'s first week", 15, `**Situation (fictional).** Ms. G., 79, moved into the ALF five days ago. She has mild dementia. On your evening shift you notice she has eaten little for two days, has a new bruise on her forearm, and asks repeatedly to "go home to feed the cat." At 8 p.m. the side-door alarm sounds.

**Discussion:**
1. What should you do about the door alarm? *(Respond immediately; check whether Ms. G. or another resident left; follow the elopement plan and alert the supervisor at once.)*
2. What should you report about her eating and the bruise? *(Tell the supervisor right away and document objectively; if you have reasonable cause to suspect abuse or neglect, report to the Florida Abuse Hotline.)*
3. How could you respond to her wish to go home? *(Acknowledge feelings — "You love your cat" — offer comfort, a familiar activity, a snack, or a phone call with family; tell the supervisor so the care plan can address her adjustment.)*
4. Who else should know? *(The supervisor/administrator, who can involve her family and health care provider.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Florida ALF Staff Orientation — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which agency licenses and inspects assisted living facilities in Florida?", ["Department of Revenue", "Agency for Health Care Administration (AHCA)", "Department of Transportation", "The county sheriff"], 1, "AHCA licenses ALFs under part I of chapter 429, F.S."),
      mc("How long must the ALF preservice orientation be under s. 429.52(1), F.S.?", ["At least 30 minutes", "At least 2 hours", "At least 8 hours", "There is no minimum"], 1, "The orientation must be at least 2 hours."),
      tf("After orientation, the employee and the administrator sign a statement that is kept in the employee's personnel record.", true, "Section 429.52(1) requires a signed statement kept in the personnel record."),
      mc("What is the Florida Abuse Hotline number?", ["1-800-96-ABUSE (1-800-962-2873)", "911 only", "1-800-222-1222", "The facility's main line"], 0, "Report suspected abuse, neglect or exploitation to 1-800-96-ABUSE; call 911 for immediate danger."),
      tf("Telling your supervisor always satisfies your personal duty to report suspected abuse.", false, "Mandatory reporting is a personal duty."),
      ms("Which are resident rights in Florida ALFs? (Select all that apply.)", ["Manage their own money or choose who will", "Receive visitors and private communication", "Present grievances without retaliation", "Be restrained for staff convenience"], [0, 1, 2], "Residents have the right to be free from abuse and inappropriate restraint."),
      mc("Elopement means:", ["A resident moving to a new room", "A resident at risk leaving the facility without staff knowledge", "A resident going on an approved outing", "A family visit"], 1, "Elopement is an unsupervised exit by a resident who needs supervision."),
      sc("A door alarm sounds and you cannot find a resident with dementia. What should you do first?", ["Finish your current task", "Alert the supervisor immediately and start the elopement search per the plan", "Wait 30 minutes to see if she returns", "Call her family to ask if she went home"], 1, "Minutes matter; follow the elopement plan, including calling 911 when indicated."),
      mc("Which is correct hand hygiene practice?", ["Wear the same gloves for several residents", "Clean hands before and after resident contact and after removing gloves", "Hand hygiene is only for nurses", "Use hand lotion instead of washing"], 1, "Hand hygiene is required at key moments for all staff."),
      tf("A newly hired caregiver may assist residents with self-administration of medication before completing the required medication training.", false, "Only staff who have completed the required training and are authorized may assist, within s. 429.256 limits."),
      mc("A resident with dementia resists bathing. Which approach is best?", ["Insist and hold her arms", "Stay calm, explain simply, offer choices, try later, and report the pattern", "Skip bathing permanently", "Scold her"], 1, "Resistance often reflects fear or discomfort; adapt the approach."),
      mc("Where should resident information be discussed?", ["In the lobby", "Privately, only with staff who need it for care", "On social media groups for staff", "With other residents' families"], 1, "Resident information is confidential."),
      sc("You notice a resident has eaten very little for two days and seems more confused. What should you do?", ["Wait for the weekly meeting", "Tell your supervisor promptly and document objectively", "Give her a snack and say nothing", "Call her doctor yourself"], 1, "Changes in condition need prompt reporting through the chain of command."),
      mc("Which emergency acronym describes fire response?", ["SBAR", "RACE", "PASS for evacuations", "ADL"], 1, "RACE: Rescue, Alarm, Contain, Extinguish/Evacuate. PASS is for using an extinguisher."),
      mc("Which trainings does this orientation NOT replace? ", ["The in-service trainings, DOEA dementia training, HIV/AIDS course and medication assistance training", "Nothing — it covers everything", "Only fire drills", "Only the food handling course"], 0, "These are separate requirements tracked by the facility."),
    ],
  },
};
