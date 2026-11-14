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
];
