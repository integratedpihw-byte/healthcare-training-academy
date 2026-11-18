import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, slides, text, tf } from "../../build";
import { ACCESSED, AHCA_HCS, CDC_HAND, NOT_A_CREDENTIAL } from "./_shared";

export const personalCareAssistant: CourseContent = {
  code: "CHITA-HH-002",
  title: "Personal Care Assistant Training",
  categorySlug: "home-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 140,
  clinicalReviewRequired: true,
  programClassification: "EMPLOYER_REQUIRED",
  certificateType: "COURSE_COMPLETION",
  credentialNotice: `Educational training in personal care and daily-living support. In Florida, hands-on personal care in the home is provided through a licensed home health agency or nurse registry; the homemaker and companion registration does not allow hands-on personal care. Your employer decides which tasks you may perform and evaluates your skills. ${NOT_A_CREDENTIAL}`,
  instructorResources: `Pair this course with skills checklists COMP-HH, COMP-HHA-BATH, COMP-HHA-DRESS, COMP-HHA-TOILET, COMP-TRANSFER, COMP-HHA-AMBUL and COMP-HHA-FEED for workers who will provide hands-on care. Add a short video of a gait-belt transfer and a kitchen food-safety demonstration in the course builder before publishing.

Role play for module 4: a client who wants to stay independent but is unsafe on the stairs.`,
  competencyCodes: ["COMP-HH", "COMP-HHA-BATH", "COMP-HHA-DRESS", "COMP-HHA-TOILET", "COMP-TRANSFER", "COMP-HHA-AMBUL", "COMP-HHA-FEED"],
  description:
    "Practical training for personal care assistants and caregivers who support people at home: activities of daily living (ADLs) and instrumental activities of daily living (IADLs), personal hygiene, meal preparation and food safety, safe transfers and walking, companionship, household safety, independence and dignity, and the caregiver's responsibilities, including what is and is not allowed under Florida's home care categories.",
  targetAudience: "Personal care assistants, caregivers, companions and homemakers, family caregivers, and new staff of home care agencies and nurse registries.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Hands-on skills are evaluated separately by the employer.",
  objectives: [
    "Distinguish activities of daily living from instrumental activities of daily living.",
    "Assist with personal hygiene in a way that protects safety, privacy and dignity.",
    "Prepare simple meals safely and follow special diets.",
    "Assist with safe transfers and walking and prevent falls.",
    "Provide meaningful companionship and support the client's independence.",
    "Describe a caregiver's responsibilities and limits, including Florida's home care service categories.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "s. 400.462, F.S.", title: "Home health services definitions (companion, homemaker, home health aide, personal care)", url: "https://m.flsenate.gov/Statutes/400.462" },
    { agency: "Florida Legislature", citation: "s. 400.509, F.S.", title: "Registration of particular service providers exempt from licensure (companion and homemaker services)", url: "https://m.flsenate.gov/Statutes/400.509" },
  ],
  sourceReferences: [
    AHCA_HCS,
    CDC_HAND,
    { title: "Four Steps to Food Safety", publisher: "U.S. Department of Health and Human Services (FoodSafety.gov)", url: "https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety", accessedOn: ACCESSED },
    { title: "Older Adult Fall Prevention (STEADI)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/steadi/index.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Daily living and your role",
      summary: "ADLs, IADLs and what Florida law allows in each home care role.",
      lessons: [
        slides("ADLs and IADLs", 8, `## Activities of daily living (ADLs)
Basic self-care tasks:
- Bathing
- Dressing
- Grooming and oral care
- Toileting and continence
- Transferring (bed, chair, toilet)
- Eating
---
## Instrumental activities of daily living (IADLs)
Tasks needed to live independently:
- Preparing meals
- Housekeeping and laundry
- Shopping and errands
- Managing medications (with appropriate help)
- Using the phone
- Transportation
- Managing money
---
## Why it matters
- Needs are assessed in ADLs and IADLs.
- The care plan says which ones you help with — and how much.
- Help with what the client **cannot** do; encourage what they **can**.`),
        text("Florida home care roles and limits", 12, `Florida law sets out different home care roles, and they allow different tasks:

| Role | Who provides it | Hands-on personal care? |
|---|---|---|
| **Companion (sitter)** | Registered homemaker/companion provider, home health agency, or nurse registry | **No.** Companions accompany clients on trips and outings, provide supervision and company, and may prepare and serve meals. |
| **Homemaker** | Same | **No.** Homemakers do household chores such as housekeeping, meal planning and preparation, shopping and laundry. |
| **Home health aide or CNA** | Licensed home health agency or nurse registry | **Yes**, as trained and as the care plan directs. |

AHCA's homemaker and companion registration **does not allow hands-on personal care** such as bathing, feeding or changing a client. If your job includes personal care, your employer must be a licensed home health agency or nurse registry, and you must have the training it requires.

### Caregiver responsibilities
- Follow the care plan and your employer's policies.
- Arrive on time, keep your schedule, and use electronic visit verification if required.
- Observe and report changes in the client's condition, mood or home.
- Respect the client's rights, privacy, property and choices.
- Keep professional boundaries: no borrowing, lending or gifts outside policy; no personal social media contact.
- Report suspected abuse, neglect or exploitation to the **Florida Abuse Hotline, 1-800-96-ABUSE**.`),
        check("Check your understanding: roles", [
          kc("pca1", "Which of these is an IADL?", ["Bathing", "Preparing meals", "Toileting", "Transferring"], 1, "Meal preparation is an instrumental activity of daily living."),
          kc("pca2", "May a worker employed only under a Florida homemaker/companion registration help a client bathe?", ["Yes", "No — that registration does not allow hands-on personal care", "Only on weekends", "Only if the family asks"], 1, "AHCA states that the registration does not allow hands-on personal care."),
        ]),
      ],
    },
    {
      title: "2. Personal hygiene with dignity",
      summary: "Bathing, grooming, dressing, toileting and skin care for hands-on roles.",
      lessons: [
        text("Personal hygiene", 18, `*For workers whose role and employer permit hands-on personal care.*

### Before care
Check the care plan, explain what you will do, ask the client's preferences, provide privacy, gather supplies and clean your hands.

### Bathing and showering
- Test water temperature before the client touches it.
- Use the shower chair, grab bars and non-slip mat; never leave the client alone in the tub or shower.
- Wash clean to dirty; perineal care front to back; dry well, especially skin folds and between toes.
- Look at the skin and report redness that does not fade, open areas, bruises or rashes.

### Grooming and oral care
- Let the client choose clothing and hairstyle.
- Brush teeth at least twice daily; clean dentures with cool water over a towel or basin.
- Use an electric razor if the client takes blood thinners.
- Do not cut nails for clients with diabetes or poor circulation — report to the nurse or family.

### Dressing
- Weak side first when dressing, last when undressing.
- Allow time; offer adaptive aids (button hooks, elastic laces).

### Toileting and continence
- Respond promptly and kindly; incontinence is never the client's fault.
- Clean front to back, dry and apply barrier cream if on the care plan.
- Report pain, blood, very dark urine, constipation, diarrhea or no urine.

### Dignity
Knock before entering, keep the client covered, talk to them (not over them), and protect their privacy in front of visitors.`),
        check("Check your understanding: hygiene", [
          kc("pca3", "Why test the water before the client gets in?", ["To save hot water", "Older adults and people with nerve damage can be burned without feeling it", "It is not necessary", "To clean the tub"], 1, "Scalds are a serious risk."),
          kc("pca4", "A client is embarrassed after an accident. What is the best response?", ["\"You should have called me sooner.\"", "Clean up promptly and calmly and reassure them, protecting their privacy", "Leave them until the next visit", "Tell the family about it in front of them"], 1, "Respond with kindness and protect dignity."),
        ]),
      ],
    },
    {
      title: "3. Meals and nutrition",
      summary: "Meal planning, special diets, food safety and feeding help.",
      lessons: [
        text("Meal preparation and food safety", 16, `### Plan with the client
Ask about likes, dislikes and cultural or religious food practices, and follow any **special diet** on the care plan (diabetic, low-sodium, soft or pureed textures, thickened liquids, fluid limits).

### Four steps to food safety
1. **Clean** — wash hands, surfaces and produce.
2. **Separate** — keep raw meat, poultry, seafood and eggs away from ready-to-eat foods.
3. **Cook** — cook to safe internal temperatures (use a food thermometer).
4. **Chill** — refrigerate perishable foods within 2 hours (1 hour if it is above 90°F); keep the refrigerator at 40°F or below.

Check expiration dates and throw away spoiled food with the client's permission. Report when the client has little food in the home.

### Help with eating (if your role allows)
- Sit the client upright; sit at eye level.
- Small bites and sips, plenty of time, alternate food and drink.
- Stop and report coughing, choking or a wet voice while eating.
- Encourage fluids throughout the day unless the client has a fluid limit.
- Record how much the client ate if the care plan asks.`),
        check("Check your understanding: meals", [
          kc("pca5", "Perishable leftovers should be refrigerated within:", ["2 hours (1 hour if above 90°F)", "6 hours", "The next day", "There is no limit"], 0, "This is the FoodSafety.gov guideline."),
          kc("pca6", "The care plan says 'low-sodium diet.' Which is the better choice?", ["Canned soup and deli meat", "Fresh chicken seasoned with herbs and lemon", "Frozen dinner high in salt", "Salted crackers"], 1, "Processed foods are often high in sodium."),
        ]),
      ],
    },
    {
      title: "4. Moving safely and preventing falls",
      summary: "Transfers, walking help and a safe home.",
      lessons: [
        text("Safe transfers, ambulation and household safety", 18, `### Body mechanics
Feet apart, bend your knees, keep your back straight and the client close, turn with your feet. Get help or use equipment when the care plan says so.

### Transfers (if your role allows)
- Lock wheelchair brakes; non-skid shoes on the client.
- Use a gait belt when the care plan calls for one.
- Let the client sit on the edge of the bed for a moment before standing (to avoid dizziness).
- Count together and move toward the client's stronger side.

### Walking
- Walk slightly behind and to the weaker side.
- Walker: walker first, then the weaker leg, then the stronger leg.
- If the client starts to fall, ease them to the floor and protect their head; do not try to hold them up. Call for help and report every fall.

### Household safety checklist
- Clear walkways; secure or remove throw rugs (with permission); tidy cords.
- Good lighting and night lights.
- Grab bars, raised toilet seat, non-slip mats.
- Working smoke detectors; no smoking near oxygen; space heaters away from bedding and curtains.
- Emergency numbers by the phone; know the address for 911.
- Medicines stored safely and out of reach of children or confused adults.
- Hurricane season: know the client's emergency plan and whether they are registered for a special-needs shelter.`),
        check("Check your understanding: safety", [
          kc("pca7", "Why let a client sit on the edge of the bed before standing?", ["To rest your back", "To reduce dizziness from a drop in blood pressure", "It is not necessary", "To check the time"], 1, "Sitting first lets blood pressure adjust and prevents falls."),
          kc("pca8", "Which is a fire safety risk to report?", ["Working smoke detector", "Someone smoking near home oxygen", "A clear walkway", "Night lights"], 1, "Smoking near oxygen is extremely dangerous."),
        ]),
      ],
    },
    {
      title: "5. Companionship, independence and dignity",
      summary: "Supporting wellbeing and the client's own choices.",
      lessons: [
        text("Companionship and independence", 14, `### Meaningful companionship
Loneliness and social isolation are linked to poorer physical and mental health in older adults.
- Talk about the client's interests, family, work and memories.
- Activities: walks, music, games, puzzles, reading aloud, looking at photos, gardening, cooking together, phone or video calls with family.
- Accompany the client to appointments, church, shopping and social events as the care plan allows.

### Supporting independence
- "Do with, not for": let the client do every part of a task they safely can.
- Offer choices throughout the day — what to wear, what to eat, when to bathe.
- Use adaptive equipment (reachers, grab bars, large-handled utensils).
- Respect the client's right to take reasonable risks; discuss safety concerns with them and report serious risks to your supervisor.

### Watch and report
Changes in mood, withdrawal, crying, loss of interest, confusion, not eating, poor hygiene, or comments about not wanting to live. **If a client talks about suicide, stay with them and call 988 (Suicide & Crisis Lifeline) or 911 if there is immediate danger, then your supervisor.**`),
        caseStudy("Case study: Ms. Bryant wants to do it herself", 12, `**Situation (fictional).** Ms. Bryant, 84, lives alone after her husband died. She uses a walker. Your care plan (home health agency) is shower assistance three times a week, light housekeeping, meal preparation and companionship.

She insists on carrying her laundry basket down two steps to the washer and refuses help: "I've done it for 60 years." Her refrigerator has very little food, and she says she "isn't hungry much since Bill passed."

**Discuss:**
1. How can you respect her independence and reduce the fall risk? *(Offer a lighter basket with a strap, a rolling cart, doing laundry together, asking whether she would like a grab rail on the steps — and report the risk to your supervisor.)*
2. What could her low appetite and empty refrigerator mean? *(Grief, depression, money problems, trouble shopping — report to your supervisor so the nurse or case manager can follow up.)*
3. What companionship activities might help? *(Talking about Bill and her life, a regular walk, calls with family, a senior center visit if she is interested.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Personal Care Assistant — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      ms("Which are activities of daily living (ADLs)? (Select all that apply.)", ["Bathing", "Dressing", "Shopping", "Transferring"], [0, 1, 3], "Shopping is an IADL."),
      mc("Managing money is an example of:", ["An ADL", "An IADL", "A vital sign", "A medication"], 1, "Money management is an instrumental activity of daily living."),
      tf("A companion may provide hands-on personal care such as bathing under Florida law.", false, "Companions and homemakers may not provide hands-on personal care."),
      mc("Hands-on personal care in Florida homes is provided through:", ["Any registered companion provider", "A licensed home health agency or nurse registry", "No provider", "Only family members"], 1, "Licensed home health agencies and nurse registries."),
      mc("When dressing a client with a weak right arm, you should:", ["Put the left arm in first", "Put the right (weak) arm in first", "Avoid dressing", "Use only a gown"], 1, "Weak side first."),
      mc("Which helps protect a client's dignity during bathing?", ["Leaving the door open", "Keeping the client covered except the part being washed", "Talking on your phone", "Hurrying"], 1, "Privacy and covering protect dignity."),
      mc("Which is one of the four food safety steps?", ["Thaw on the counter", "Separate raw meat from ready-to-eat food", "Taste to check doneness", "Store eggs at room temperature"], 1, "Clean, separate, cook, chill."),
      mc("A refrigerator should be kept at:", ["40°F or below", "50°F", "60°F", "Room temperature"], 0, "40°F or below slows bacterial growth."),
      mc("When walking with a client, stand:", ["In front of them", "Slightly behind and on their weaker side", "Far away", "On the stronger side only"], 1, "This lets you support them if they lose balance."),
      sc("Your client begins to fall while walking. What should you do?", ["Grab their arm and pull them up", "Ease them to the floor while protecting their head, call for help and report the fall", "Step away", "Lift them alone back into bed"], 1, "Never try to hold a falling person upright."),
      mc("Which is a household safety improvement?", ["Extension cords across walkways", "Grab bars in the bathroom", "Loose throw rugs", "Dim lighting"], 1, "Grab bars reduce bathroom falls."),
      mc("\"Do with, not for\" means:", ["Do everything for the client", "Let the client do every part of a task they safely can", "Avoid helping", "Do tasks only when the family is present"], 1, "Supporting independence keeps abilities longer."),
      mc("A client tells you they have been thinking about ending their life. What should you do?", ["Change the subject", "Stay with them and call 988, or 911 if there is immediate danger, then your supervisor", "Promise to keep it secret", "Leave and report next week"], 1, "Take every mention of suicide seriously."),
      mc("You suspect a family member is taking a client's money. You should:", ["Confront the family member", "Report to the Florida Abuse Hotline and your supervisor", "Ignore it", "Take the money to keep it safe"], 1, "Suspected exploitation must be reported."),
      mc("Which is a professional boundary?", ["Lending money to a client", "Not adding clients on personal social media", "Bringing your children to work", "Using the client's car for errands of your own"], 1, "Keep personal and professional relationships separate."),
    ],
  },
};
