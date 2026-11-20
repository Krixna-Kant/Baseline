import { enteringRule, type EvaluateResponse } from "./engine";
import { formatReading, readingLevel } from "./context";
import type { AppState } from "./store";
import { visibleData } from "./store";
import { RISK_FACTORS, type Reading, type RiskProfile } from "./types";

const CONTEXT_CHECKED = [
  "poor_sleep",
  "ill",
  "low_mood",
  "high_stress",
  "fasting",
  "new_medication",
  "sensory_problem",
] as const;

export interface Packet {
  generatedAt: string;
  person: {
    ageBand: string;
    sex: string;
    education: string;
    language: string;
    digitalFamiliarity: string;
    assisted: boolean;
    sessions: number;
    firstSession?: string;
  };
  decision: EvaluateResponse["explanation"] | null;
  trajectory: EvaluateResponse["trajectory"];
  confounders: { checked: readonly string[]; present: string[] };
  informant: { at: string; relationship: string; score: number; outOf: number; newDifficulty: boolean }[];
  risk: { factor: string; value: string; source: string }[];
  familyHistory: RiskProfile["familyHistory"] | null;
  readings: { type: Reading["type"]; text: string; level: string; at: string; source: string; quality: string; synthetic: boolean }[];
  genomics: { apoe4: string; synthetic: boolean } | null;
  statement: "screening_not_diagnosis";
}

function ageBand(birthYear: number, now: number) {
  const age = new Date(now).getFullYear() - birthYear;
  const lo = Math.floor(age / 5) * 5;
  return `${lo}-${lo + 4}`;
}

/** The engine's decision plus consented context. Noor may format this, never change it. */
export function buildPacket(state: AppState, ev: EvaluateResponse | undefined, now: number): Packet | null {
  const p = state.profile;
  if (!p) return null;
  const visible = visibleData(state);
  const done = state.sessions.filter((s) => s.completed);
  const latest = new Map<string, Reading>();
  for (const r of [...visible.readings].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))) {
    latest.set(r.type, r);
  }
  return {
    generatedAt: new Date(now).toISOString(),
    person: {
      ageBand: ageBand(p.birthYear, now),
      sex: p.sex,
      education: p.education,
      language: p.language,
      digitalFamiliarity: p.digitalFamiliarity.band,
      assisted: p.assistedDefault,
      sessions: done.length,
      firstSession: done[0]?.startedAt,
    },
    decision: ev ? { ...ev.explanation, ruleFired: enteringRule(ev) } : null,
    trajectory: ev?.trajectory ?? [],
    confounders: {
      checked: CONTEXT_CHECKED,
      present: ev?.explanation.confoundersConsidered ?? [],
    },
    informant: visible.informant.map((r) => ({
      at: r.at,
      relationship: r.relationship,
      score: r.score,
      outOf: r.answers.length,
      newDifficulty: r.newDifficulty,
    })),
    risk: RISK_FACTORS.map((f) => ({
      factor: f,
      value: visible.factors[f]?.value ?? "not_asked",
      source: visible.factors[f]?.source ?? "",
    })),
    familyHistory: visible.familyHistory ?? null,
    readings: [...latest.values()].map((r) => ({
      type: r.type,
      text: formatReading(r),
      level: readingLevel(r),
      at: r.measuredAt,
      source: r.source,
      quality: r.quality,
      synthetic: r.isSynthetic,
    })),
    genomics: visible.genomics ? { apoe4: visible.genomics.apoe4, synthetic: true } : null,
    statement: "screening_not_diagnosis",
  };
}
