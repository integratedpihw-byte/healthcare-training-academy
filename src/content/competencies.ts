/**
 * Practical skills checklist TEMPLATES (spec §9). Platform-global; organizations
 * adapt them to facility policy, equipment and each worker's authorized scope of
 * practice. "critical" items must be met for a PASS. These templates are educational
 * starting points and should be reviewed by the facility's clinical leadership.
 * Renewal intervals are intentionally unset: they come from licensure rules,
 * accreditation standards or organizational policy (configured per organization).
 */
export interface CompetencyTemplate {
  code: string;
  name: string;
  description: string;
  criteria: { id: string; text: string; critical: boolean }[];
}

const c = (id: string, text: string, critical = false) => ({ id, text, critical });

export const COMPETENCY_TEMPLATES: CompetencyTemplate[] = [
  {
    code: "COMP-HH",
    name: "Hand hygiene",
    description: "Alcohol-based hand rub and soap-and-water handwashing at the correct clinical moments (CDC).",
    criteria: [
      c("1", "Identifies the clinical indications for hand hygiene (before patient contact, before aseptic task, after body fluid exposure, after patient/environment contact, after glove removal)", true),
      c("2", "Selects alcohol-based hand rub unless hands are visibly soiled or soap and water is directed"),
      c("3", "Hand rub: applies enough product and rubs all surfaces (thumbs, fingertips, between fingers) until dry", true),
      c("4", "Handwashing: wets hands, applies soap, rubs all surfaces at least 15–20 seconds, rinses, dries with disposable towel", true),
      c("5", "Turns off faucet with a towel"),
      c("6", "Nails short and no artificial nails per facility policy"),
      c("7", "Performs hand hygiene immediately after removing gloves", true),
    ],
  },
  {
    code: "COMP-PPE",
    name: "PPE application and removal",
    description: "Risk-based PPE selection and donning/doffing without self-contamination (CDC sequence).",
    criteria: [
      c("1", "Selects PPE appropriate to the anticipated exposure or posted precautions", true),
      c("2", "Performs hand hygiene before donning"),
      c("3", "Dons in sequence: gown, mask/respirator, eye protection, gloves (gloves over gown cuffs)", true),
      c("4", "Performs user seal check when wearing a respirator"),
      c("5", "Doffs in a sequence that prevents contamination (gloves first or gown-and-gloves together; mask/respirator last)", true),
      c("6", "Does not touch the front of the mask/respirator or eye protection during removal", true),
      c("7", "Disposes of PPE in the correct container and performs hand hygiene immediately after removal", true),
    ],
  },
  {
    code: "COMP-VS",
    name: "Vital signs",
    description: "Temperature, pulse, respirations and oxygen saturation with accurate documentation and escalation.",
    criteria: [
      c("1", "Identifies the patient with two identifiers and explains the procedure", true),
      c("2", "Performs hand hygiene and cleans shared equipment before and after use"),
      c("3", "Measures temperature using the correct device and route per manufacturer instructions"),
      c("4", "Counts radial pulse for the required interval and notes rate, rhythm and strength"),
      c("5", "Counts respirations without the patient's awareness for the required interval"),
      c("6", "Measures SpO2 with correct probe placement and adequate signal"),
      c("7", "Documents values accurately and promptly in the record", true),
      c("8", "Recognizes values outside parameters and reports to the licensed nurse/provider per policy", true),
    ],
  },
  {
    code: "COMP-BP",
    name: "Blood pressure measurement",
    description: "Accurate manual or automated blood pressure measurement.",
    criteria: [
      c("1", "Identifies the patient and has the patient seated with back supported, feet flat and arm supported at heart level"),
      c("2", "Selects correct cuff size for arm circumference", true),
      c("3", "Places cuff on bare upper arm with artery marker aligned"),
      c("4", "Ensures the patient is not talking during measurement"),
      c("5", "Manual: palpates estimated systolic, inflates appropriately, deflates at 2–3 mmHg per second and identifies systolic and diastolic sounds", true),
      c("6", "Documents reading, arm and position; repeats per policy if abnormal"),
      c("7", "Reports readings outside parameters per policy", true),
    ],
  },
  {
    code: "COMP-TRANSFER",
    name: "Patient transfers",
    description: "Safe pivot and mechanical-lift transfers according to the care plan.",
    criteria: [
      c("1", "Reviews the care plan for transfer method, assist level and equipment", true),
      c("2", "Identifies the patient, explains the transfer and obtains cooperation"),
      c("3", "Locks wheels on bed, chair or wheelchair", true),
      c("4", "Uses gait belt or mechanical lift as indicated; never lifts by the patient's arms", true),
      c("5", "Uses correct body mechanics (wide base, bend knees, keep load close, avoid twisting)"),
      c("6", "Uses the required number of staff for the assist level", true),
      c("7", "Positions patient safely with call light within reach after transfer"),
      c("8", "Reports changes in tolerance, pain or near-falls"),
    ],
  },
  {
    code: "COMP-FALLS",
    name: "Fall prevention",
    description: "Environment and individualized interventions to reduce fall risk.",
    criteria: [
      c("1", "Identifies residents/patients at increased fall risk from the care plan and visual cues", true),
      c("2", "Keeps bed in low position with brakes locked and call light and personal items within reach", true),
      c("3", "Ensures non-slip footwear, adequate lighting and clear pathways"),
      c("4", "Uses assistive devices correctly as ordered"),
      c("5", "Implements scheduled toileting/rounding per care plan"),
      c("6", "Responds to bed/chair alarms promptly"),
      c("7", "After a fall: does not move the person until assessed, calls for help, and reports per policy", true),
    ],
  },
  {
    code: "COMP-MEDSAFE",
    name: "Medication safety",
    description: "Medication rights and safe practices within the worker's authorized role. Evaluate only tasks the worker is legally authorized to perform.",
    criteria: [
      c("1", "States the limits of their role and does not perform medication tasks outside authorization", true),
      c("2", "Verifies right person (two identifiers), drug, dose, route and time against the order/MAR", true),
      c("3", "Checks allergies and reports concerns before proceeding", true),
      c("4", "Reads labels three times; does not use unlabeled or expired medications"),
      c("5", "Documents immediately after the task — never before", true),
      c("6", "Recognizes and reports refusals, errors and possible adverse reactions immediately", true),
      c("7", "Stores medications securely per facility policy"),
    ],
  },
  {
    code: "COMP-SPECIMEN",
    name: "Blood specimen collection",
    description: "Venipuncture/specimen collection practices for workers trained and authorized to collect blood.",
    criteria: [
      c("1", "Verifies the order and identifies the patient with two identifiers", true),
      c("2", "Performs hand hygiene and dons gloves"),
      c("3", "Selects correct tubes and follows the facility's order of draw", true),
      c("4", "Applies tourniquet appropriately and releases it per policy"),
      c("5", "Activates safety device and disposes of the needle immediately in a sharps container", true),
      c("6", "Labels tubes at the bedside in the patient's presence with required identifiers", true),
      c("7", "Handles, stores and transports the specimen per laboratory requirements"),
      c("8", "Responds appropriately to complications (hematoma, syncope) and reports exposures", true),
    ],
  },
  {
    code: "COMP-IC",
    name: "Infection control",
    description: "Standard and Transmission-Based Precautions in daily care.",
    criteria: [
      c("1", "Applies Standard Precautions with every patient", true),
      c("2", "Follows posted Transmission-Based Precautions signage and PPE requirements", true),
      c("3", "Cleans and disinfects shared equipment between patients with the correct product and contact time"),
      c("4", "Handles soiled linen and waste without contaminating self or environment"),
      c("5", "Practices respiratory hygiene and offers masks to symptomatic individuals"),
      c("6", "Reports signs of infection and own illness per policy"),
    ],
  },
  {
    code: "COMP-EMERG",
    name: "Emergency response",
    description: "Recognition and initial response to medical and facility emergencies.",
    criteria: [
      c("1", "Recognizes an unresponsive person and calls for help/activates the emergency response system", true),
      c("2", "Knows the location of emergency equipment (AED, emergency cart/kit, oxygen, fire extinguishers)"),
      c("3", "Provides CPR/first aid only within current certification and role"),
      c("4", "States facility fire response (e.g., RACE/PASS) and evacuation routes", true),
      c("5", "States how to respond to a missing-resident/patient alert"),
      c("6", "Documents and reports the event per policy"),
    ],
  },
  {
    code: "COMP-ID",
    name: "Patient identification",
    description: "Use of two identifiers before care, treatment, medications and specimen collection.",
    criteria: [
      c("1", "Uses at least two identifiers (e.g., name and date of birth); never room number", true),
      c("2", "Asks the patient to state identifiers when able, rather than asking yes/no"),
      c("3", "Compares identifiers to the wristband/photo and the order/record", true),
      c("4", "Stops and escalates when identifiers do not match", true),
      c("5", "Uses alternative identification procedures for patients unable to respond, per policy"),
    ],
  },
  {
    code: "COMP-DOC",
    name: "Clinical documentation",
    description: "Accurate, timely, objective documentation in the record.",
    criteria: [
      c("1", "Documents only care personally provided or observed, under own login", true),
      c("2", "Documents promptly, with accurate date and time"),
      c("3", "Uses objective, factual language and approved abbreviations only"),
      c("4", "Corrects errors per policy without deleting or obscuring the original entry", true),
      c("5", "Never documents in advance or for another person", true),
      c("6", "Protects confidentiality of the record (screen locked, no PHI on personal devices)"),
    ],
  },
  // --- Home Health division (practical skills for HHA / personal care training). An RN
  // (or LPN under RN supervision, where the program allows) observes and signs. ---
  {
    code: "COMP-HHA-BATH",
    name: "Bathing and personal hygiene (bed bath, shower, shampoo)",
    description: "Complete or partial bed bath, tub or shower assistance and hair care with privacy, safety and skin observation.",
    criteria: [
      c("1", "Identifies the client, explains the procedure and obtains consent; provides privacy", true),
      c("2", "Performs hand hygiene and uses gloves when contact with body fluids or non-intact skin is possible", true),
      c("3", "Checks water temperature with a thermometer or the inside of the wrist before use and keeps the client covered", true),
      c("4", "Washes clean to dirty areas, changes water when needed and dries skin thoroughly, especially skin folds"),
      c("5", "Provides perineal care front to back with a clean area of the cloth for each stroke", true),
      c("6", "Uses non-slip mat, shower chair or grab bars and never leaves the client alone in the tub or shower", true),
      c("7", "Observes skin and reports redness, open areas, bruises or rash to the supervising nurse", true),
      c("8", "Encourages the client to do as much as they safely can"),
      c("9", "Cleans equipment, performs hand hygiene and documents care and observations"),
    ],
  },
  {
    code: "COMP-HHA-ORAL",
    name: "Oral care and denture care",
    description: "Mouth care for a client who can assist, a client who cannot, and denture care.",
    criteria: [
      c("1", "Explains the procedure, positions the client upright (or on side if unable to sit) to prevent choking", true),
      c("2", "Wears gloves and brushes all tooth surfaces, gums and tongue with a soft brush"),
      c("3", "Handles dentures over a towel or basin of water, cleans with a denture brush and cool water", true),
      c("4", "Stores dentures in a labeled cup with water or solution as directed"),
      c("5", "Observes and reports bleeding, sores, loose teeth or mouth pain"),
      c("6", "Documents care and observations"),
    ],
  },
  {
    code: "COMP-HHA-DRESS",
    name: "Dressing and grooming",
    description: "Dressing assistance (including a client with a weak side), hair, nail and shaving care within agency policy.",
    criteria: [
      c("1", "Offers clothing choices and supports the client's independence and dignity"),
      c("2", "Dresses the weak or affected side first and undresses it last", true),
      c("3", "Checks that clothing and footwear are safe (non-skid, properly fitted)"),
      c("4", "Uses an electric razor for clients on blood thinners or as the care plan directs", true),
      c("5", "Does not cut nails of clients with diabetes or poor circulation unless the care plan and agency policy allow", true),
      c("6", "Documents care"),
    ],
  },
  {
    code: "COMP-HHA-TOILET",
    name: "Toileting, incontinence care and catheter bag care",
    description: "Bedpan, urinal and commode use, incontinence care and emptying a urinary drainage bag (not inserting or removing catheters).",
    criteria: [
      c("1", "Provides privacy, uses gloves and maintains the client's dignity", true),
      c("2", "Positions bedpan or commode safely and checks for skin pressure"),
      c("3", "Cleans the perineal area front to back and dries the skin; applies barrier cream if on the care plan", true),
      c("4", "Keeps the drainage bag below bladder level and off the floor; empties without touching the spout to the container", true),
      c("5", "Measures and records output when ordered; observes color, odor and amount"),
      c("6", "Reports blood, cloudy or foul-smelling urine, pain, or no output to the nurse", true),
      c("7", "Does not insert, remove or irrigate catheters (nursing tasks)", true),
    ],
  },
  {
    code: "COMP-HHA-AMBUL",
    name: "Ambulation with gait belt and assistive devices; range of motion",
    description: "Safe walking assistance with a gait belt, cane or walker, and passive or active range of motion as ordered.",
    criteria: [
      c("1", "Checks the care plan for activity orders, weight-bearing limits and assistive devices", true),
      c("2", "Has the client wear non-skid footwear; clears the path", true),
      c("3", "Applies the gait belt snugly over clothing and stands slightly behind on the weaker side", true),
      c("4", "Checks the walker or cane height and use (walker moved first, then weak leg, then strong leg)"),
      c("5", "If the client starts to fall, eases them to the floor while protecting the head and does not try to hold them upright", true),
      c("6", "Range of motion: moves each joint gently through its range only as ordered and stops at pain or resistance", true),
      c("7", "Reports dizziness, pain, new weakness or a fall to the nurse immediately", true),
      c("8", "Documents distance, assistance needed and tolerance"),
    ],
  },
  {
    code: "COMP-HHA-FEED",
    name: "Feeding assistance and fluid intake",
    description: "Assisting a client to eat and drink safely, following the diet order and aspiration precautions.",
    criteria: [
      c("1", "Checks the diet order and any texture or thickened-liquid instructions on the care plan", true),
      c("2", "Positions the client upright (as close to 90 degrees as possible) and keeps them upright after the meal as directed", true),
      c("3", "Offers small bites, allows time to chew and swallow, and alternates food and fluids"),
      c("4", "Watches for coughing, choking, wet voice or pocketing of food and stops and reports", true),
      c("5", "Records intake (percentage of meal, fluid amounts) when ordered"),
      c("6", "Encourages independence with adaptive utensils"),
    ],
  },
  {
    code: "COMP-HHA-MEDASSIST",
    name: "Assistance with self-administered medication (Florida, s. 400.488)",
    description: "Assistance only, as permitted by Florida law and agency policy, for a client who is able to self-administer. Not administration.",
    criteria: [
      c("1", "Confirms written informed consent and that the client can self-administer (as documented by the agency)", true),
      c("2", "Reads the pharmacy label aloud and confirms the right client, medication, dose, route and time", true),
      c("3", "Uses only medication in its previously dispensed, properly labeled container", true),
      c("4", "Opens the container, removes the prescribed amount and places it in the client's hand or a cup, and the client takes it", true),
      c("5", "Does not mix, compound, convert or calculate doses (except tasks the statute and agency allow, such as measuring a prescribed liquid)", true),
      c("6", "Does not decide whether an as-needed (PRN) medication is needed", true),
      c("7", "Records the assistance immediately and reports refusals, missed doses, errors or side effects to the nurse", true),
      c("8", "Returns medication to proper storage and keeps it out of reach of others"),
    ],
  },
  // --- Mental Health division ---
  {
    code: "COMP-MH-DEESC",
    name: "Verbal de-escalation (role play)",
    description: "Observed role play of a person who is agitated, using non-coercive communication and keeping everyone safe.",
    criteria: [
      c("1", "Assesses the scene for safety and keeps an exit route for self and the person", true),
      c("2", "Keeps a calm voice, open posture and respectful distance; avoids touching without consent", true),
      c("3", "Uses the person's name, listens, reflects feelings and acknowledges concerns"),
      c("4", "Offers choices and limits clearly and simply; avoids arguing, threats or ultimatums", true),
      c("5", "Knows when to disengage and call for help (supervisor, crisis team, 911)", true),
      c("6", "Documents the event factually and reports according to policy"),
    ],
  },
  {
    code: "COMP-MH-NALOXONE",
    name: "Opioid overdose response with naloxone (simulation)",
    description: "Recognize a suspected opioid overdose and respond with naloxone using a training device, following agency protocol.",
    criteria: [
      c("1", "Recognizes signs: unresponsive, slow or stopped breathing, pinpoint pupils, blue or gray lips", true),
      c("2", "Tries to wake the person (shouts, sternal rub) and calls 911", true),
      c("3", "Administers nasal naloxone correctly with the training device", true),
      c("4", "Supports breathing per training (rescue breaths or CPR) and places the person in the recovery position if breathing", true),
      c("5", "Gives a second dose after 2–3 minutes if there is no response, per product instructions", true),
      c("6", "Stays with the person, watches for return of symptoms, and hands over to EMS"),
    ],
  },
];
