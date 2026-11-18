import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const riskCommunication: CourseContent = {
  code: "CHITA-PH-003",
  title: "Crisis and Emergency Risk Communication (CERC) for Public Health Workers",
  categorySlug: "public-health-practice",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 70,
  clinicalReviewRequired: false,
  description:
    "How to communicate when people are frightened and information is incomplete, based on CDC's Crisis and Emergency Risk Communication (CERC) framework: the six CERC principles, how people process information in a crisis, the phases of a crisis, building clear and actionable messages, working with spokespersons and the Joint Information Center, reaching everyone in the community, and responding to rumors and misinformation.",
  targetAudience: "Public information staff, health educators, nurses, call-center and front-desk staff, community health workers and leaders who speak with the public during emergencies.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Apply the six CERC principles to public health communication.",
    "Explain how people take in and act on information during a crisis.",
    "Describe the phases of a crisis and the communication needs in each.",
    "Write a short, clear, actionable message that acknowledges uncertainty.",
    "Respond to rumors and misinformation and reach people with diverse language and access needs.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    { title: "Crisis & Emergency Risk Communication (CERC) Manual", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/cerc/php/cerc-manual", accessedOn: ACCESSED },
    { title: "CERC: Introduction (2018 update)", publisher: "Centers for Disease Control and Prevention", url: "https://stacks.cdc.gov/view/cdc/120677/cdc_120677_DS1.pdf", accessedOn: ACCESSED },
    { title: "Crisis and Emergency Risk Communication: 2012 Edition", publisher: "Centers for Disease Control and Prevention", url: "https://stacks.cdc.gov/view/cdc/22159", accessedOn: ACCESSED },
    { title: "Plain Language Guidelines", publisher: "PlainLanguage.gov", url: "https://www.plainlanguage.gov/guidelines/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. What CERC is",
      summary: "The six principles.",
      lessons: [
        text("Crisis plus risk communication", 10, `**Crisis and Emergency Risk Communication (CERC)** is the CDC's evidence-based framework for anyone who communicates on behalf of an organization responding to a public health emergency. It combines:
- **Crisis communication** — telling people what is happening now and what the organization is doing, when an event is unexpected and urgent.
- **Risk communication** — helping people understand a possible harm and what they can do to lower their risk.

The right message, from the right person, at the right time can save lives. A poor message — late, contradictory, full of jargon or dismissive — can increase harm and damage trust for years.

### The six CERC principles
1. **Be first.** Crises are time-sensitive. If it is your organization's responsibility to provide information, do so as quickly as you can. The first source of information often becomes the one people trust.
2. **Be right.** Accuracy builds credibility. Say what you know, what you don't know and what you are doing to find out.
3. **Be credible.** Honesty and truthfulness should not be compromised during a crisis.
4. **Express empathy.** Acknowledge what people are feeling and the harm they are experiencing. Empathy builds trust and rapport.
5. **Promote action.** Give people meaningful things to do. Action calms anxiety, helps restore order and gives a sense of control.
6. **Show respect.** Respectful communication is especially important when people feel vulnerable; it promotes cooperation.

### Balancing first and right
Being first does not mean guessing. Share confirmed facts quickly, label what is still unknown, say when you will update, and then update when you said you would.`),
        check("Check your understanding: principles", [
          kc("rc1", "Which is NOT one of the six CERC principles?", ["Be first", "Express empathy", "Promote action", "Avoid mentioning uncertainty"], 3, "CERC recommends acknowledging uncertainty honestly."),
          kc("rc2", "Why does CERC emphasize giving people actions to take?", ["To keep them busy", "Action helps reduce anxiety, restores a sense of control and protects health", "Because the law requires it", "To avoid answering questions"], 1, "Meaningful actions help people cope and protect themselves."),
        ]),
      ],
    },
    {
      title: "2. How people process information in a crisis",
      summary: "Why crisis messages must be different.",
      lessons: [
        text("Communication in a crisis is different", 10, `Under stress, people take in and act on information differently. The CDC's CERC materials describe four common patterns:
1. **We simplify messages.** People cannot absorb long or complex information. They may hear only part of what you say.
2. **We hold on to current beliefs.** It is hard to change beliefs during a crisis; new information that contradicts them may be rejected.
3. **We look for additional information and opinions.** People check with family, friends, social media and other sources before acting.
4. **We believe the first message.** The first information people hear — accurate or not — is often the one they accept.

### Risk perception
People judge risks differently from experts. A risk feels larger when it is:
- **Involuntary** rather than chosen
- **Unfamiliar** or new (for example, a new virus) rather than familiar
- **Man-made** rather than natural
- **Unfair** — falling on some groups more than others
- **Out of their control**
- Coming from a source they **do not trust**
- Affecting **children**

These feelings are real and reasonable. Dismissing them ("there is nothing to worry about") usually backfires. Acknowledge concerns, then give facts and actions.

### What people want to know
In the first hours, the public typically asks: *Am I safe? Is my family safe? What can I do to protect myself? Who is in charge? What can we expect?*`),
        check("Check your understanding: crisis psychology", [
          kc("rc3", "During a crisis, people tend to:", ["Read long technical documents carefully", "Simplify messages and believe the first information they hear", "Ignore all information", "Change beliefs easily"], 1, "These are documented patterns in crisis communication."),
          kc("rc4", "Which situation will usually feel MORE risky to the public?", ["A familiar, voluntary activity", "An unfamiliar, involuntary exposure affecting children", "A natural risk they control", "A risk explained by a trusted source"], 1, "Unfamiliar, involuntary risks affecting children feel more dangerous."),
        ]),
      ],
    },
    {
      title: "3. Phases and messages",
      summary: "The crisis lifecycle and writing messages that work.",
      lessons: [
        text("The crisis communication lifecycle", 8, `CERC describes communication needs across **five phases**:
1. **Pre-crisis** — prepare: plan, build partnerships, draft messages for likely scenarios, identify and train spokespersons, and educate the public about risks.
2. **Initial** — communicate quickly with empathy: what happened, what is being done, what people should do, and when you will update. Establish your organization as a credible source.
3. **Maintenance** — explain ongoing risks in more depth, correct misinformation, gather feedback and keep updating on schedule.
4. **Resolution** — explain recovery, what was learned, and how to stay prepared.
5. **Evaluation** — review what worked and what did not, and improve the plan.`),
        text("Building a clear message", 12, `### A strong initial message covers
- **What happened** (confirmed facts only)
- **What we are doing** about it
- **What you should do** — specific, simple actions
- **What we don't know yet**, and **when we will update**
- **Where to get more information** (phone line, website)

### Write for the person who is scared
- **Lead with the most important action.** "Boil tap water for one minute before drinking or cooking" comes before the cause of the water main break.
- Use **short sentences**, common words and the active voice. Avoid jargon and acronyms ("ESF-8", "PEP", "MMWR").
- Keep reading level low; plain language helps everyone, including people with high literacy who are stressed.
- Use **numbers carefully** and with context ("1 in 1,000 people" is clearer than "0.1%").
- Repeat the key action. Use the same facts across every channel and every agency.
- Express empathy genuinely: "We know this is frightening, especially for parents of young children."

### Messages to avoid
- **Over-reassurance** ("There is absolutely no risk") — if you are wrong, you lose credibility.
- **Speculation** about causes, numbers or blame.
- **Humor**, which can seem dismissive.
- **"No comment."** Instead say what you can share and when more will be available.
- **Promises** you cannot keep.

### Example
*"The county health department is investigating several cases of measles linked to the Westside Mall food court on Saturday, October 4, between 11 a.m. and 3 p.m. If you were there and are not sure you are protected, call your doctor or the health department at 555-0100 before going to a clinic, so staff can protect others. Watch for fever, rash, cough or red eyes until October 25. We will share an update tomorrow at 10 a.m."*`),
        check("Check your understanding: messages", [
          kc("rc5", "Which phase focuses on planning, partnerships and training spokespersons?", ["Initial", "Maintenance", "Pre-crisis", "Resolution"], 2, "Preparation happens in the pre-crisis phase."),
          kc("rc6", "A reporter asks a question you cannot answer yet. The best response is:", ["\"No comment.\"", "Guess so you seem informed", "Say what you can share, what is still unknown and when you will update", "Hang up"], 2, "Acknowledge uncertainty and commit to an update."),
        ]),
      ],
    },
    {
      title: "4. Spokespersons, channels and misinformation",
      summary: "Who speaks, how messages reach everyone, and rumor control.",
      lessons: [
        text("Speaking for the organization", 8, `### Designated spokespersons
During a response, information to the media and public comes through the **Public Information Officer (PIO)** and designated spokespersons, coordinated through the **Joint Information Center (JIC)** when several agencies are involved. This keeps messages consistent.

If you are not a designated spokesperson and a reporter approaches you: be polite, do not give an interview, and refer them to the PIO. You can still answer **routine questions from clients and the public** within your role using approved talking points — for example, a call-center worker reading the current guidance.

### Good spokesperson behavior
Be calm, honest and caring. Look at the camera or the person. Stick to three key messages. Do not speculate or argue. Admit mistakes quickly and explain what is being done to fix them.`),
        text("Reaching everyone and countering misinformation", 10, `### Reach the whole community
- Use **multiple channels**: TV, radio (including foreign-language stations), social media, text alerts, websites, phone lines, community organizations, faith leaders, schools and door-to-door outreach.
- Translate key messages into the languages spoken in your community (in Florida, commonly Spanish and Haitian Creole, among others) and use qualified translators.
- Provide **accessible formats**: captions and sign language interpreters for video and briefings, screen-reader-friendly web pages, large print and simple pictures.
- Work with **trusted messengers** — local leaders, clinicians and community health workers whom people already trust.

### Rumors and misinformation
False information spreads fast, especially when official information is slow or unclear.
- **Monitor** social media, call lines and community feedback to find rumors early.
- **Fill information gaps** quickly with accurate information — the best defense is being first and right.
- When correcting a myth, **lead with the fact**, briefly explain why the myth is wrong without repeating it more than needed, then **repeat the fact**.
- Stay respectful. People who believe a rumor are usually worried, not foolish.
- Coordinate corrections through the PIO/JIC so all agencies say the same thing.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: a summer heat emergency", 10, `**Situation (fictional).** A week-long heat advisory hits a Florida county with heat index values above 110°F. Two older adults die of heat-related illness on day two. Rumors spread on social media that cooling centers are only for people with insurance and that police are checking immigration status at the centers.

**What the health department and county did:**
- **Initial phase:** within two hours, the JIC issued one message across agencies: "Cooling centers are free and open to everyone. No identification or insurance is needed." The message listed locations, hours, free transit routes and the signs of heat stroke, with the instruction to call 911.
- The message went out in English, Spanish and Haitian Creole, by text alert, radio, social media and through churches and community health workers who knocked on doors in neighborhoods with many older adults living alone.
- **Rumor control:** staff monitored social media and the call line. The PIO answered the rumors directly, leading with the fact ("Cooling centers are open to everyone; no ID or insurance is required") and repeating it.
- **Empathy:** the Health Officer opened the briefing by acknowledging the two deaths and the fear many families felt.
- **Maintenance:** daily updates at 10 a.m., as promised.

**Discussion:**
- Which CERC principles can you identify?
- Why were community health workers and churches important channels?
- How would you evaluate whether the messages reached people most at risk?`),
      ],
    },
  ],
  finalExam: {
    title: "Crisis and Emergency Risk Communication — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      ms("Which are CERC principles? (Select all that apply.)", ["Be first", "Be right", "Be credible", "Express empathy", "Promote action", "Show respect"], [0, 1, 2, 3, 4, 5], "These are the six CERC principles."),
      mc("CERC combines:", ["Marketing and sales", "Crisis communication and risk communication", "Legal and financial communication", "Advertising and fundraising"], 1, "CERC integrates crisis and risk communication."),
      tf("Being first means releasing information before it is verified.", false, "Share confirmed facts quickly and label what is unknown."),
      mc("Which pattern describes how people handle information in a crisis?", ["They read every detail", "They tend to believe the first message they hear", "They never seek other opinions", "They change beliefs instantly"], 1, "The first message often becomes the accepted one."),
      mc("Which risk is likely to cause the MOST public concern?", ["A familiar, voluntary risk", "An unfamiliar, involuntary risk affecting children", "A natural risk people feel they control", "A risk explained clearly by a trusted source"], 1, "Unfamiliar, involuntary risks affecting children feel more threatening."),
      mc("In which phase are spokespersons trained and messages drafted in advance?", ["Initial", "Maintenance", "Resolution", "Pre-crisis"], 3, "Preparation happens in the pre-crisis phase."),
      ms("A strong initial message includes: (Select all that apply.)", ["What happened", "What is being done", "What people should do", "When the next update will come"], [0, 1, 2, 3], "All four belong in an initial message."),
      mc("Which statement is most consistent with CERC?", ["\"There is absolutely no risk.\"", "\"We don't know yet how many people were exposed. We will share an update at 4 p.m.\"", "\"No comment.\"", "\"It's probably nothing, don't worry.\""], 1, "Acknowledge uncertainty and promise a specific update."),
      mc("When writing for the public during a crisis you should:", ["Use technical terms to sound expert", "Lead with the most important action in short, plain sentences", "Include every detail you know", "Use humor to calm people"], 1, "Plain, action-first messages work best."),
      sc("A TV reporter stops you outside the clinic and asks how many people are infected. You are not a designated spokesperson. What do you do?", ["Give your estimate", "Politely refer the reporter to the Public Information Officer", "Ignore the reporter and walk away without a word", "Post the answer online yourself"], 1, "Refer media to the PIO so messages stay consistent."),
      mc("When correcting a rumor, you should:", ["Repeat the rumor several times", "Lead with the fact, briefly explain, then repeat the fact", "Mock people who believe it", "Ignore it and hope it fades"], 1, "Lead with and repeat the fact."),
      ms("Which help reach the whole community? (Select all that apply.)", ["Translations by qualified translators", "Captions and sign language interpreters", "Trusted community messengers", "English-only press releases"], [0, 1, 2], "English-only releases miss many residents."),
      mc("A Joint Information Center helps by:", ["Letting each agency issue different numbers", "Coordinating consistent public information across agencies", "Replacing the Incident Commander", "Storing medical supplies"], 1, "The JIC coordinates consistent messaging."),
      tf("Expressing empathy, such as acknowledging people's fear, is a CERC principle.", true, "Express empathy is one of the six principles."),
      mc("The evaluation phase focuses on:", ["Issuing the first alert", "Reviewing what worked and improving plans", "Hiding mistakes", "Ending all communication"], 1, "Evaluation leads to improvement."),
    ],
  },
};
