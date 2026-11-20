import type { Session } from "./types";

export type EngineState = "building" | "stable" | "watch_context" | "watch" | "review" | "urgent";

export interface Interval {
  estimate: number;
  low: number;
  high: number;
  z: number;
}

export interface Driver {
  kind: "family" | "context" | "informant";
  key: string;
  value: number | null;
}

export interface Explanation {
  state: EngineState;
  previousState: EngineState | null;
  ruleFired: string;
  drivers: Driver[];
  confoundersConsidered: string[];
  composite: Interval | null;
  families: Record<string, Interval>;
  baselineSessions: number;
  baselineNeeded: number;
  daysSinceLastSession: number | null;
  gap: boolean;
  nextStep: string;
  thresholdVersion: string;
  engineVersion: string;
  decidedAt: string;
}

export interface TrajectoryPoint {
  sessionId: string;
  at: string;
  state: EngineState;
  rule: string;
  compositeZ: number | null;
  compositeLevel: number | null;
  compositeSe: number | null;
  familyZ: Record<string, number | null>;
  scores: Record<string, number | null>;
}

export interface EvaluateResponse {
  explanation: Explanation;
  trajectory: TrajectoryPoint[];
}

export interface InformantInput {
  at: string;
  newDifficulty: boolean;
  score?: number | null;
}

const HOLD_RULES = new Set(["review_hold", "hysteresis_hold", "retest_in_progress"]);

/** The rule that moved the person into their current state; hold rules only say the state continued. */
export function enteringRule(ev: EvaluateResponse): string {
  const { state, ruleFired } = ev.explanation;
  if (!HOLD_RULES.has(ruleFired)) return ruleFired;
  for (let i = ev.trajectory.length - 1; i >= 0; i--) {
    const p = ev.trajectory[i];
    if (p.state !== state) break;
    if (!HOLD_RULES.has(p.rule)) return p.rule;
  }
  return ruleFired;
}

/** The engine is stateless: send the full local history, get the current decision back. */
export async function evaluate(
  sessions: Session[],
  informant: InformantInput[] = [],
  signal?: AbortSignal,
  reviewedAt?: string,
): Promise<EvaluateResponse> {
  const res = await fetch("/api/engine/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Raw events stay on the device; the engine only needs the derived metrics.
    body: JSON.stringify({
      sessions: sessions.map((s) => ({ ...s, tasks: s.tasks.map((t) => ({ ...t, events: [] })) })),
      informant,
      reviewedAt,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`engine ${res.status}`);
  return res.json();
}
