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
