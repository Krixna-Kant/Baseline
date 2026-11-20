export interface Est {
  est: number | null;
  lo?: number | null;
  hi?: number | null;
}

export interface Summary {
  sensitivity_12m: Est;
  specificity_12m: Est;
  false_reviews_per_1000_py: Est;
  ppv: Est;
  completion: Est;
  baseline_completion: Est;
  dropout: Est;
  lead_days_median: Est;
  n_users: number;
  n_eligible_decliners: number;
}

export interface SweepRow {
  watch_z: number;
  rapid_z: number;
  gate: "two_stage" | "one_stage";
  sensitivity_12m: number;
  specificity_12m: number;
  false_reviews_per_1000_py: number;
  ppv: number | null;
  lead_days_median: number | null;
  worst_sensitivity_gap: number;
  worst_false_ratio: number;
  fails: string[];
  feasible: boolean;
}

export interface Fairness {
  sensitivity_gap: number;
  false_ratio: number;
  excluded: string[];
}

export interface Icc {
  icc: number;
  lo: number;
  hi: number;
  n: number;
}

export interface DifFamily {
  found: number;
  planted: number;
  false_flags: number;
  tests_unbiased: number;
  false_flag_rate: number;
  pass: boolean;
  planted_grouping: string;
}

export interface TimelapseUser {
  key: string;
  label: string;
  profile: Record<string, string>;
  onset_day: number | null;
  review_day: number | null;
  points: { day: number; z: number | null; state: string; true_change: number; done: boolean }[];
}

export interface ModelRow {
  name: string;
  sensitivity_12m: number | null;
  specificity_12m: number | null;
  false_reviews_per_1000_py: number | null;
  ppv: number | null;
  lead_days_median: number | null;
}

export interface Profile {
  n: number;
  trajectory?: Record<string, number>;
  familiarity?: Record<string, number>;
  age_band?: Record<string, number>;
  completion_mean?: number;
  dropped_out_share?: number;
}

export interface LabResults {
  meta: {
    label: string;
    protocol_version: string;
    amendments: string[];
    seed: number;
    n_users: number;
    fast_mode: boolean;
    generated_at: string;
    engine_version: string;
  };
  sweep: SweepRow[];
  v1: { watch_z: number; rapid_z: number; gate: SweepRow["gate"]; rule: string; fails: string[] };
  main: Summary;
  segments: Record<string, Record<string, Summary & { low_n: boolean; low_n_decliners: boolean }>>;
  fairness: Record<string, Fairness>;
  gate_comparison: { two_stage: Summary; one_stage: Summary; extra_delay_days_median: number | null };
  reliability: Record<"baseline_halves" | "consecutive_blocks", Record<string, Icc>>;
  dif: {
    shopping: DifFamily;
    medication: DifFamily;
    exploratory_purified?: { label: string; shopping: DifFamily; medication: DifFamily };
  };
  pathway: {
    usual_care_months_median: number;
    baseline_months_median: number;
    assessed_within_12m_usual: number;
    assessed_within_12m_baseline: number;
    usual_care_months_iqr: [number, number];
    baseline_months_iqr: [number, number];
  };
  ablations: ModelRow[];
  sensitivity_analysis: ModelRow[];
  failures: { missed_decliners: Profile; false_reviews: Profile; detected_decliners: Profile };
  criteria: { name: string; target: string; value: string; pass: boolean }[];
  timelapse: TimelapseUser[];
}
