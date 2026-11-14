import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const labSpecimenCollection: CourseContent = {
  code: "CHITA-LAB-001",
  title: "Laboratory Specimen Collection and Handling",
  categorySlug: "laboratory-phlebotomy",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "Laboratory testing personnel competency under CLIA is assessed by the laboratory (e.g., 42 CFR 493.1451(b)(8)–(9) for high complexity); collection competency follows facility policy.",
  estimatedMinutes: 60,
  clinicalReviewRequired: true,
  description:
    "Quality lab results start before the specimen reaches the laboratory. This course covers patient identification and labeling, the CLSI order of draw and tube handling, preventing hemolysis and contamination, urine and swab collection, transport and storage, specimen rejection, chain of custody, and safety. Venipuncture technique must be learned and verified hands-on; this course provides the knowledge base.",
  targetAudience: "Phlebotomists, medical assistants, nurses, laboratory assistants, home health staff and others who collect, label or transport specimens.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Venipuncture and specimen collection skills require observed competency before independent practice.",
  objectives: [
    "Identify patients with two identifiers and label specimens at the bedside.",
    "Apply the CLSI order of draw and correct tube inversion.",
    "Prevent common pre-analytical errors such as hemolysis, contamination and incorrect fill.",
    "Collect urine and swab specimens using correct technique and patient instructions.",
    "Transport, store and document specimens, including chain of custody when required.",
    "Protect yourself and others with safe sharps and spill practices.",
  ],
  regulatoryReferences: [
    { agency: "CMS", citation: "42 CFR 493.1241–493.1242", title: "CLIA test requests and specimen submission, handling and referral", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-493/subpart-K" },
    { agency: "OSHA", citation: "29 CFR 1910.1030", title: "Bloodborne pathogens standard", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030" },
  ],
  sourceReferences: [
    { title: "GP41 — Collection of Diagnostic Venous Blood Specimens (summary of order of draw)", publisher: "Clinical and Laboratory Standards Institute", url: "https://clsi.org/standards/products/general-laboratory/documents/gp41/", accessedOn: ACCESSED },
    { title: "WHO Guidelines on Drawing Blood: Best Practices in Phlebotomy", publisher: "World Health Organization", url: "https://www.who.int/publications/i/item/9789241599221", publishedOn: "2010-01-01", accessedOn: ACCESSED },
    { title: "Specimen Collection Guidelines (Influenza and respiratory specimens)", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/flu/hcp/testing-methods/clinician_guidance_ridt.html", accessedOn: ACCESSED },
    { title: "Clinical Laboratory Improvement Amendments (CLIA)", publisher: "Centers for Medicare & Medicaid Services", url: "https://www.cms.gov/medicare/quality/clinical-laboratory-improvement-amendments", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. The pre-analytical phase",
      summary: "Why collection errors matter.",
      lessons: [
        text("Most lab errors happen before testing", 7, `Laboratory testing has three phases: **pre-analytical** (ordering, patient preparation, collection, labeling, transport), **analytical** (testing) and **post-analytical** (reporting). Studies consistently find that **most laboratory errors occur in the pre-analytical phase** — the part you control.

Consequences of collection errors include wrong-patient results, delayed diagnosis, repeat sticks, unnecessary treatment and blood transfusion reactions.

### Before you collect
- Verify the **order** (test, timing, special requirements such as fasting or timed draws like drug levels).
- Check **patient preparation** (fasting status, medication timing) and document deviations.
- Gather supplies: correct tubes/containers (check expiration dates), labels, PPE, sharps container.
- Perform **hand hygiene** and put on gloves.`),
      ],
    },
    {
      title: "2. Identification and labeling",
      summary: "The most important step.",
      lessons: [
        text("Right patient, right label", 9, `### Identify the patient
- Use **two identifiers** (e.g., full name and date of birth), compared with the requisition/order and the ID band.
- Ask the patient to **state** their name and date of birth when possible — do not ask "Are you Mr. Jones?"
- For unresponsive patients, use the ID band and follow policy; never rely on room or bed numbers.

### Label correctly
- Label **in the presence of the patient**, immediately after collection — **never pre-label** tubes.
- Labels include at least two identifiers, date and time of collection, and your initials or ID (or as required by the lab).
- Place the label so the fill level and tube color remain visible, as the lab instructs.
- Blood bank specimens often have **additional requirements** (special armbands, signatures). Follow them exactly — mislabeled transfusion specimens can be fatal.`),
        check("Check your understanding: identification", [
          kc("lab1", "Which is the correct way to confirm identity?", ["'Are you Maria Lopez?'", "'Please tell me your full name and date of birth.'", "Check the room number", "Ask the visitor"], 1, "Open-ended questions prevent agreeing to the wrong name."),
          kc("lab2", "When should tubes be labeled?", ["Before entering the room to save time", "At the nurses' station after collection", "At the bedside, in the patient's presence, right after collection", "At the end of the shift"], 2, "Bedside labeling after collection prevents mix-ups."),
        ]),
      ],
    },
    {
      title: "3. Venous blood collection",
      summary: "Order of draw and preventing errors.",
      lessons: [
        text("Order of draw and tube handling", 12, `### CLSI order of draw (evacuated tubes and syringe transfer)
1. **Blood culture** bottles / sterile specimens
2. **Sodium citrate** (light blue — coagulation tests)
3. **Serum tubes** with or without clot activator, with or without gel (red, gold/tiger-top)
4. **Heparin** (green, with or without gel)
5. **EDTA** (lavender/pink — hematology, many blood bank tests)
6. **Sodium fluoride/potassium oxalate** (gray — glucose, lactate)

Following the order prevents **additive carryover** — for example, EDTA (which contains potassium) contaminating a chemistry tube and falsely raising potassium. Tube colors can vary by manufacturer; follow your lab's guide.

### Tube handling
- **Fill to the indicated volume** — light-blue citrate tubes must be filled correctly because the blood-to-anticoagulant ratio affects coagulation results. If a winged (butterfly) set is used and the citrate tube is first, a **discard tube** may be needed to fill the tubing dead space.
- **Gently invert** each tube the number of times specified by the manufacturer immediately after collection. **Do not shake.**

### Preventing hemolysis and other errors
- Let alcohol **dry** completely before puncture.
- Limit **tourniquet** time to about **1 minute**; avoid prolonged fist pumping.
- Use an appropriate needle size; avoid forcing blood through a small needle.
- **Do not draw above an IV** infusion site; follow policy for drawing from the opposite arm or below the IV after stopping the infusion.
- Avoid the arm on the side of a mastectomy or with a dialysis fistula unless approved.`),
      ],
    },
    {
      title: "4. Urine, swabs, transport and safety",
      summary: "Other specimens and getting them to the lab intact.",
      lessons: [
        text("Other specimens and transport", 10, `### Urine
- **Clean-catch midstream**: cleanse as instructed, begin voiding into the toilet, collect the midstream portion in the sterile container without touching the inside, finish voiding into the toilet.
- First-morning specimens are more concentrated for some tests. **24-hour** collections begin after discarding the first void, then collect all urine for 24 hours, keeping it refrigerated or with preservative as instructed.
- Deliver promptly; refrigerate if delay is expected and allowed for the test.

### Swabs
- Use the **swab type and transport medium** specified for the test (e.g., nasopharyngeal vs. nasal, flocked swabs, viral transport media).
- Avoid touching the swab tip; break or cut the shaft as instructed and close tightly.

### Transport and storage
- Send specimens **promptly** at the required temperature (room temperature, refrigerated, on ice, protected from light).
- Use **leak-proof biohazard bags** with requisitions in the outer pocket.
- Specimens may be **rejected** for being unlabeled or mislabeled, hemolyzed, clotted (in anticoagulated tubes), underfilled, collected in the wrong container or delayed too long. Rejection means a repeat collection — report and recollect; never relabel someone else's specimen.

### Chain of custody
Forensic and some employment drug tests require a **chain-of-custody form** documenting every person who handled the specimen, with tamper-evident seals.

### Safety
Use safety-engineered needles; activate safety features immediately; **never recap**; dispose of sharps at point of use. Report exposures immediately.`),
        check("Check your understanding: specimens and transport", [
          kc("lab3", "Which are common reasons for specimen rejection?", ["Unlabeled tube", "Hemolyzed sample", "Underfilled citrate tube", "Label with two identifiers"], [0, 1, 2], "Correct labeling with two identifiers is required, not a rejection reason."),
          kc("lab4", "For a clean-catch urine, which portion is collected?", ["The first few drops", "The midstream portion", "The last drops only", "Urine from the toilet bowl"], 1, "Midstream collection reduces contamination from skin and urethral flora."),
        ]),
      ],
    },
    {
      title: "5. Putting it together",
      summary: "Case study.",
      lessons: [
        caseStudy("Case study: the potassium of 6.8", 8, `**Situation (fictional).** A medical assistant collects blood from Mr. K. in a busy clinic. The order is a basic metabolic panel (gold tube) and CBC (lavender tube). She draws the lavender tube first, then the gold, after a 3-minute tourniquet time while the patient pumps his fist. The lab reports potassium of 6.8 mmol/L (high) with slight hemolysis. The prescriber is alarmed.

**Discussion:**
1. What errors may have falsely raised the potassium? *(EDTA carryover from drawing lavender before the serum tube; prolonged tourniquet and fist pumping; hemolysis.)*
2. What should happen now? *(Notify the provider of possible collection error; recollect correctly; complete an occurrence report per policy.)*
3. How could it be prevented? *(Follow the order of draw — gold before lavender; tourniquet ≤1 minute; no fist pumping; let alcohol dry.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Laboratory Specimen Collection — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("In which phase do most laboratory errors occur?", ["Analytical", "Pre-analytical", "Post-analytical", "Billing"], 1, "Collection, labeling and transport errors account for most lab errors."),
      mc("According to CLSI order of draw, which comes first?", ["EDTA (lavender)", "Blood cultures", "Heparin (green)", "Gray top"], 1, "Sterile blood cultures are drawn first."),
      mc("Which tube is drawn last in the standard order?", ["Light blue (citrate)", "Gold (serum)", "Lavender (EDTA)", "Gray (fluoride/oxalate)"], 3, "Sodium fluoride/potassium oxalate is last."),
      tf("Tubes may be labeled before entering the patient's room to save time.", false, "Pre-labeling causes wrong-patient errors; label after collection in the patient's presence."),
      mc("Why must a light-blue citrate tube be filled correctly?", ["For appearance", "The blood-to-anticoagulant ratio affects coagulation results", "It is the most expensive tube", "To prevent clotting in the needle"], 1, "Underfilling dilutes the sample and alters coagulation results."),
      mc("EDTA carryover into a chemistry tube can falsely raise:", ["Glucose", "Potassium", "Sodium only", "Cholesterol"], 1, "EDTA is often a potassium salt; carryover falsely raises potassium."),
      ms("Which help prevent hemolysis? (Select all that apply.)", ["Let alcohol dry before puncture", "Limit tourniquet time to about 1 minute", "Shake tubes vigorously", "Use an appropriate needle size"], [0, 1, 3], "Shaking causes hemolysis; invert gently."),
      sc("A patient has an IV running in the left forearm. Where should you draw?", ["Directly above the IV in the left arm", "From the opposite arm, or as policy allows below the IV after the infusion is stopped", "From the IV tubing without flushing", "Anywhere convenient"], 1, "Drawing above an IV dilutes or contaminates the sample."),
      mc("How should you confirm identity?", ["Ask 'Are you John Smith?'", "Ask the patient to state full name and date of birth and compare with the order and ID band", "Use the room number", "Ask a family member to confirm"], 1, "Two identifiers, stated by the patient when possible."),
      tf("Tubes with additives should be gently inverted the number of times recommended by the manufacturer.", true, "Gentle inversion mixes additives without hemolysis."),
      mc("A clean-catch urine specimen is collected from:", ["The first stream", "The midstream", "A bedpan", "The toilet"], 1, "Midstream reduces contamination."),
      ms("Which are reasons a specimen may be rejected? (Select all that apply.)", ["Mislabeled", "Clotted EDTA tube", "Delayed beyond stability", "Delivered on time in the correct container"], [0, 1, 2], "Correctly handled specimens are accepted."),
      mc("A chain-of-custody form documents:", ["The patient's insurance", "Every person who handled the specimen, with tamper-evident seals", "The tourniquet time", "The color of the tube"], 1, "Chain of custody maintains legal defensibility."),
      sc("You find an unlabeled tube of blood on the counter after a busy morning. What should you do?", ["Label it with your best guess", "Do not label it; report it and arrange recollection per policy", "Send it unlabeled", "Throw it away and say nothing"], 1, "Never label specimens you did not collect or cannot verify."),
      mc("What is the correct action with a used needle?", ["Recap with two hands", "Activate the safety device and dispose of it immediately in a sharps container", "Place it on the tray to discard later", "Bend it before disposal"], 1, "Immediate disposal with safety activation prevents injuries."),
    ],
  },
};
