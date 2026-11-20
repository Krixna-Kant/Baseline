export const SCHEMA_VERSION = 1;

export type Source = "app" | "device" | "import" | "informant" | "clinician" | "simulation";

export type ConsentScope =
  | "core"
  | "informant"
  | "device"
  | "records_import"
  | "genomics"
  | "share_clinician"
  | "research_use";

export type Education = "none_primary" | "secondary" | "tertiary";
export type FamiliarityBand = "low" | "medium" | "high";
export type TextScale = 1 | 1.15 | 1.3;

export interface Profile {
  id: string;
  createdAt: string;
  language: "ar" | "en";
  birthYear: number;
  sex: "female" | "male" | "undisclosed";
  education: Education;
  digitalFamiliarity: { answers: number[]; score: number; band: FamiliarityBand };
  sensory: { hearingOk: boolean; visionOk: boolean; textScale: TextScale };
  assistedDefault: boolean;
  isSynthetic: boolean;
}

export type Consents = Record<ConsentScope, { granted: boolean; at: string }>;

export interface CheckIn {
  sleepHours: number;
  sleepQuality: number;
  mood: number;
  stress: number;
  ill: boolean;
  hearingOk: boolean;
  visionOk: boolean;
  loneliness: number;
  fasting: boolean;
  newMedication: boolean;
  caffeine: boolean;
  redFlag: boolean;
}

export type TaskFamily = "shopping" | "quick" | "medication";

export interface RawEvent {
  t: number;
  type: string;
  data?: Record<string, unknown>;
}

export interface TaskResult {
  family: TaskFamily;
  phase?: "immediate" | "delayed";
  formId: string;
  practice: boolean;
  startedAt: string;
  endedAt: string;
  events: RawEvent[];
  metrics: Record<string, number | null>;
  validity: string[];
}

export type SessionType = "baseline" | "daily" | "retest";

export interface Session {
  id: string;
  type: SessionType;
  startedAt: string;
  endedAt?: string;
  completed: boolean;
  deviceType: "phone" | "tablet" | "desktop";
  inputMode: "tap" | "voice" | "mixed";
  assisted: boolean;
  checkIn?: CheckIn;
  tasks: TaskResult[];
  source: Source;
  isSynthetic: boolean;
  schemaVersion: number;
}

/** Lancet Commission 2024 modifiable factors; education comes from the profile. */
export const RISK_FACTORS = [
  "hearing_loss",
  "vision_loss",
  "hypertension",
  "diabetes",
  "high_ldl",
  "obesity",
  "inactivity",
  "smoking",
  "alcohol",
  "depression",
  "social_isolation",
  "head_injury",
  "air_pollution",
] as const;
export type RiskFactor = (typeof RISK_FACTORS)[number];
export type Tri = "yes" | "no" | "unknown";

export interface FactorAnswer {
  value: Tri;
  source: Source;
  at: string;
}

export interface RiskProfile {
  factors: Partial<Record<RiskFactor, FactorAnswer>>;
  familyHistory: { value: Tri; relation?: "parent" | "sibling" | "other"; onsetBefore65?: Tri };
  /** Synthetic only. Never shown to the user; appears in the clinician packet with a counseling prompt. */
  genomics?: { apoe4: "carrier" | "non_carrier" | "unknown"; isSynthetic: true; at: string };
  updatedAt: string;
}

export interface InformantReport {
  id: string;
  at: string;
  relationship: "spouse" | "child" | "sibling" | "friend" | "caregiver" | "other";
  language: "ar" | "en";
  /** One per item: 1 = change in the last year, 0 = no change, null = don't know. */
  answers: (0 | 1 | null)[];
  score: number;
  newDifficulty: boolean;
  source: Source;
  isSynthetic: boolean;
}

export type ReadingType = "bp" | "glucose" | "hba1c" | "sleep" | "steps" | "weight";

export interface Reading {
  id: string;
  type: ReadingType;
  /** bp: systolic/diastolic; glucose: value + fasting; sleep: hours; steps: count; weight: kg. */
  values: Record<string, number>;
  unit: string;
  measuredAt: string;
  source: Source;
  deviceModel?: string;
  context?: "resting" | "after_exercise" | "fasting" | "after_meal" | "unknown";
  quality: "good" | "uncertain" | "poor";
  note?: string;
  consentScope: "device" | "records_import";
  isSynthetic: boolean;
}

export type ReviewDecision = "accept" | "override" | "refer_onward";
export type ReviewOutcome =
  | "no_impairment"
  | "mci"
  | "dementia"
  | "reversible_cause"
  | "mood_or_sleep"
  | "sensory"
  | "pending";

export interface Referral {
  id: string;
  sharedAt: string;
  /** Snapshot of the engine decision at sharing time; the console shows this, not a live recompute. */
  state: string;
  ruleFired: string;
  thresholdVersion: string;
  route: string;
  openedAt?: string;
  decision?: {
    kind: ReviewDecision;
    reason?: string;
    referredTo?: string;
    note?: string;
    at: string;
  };
  outcome?: { kind: ReviewOutcome; detail?: string; at: string };
}
