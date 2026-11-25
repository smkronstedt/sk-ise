import type { Question } from "./types";

/** Original high-yield questions on spinal cord injury effects on the lower urinary tract.
 * Focused on initial onset / spinal shock, progression, sphincter and bladder behavior,
 * and patterns by level. Not SASP items. */
export const sciQuestions: Question[] = [
  {
    id: "SCI-001",
    topicId: "nlutd",
    stem: ["Immediately after a complete C6 spinal cord injury, the typical bladder and sphincter pattern is:"],
    choices: [
      "Hyperreflexic detrusor with detrusor-sphincter dyssynergia",
      "Areflexic / flaccid detrusor and sphincter with urinary retention",
      "Low-compliance bladder with high storage pressures",
      "Normal coordinated voiding",
      "Isolated sphincter spasticity only"
    ],
    answer: 1,
    explanation: "Spinal shock produces an areflexic detrusor and sphincter. The patient has retention (often managed with an indwelling catheter initially). This mimics a lower-motor-neuron pattern even when the injury is high. Findings during shock do not predict the eventual chronic pattern.",
    wrong: [
      "That pattern appears only after spinal shock resolves in suprasacral injuries.",
      "High pressures and low compliance develop later if the bladder is left untreated.",
      "Normal voiding is lost.",
      "Both detrusor and sphincter are flaccid in the acute phase."
    ],
    objective: "Recognize spinal shock as areflexic retention that does not predict the final neurogenic pattern."
  },
  {
    id: "SCI-002",
    topicId: "nlutd",
    stem: ["In the spinal-shock phase after SCI, the external urethral sphincter is typically:"],
    choices: [
      "Spastic and dyssynergic",
      "Flaccid",
      "Hypertonic only during detrusor contractions",
      "Normal",
      "Absent EMG activity permanently"
    ],
    answer: 1,
    explanation: "During spinal shock both the detrusor and the external sphincter are flaccid. Somatic and autonomic reflexes are suppressed. The sphincter does not remain spastic or dyssynergic until the shock phase ends.",
    wrong: [
      "Spasticity and dyssynergia appear after recovery of the sacral reflex arc in suprasacral injuries.",
      "Hypertonicity is not present in the acute phase.",
      "Normal sphincter behavior is lost.",
      "EMG can return once shock resolves."
    ],
    objective: "Identify that the sphincter is flaccid during spinal shock."
  },
  {
    id: "SCI-003",
    topicId: "nlutd",
    stem: ["Six months after a complete T4 spinal cord injury, the expected urodynamic pattern is:"],
    choices: [
      "Areflexic detrusor with a flaccid sphincter",
      "Detrusor overactivity with detrusor-sphincter dyssynergia",
      "Normal voiding with synergy",
      "Low-pressure, high-compliance storage only",
      "Isolated bladder-neck dyssynergia without detrusor activity"
    ],
    answer: 1,
    explanation: "After spinal shock resolves, a suprasacral (upper-motor-neuron) injury leaves the sacral reflex arc intact but without descending inhibition. The result is neurogenic detrusor overactivity plus detrusor-sphincter dyssynergia. Storage pressures are often high and place the upper tracts at risk.",
    wrong: [
      "That pattern is the sacral / lower-motor-neuron pattern.",
      "Coordination is lost.",
      "Pressures are frequently elevated when DSD is present.",
      "Detrusor activity returns after shock."
    ],
    objective: "Predict the chronic suprasacral pattern of detrusor overactivity plus DSD."
  },
  {
    id: "SCI-004",
    topicId: "nlutd",
    stem: ["Autonomic dysreflexia is classically a risk with spinal cord injuries at or above which level?"],
    choices: [
      "T10",
      "T6",
      "L1",
      "S2",
      "Any level"
    ],
    answer: 1,
    explanation: "Autonomic dysreflexia occurs with injuries at or above T6, where major splanchnic sympathetic outflow is interrupted. A noxious stimulus below the lesion (most often bladder distension or infection) produces an uncontrolled sympathetic surge. It is rare below T6.",
    wrong: [
      "T10 is below the classic threshold.",
      "L1 and S2 do not produce the classic AD picture.",
      "It is level-dependent."
    ],
    objective: "Recall that autonomic dysreflexia risk begins at T6 or higher."
  },
  {
    id: "SCI-005",
    topicId: "nlutd",
    stem: ["The most common trigger for autonomic dysreflexia is:"],
    choices: [
      "Pressure ulcer",
      "Bladder distension or urinary tract infection",
      "Bowel impaction only",
      "Change in position",
      "Ambient temperature change"
    ],
    answer: 1,
    explanation: "Bladder distension or a urinary tract infection is the most frequent trigger. Other noxious stimuli (bowel, skin, etc.) can also provoke it, but the bladder is the most common. The first management step is always to identify and relieve the trigger (sit the patient up and empty the bladder).",
    wrong: [
      "Skin lesions can trigger AD but are less common than bladder stimuli.",
      "Bowel is a known trigger but not the most common.",
      "Position change is not the usual cause.",
      "Temperature is not a primary trigger."
    ],
    objective: "Identify bladder distension or infection as the most common AD trigger."
  },
  {
    id: "SCI-006",
    topicId: "nlutd",
    stem: ["A complete S3 spinal cord injury typically produces which pattern?"],
    choices: [
      "Detrusor overactivity with detrusor-sphincter dyssynergia",
      "Areflexic detrusor and flaccid sphincter",
      "Normal coordinated voiding",
      "Isolated autonomic dysreflexia",
      "High-pressure storage with synergy"
    ],
    answer: 1,
    explanation: "A sacral or infrasacral injury destroys the sacral reflex arc (parasympathetic outflow and pudendal innervation of the external sphincter). The result is an acontractile / areflexic detrusor and a flaccid sphincter (lower-motor-neuron pattern). Pressures are low, capacity is large, and DSD cannot occur.",
    wrong: [
      "That is the suprasacral upper-motor-neuron pattern.",
      "Coordination is lost.",
      "AD is not expected at this level.",
      "Pressures are low in the pure LMN pattern."
    ],
    objective: "Distinguish the sacral lower-motor-neuron pattern from the suprasacral pattern."
  },
  {
    id: "SCI-007",
    topicId: "nlutd",
    stem: ["Why is definitive urodynamic testing often delayed until after spinal shock has resolved?"],
    choices: [
      "Findings are stable from day one",
      "Early findings do not predict the final chronic pattern; shock can last weeks to months",
      "Patients cannot tolerate the study",
      "Guidelines prohibit any UDS in the first year",
      "The bladder is always high-pressure immediately"
    ],
    answer: 1,
    explanation: "During spinal shock the bladder is areflexic regardless of the eventual level of injury. The study does not predict whether the patient will develop detrusor overactivity with DSD or remain acontractile. Shock typically lasts weeks to a few months (sometimes longer). UDS is most useful once the pattern has stabilized.",
    wrong: [
      "Findings change once the shock phase ends.",
      "Tolerance is not the primary reason.",
      "Guidelines support delayed but not forbidden testing.",
      "Pressures are low during shock."
    ],
    objective: "Explain why urodynamics during spinal shock is not predictive."
  },
  {
    id: "SCI-008",
    topicId: "nlutd",
    stem: ["High-risk features for upper-tract deterioration in SCI include:"],
    choices: [
      "Low storage pressures and good compliance",
      "Storage pressures >40 cm H₂O, poor compliance, vesicoureteral reflux, or detrusor-sphincter dyssynergia",
      "Isolated incontinence without elevated pressures",
      "A flaccid, high-capacity bladder only",
      "Normal residual volumes"
    ],
    answer: 1,
    explanation: "Upper-tract risk is driven by sustained high storage pressures (classically >40 cm H₂O), poor compliance, reflux, and untreated DSD. A low-pressure, high-capacity flaccid bladder is lower risk for the kidneys. Risk stratification guides surveillance intensity.",
    wrong: [
      "Low pressures protect the upper tracts.",
      "Incontinence alone is not the risk driver.",
      "A pure flaccid pattern is usually low pressure.",
      "Normal residuals do not indicate high risk."
    ],
    objective: "List the urodynamic features that place the upper tracts at risk after SCI."
  },
  {
    id: "SCI-009",
    topicId: "nlutd",
    stem: ["A patient with a C5 injury develops sudden headache, flushing above the lesion, and hypertension during intermittent catheterization. The first step is:"],
    choices: [
      "Give intravenous labetalol immediately",
      "Sit the patient up and check / empty the bladder",
      "Call neurosurgery",
      "Observe for 30 minutes",
      "Obtain an immediate head CT"
    ],
    answer: 1,
    explanation: "This is autonomic dysreflexia. The first action is always to identify and remove the noxious stimulus—most often bladder distension. Sit the patient upright and drain the bladder. Antihypertensives are used if the blood pressure remains elevated after the trigger is relieved.",
    wrong: [
      "Pharmacologic treatment is secondary to trigger removal.",
      "Neurosurgery is not the acute management.",
      "Observation delays treatment of a hypertensive crisis.",
      "Imaging is not the first step."
    ],
    objective: "Manage autonomic dysreflexia by relieving the trigger before medication."
  },
  {
    id: "SCI-010",
    topicId: "nlutd",
    stem: ["After spinal shock resolves in a complete suprasacral injury, sphincter behavior during a detrusor contraction is typically:"],
    choices: [
      "Synergistic relaxation",
      "Concurrent contraction (detrusor-sphincter dyssynergia)",
      "Always flaccid",
      "Absent on EMG",
      "Only intermittent"
    ],
    answer: 1,
    explanation: "In the chronic suprasacral upper-motor-neuron pattern the external sphincter contracts simultaneously with the detrusor (detrusor-sphincter dyssynergia). This produces incomplete emptying and elevated storage pressures. Synergistic relaxation is lost because descending inhibition is absent.",
    wrong: [
      "Synergy requires intact descending pathways.",
      "The sphincter is hyperreflexic, not flaccid, after shock.",
      "EMG activity is present and concurrent.",
      "DSD can be continuous or intermittent but is the hallmark."
    ],
    objective: "Describe detrusor-sphincter dyssynergia as the chronic sphincter pattern in suprasacral SCI."
  },
  {
    id: "SCI-011",
    topicId: "nlutd",
    stem: ["A patient with a complete L1 injury (conus) may demonstrate:"],
    choices: [
      "Only classic upper-motor-neuron detrusor-sphincter dyssynergia",
      "Only classic lower-motor-neuron areflexia",
      "A mixed pattern (elements of both UMN and LMN)",
      "Always normal voiding",
      "Autonomic dysreflexia in every case"
    ],
    answer: 2,
    explanation: "Injuries near the conus medullaris or cauda equina can produce mixed patterns. Some patients show detrusor overactivity, others areflexia, and sphincter behavior can vary. Pure UMN or pure LMN patterns are more predictable at clearly cervical/thoracic versus clearly sacral levels.",
    wrong: [
      "Conus lesions are not reliably pure UMN.",
      "They are not reliably pure LMN either.",
      "Normal voiding is rare.",
      "AD is not expected at L1."
    ],
    objective: "Recognize that conus / mixed-level injuries produce variable urodynamic patterns."
  },
  {
    id: "SCI-012",
    topicId: "nlutd",
    stem: ["Preferred long-term bladder management after SCI, when hand function allows, is:"],
    choices: [
      "Chronic indwelling Foley catheter",
      "Clean intermittent catheterization",
      "Reflex voiding into a condom catheter without pressure monitoring",
      "Suprapubic tube in every patient",
      "Ileal conduit as first-line therapy"
    ],
    answer: 1,
    explanation: "Clean intermittent catheterization is preferred when feasible. It lowers infection risk compared with chronic indwelling catheters and allows low-pressure storage when combined with anticholinergics or onabotulinumtoxinA if needed. Reflex voiding requires documented low pressures. Augmentation or diversion is reserved for refractory high-pressure bladders.",
    wrong: [
      "Indwelling catheters have higher infection and complication rates.",
      "Reflex voiding is acceptable only if pressures are proven low.",
      "Suprapubic tubes are not first-line for every patient.",
      "Urinary diversion is not first-line."
    ],
    objective: "Select clean intermittent catheterization as preferred management when feasible after SCI."
  }
];
