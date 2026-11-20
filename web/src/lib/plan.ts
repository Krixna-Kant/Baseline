import type { EvaluateResponse } from "./engine";
import { contextFlags, type ContextFlags } from "./context";
import type { CheckIn, Profile, Reading, RiskProfile, Session } from "./types";

const DAY = 86_400_000;

export type GoalKey =
  | "activity"
  | "bp"
  | "glucose"
  | "diet"
  | "sleep"
  | "hearing"
  | "vision"
  | "social"
  | "mind"
  | "smoking"
  | "mood";

export interface Goal {
  key: GoalKey;
  /** Template variant, for example Ramadan-aware wording. */
  variant: "default" | "ramadan";
  because: string[];
}

export type RouteKey = "emergency" | "primary_care_packet" | "primary_care_bp_glucose" | "mental_health" | "audiology" | "optometry";

export interface PlanInput {
  profile: Profile;
  sessions: Session[];
  factors: RiskProfile["factors"];
  readings: Reading[];
  evaluation?: EvaluateResponse;
  now: number;
}

function recentCheckIns(sessions: Session[], now: number, days = 7): CheckIn[] {
  return sessions
    .filter((s) => s.checkIn && now - Date.parse(s.startedAt) <= days * DAY)
    .map((s) => s.checkIn as CheckIn);
}

function signals({ profile, sessions, factors, readings, now }: PlanInput) {
  const checks = recentCheckIns(sessions, now);
  const count = (fn: (c: CheckIn) => boolean) => checks.filter(fn).length;
  const yes = (f: keyof RiskProfile["factors"]) => factors[f]?.value === "yes";
  const flags: ContextFlags = contextFlags(readings, now);
  return {
    flags,
    yes,
    fasting: count((c) => c.fasting) >= 2,
    poorSleep: count((c) => c.sleepHours < 5 || c.sleepQuality <= 2) >= 3,
    lowMood: count((c) => c.mood <= 2) >= 3,
    lonely: count((c) => c.loneliness >= 4) >= 3,
    stressed: count((c) => c.stress >= 4) >= 3,
    hearing: yes("hearing_loss") || !profile.sensory.hearingOk || count((c) => !c.hearingOk) >= 2,
    vision: yes("vision_loss") || !profile.sensory.visionOk || count((c) => !c.visionOk) >= 2,
  };
}

/** FINGER/POINTER-style multidomain goals. Never depends on genomics. */
export function preventionPlan(input: PlanInput): Goal[] {
  const s = signals(input);
  const variant = s.fasting ? "ramadan" : "default";
  const goals: Goal[] = [];
  const add = (key: GoalKey, because: (string | false)[], v: Goal["variant"] = "default") => {
    const reasons = because.filter((b): b is string => Boolean(b));
    goals.push({ key, variant: v, because: reasons });
  };

  if (s.flags.bpUncontrolled || s.yes("hypertension"))
    add("bp", [s.flags.bpUncontrolled && "bp_readings", s.yes("hypertension") && "hypertension"]);
  if (s.flags.glucoseHigh || s.yes("diabetes"))
    add("glucose", [s.flags.glucoseHigh && "glucose_readings", s.yes("diabetes") && "diabetes"]);
  if (s.hearing) add("hearing", ["hearing"]);
  if (s.vision) add("vision", ["vision"]);
  if (s.lowMood || s.yes("depression")) add("mood", ["mood"]);
  if (s.yes("smoking")) add("smoking", ["smoking"]);
  add("activity", [s.yes("inactivity") && "inactivity", s.flags.lowActivity && "steps"], variant);
  if (s.poorSleep || s.flags.shortSleep) add("sleep", [s.poorSleep && "sleep_checkins", s.flags.shortSleep && "sleep_device"]);
  if (s.lonely || s.yes("social_isolation")) add("social", ["social"]);
  if (["hypertension", "diabetes", "obesity", "high_ldl"].some((f) => s.yes(f as keyof RiskProfile["factors"])))
    add("diet", ["metabolic"], variant);
  add("mind", []);
  return goals;
}

export function routes(input: PlanInput): RouteKey[] {
  const s = signals(input);
  const state = input.evaluation?.explanation.state;
  const out: RouteKey[] = [];
  if (state === "urgent") return ["emergency"];
  if (state === "review") out.push("primary_care_packet");
  if (s.flags.bpUncontrolled || s.flags.glucoseHigh) out.push("primary_care_bp_glucose");
  if (s.lowMood || s.lonely || s.stressed) out.push("mental_health");
  if (s.hearing) out.push("audiology");
  if (s.vision) out.push("optometry");
  return out;
}

export type FamilyTrend = "steady" | "lower" | "higher" | "unknown";

export interface WeeklyStory {
  sessions: number;
  families: Record<"memory" | "speed" | "executive", FamilyTrend>;
  context: { factor: "poor_sleep" | "ill" | "fasting" | "high_stress"; days: string[] }[];
}

export function weeklyStory(sessions: Session[], ev: EvaluateResponse | undefined, now: number): WeeklyStory {
  const since = now - 7 * DAY;
  const week = sessions.filter((s) => s.completed && Date.parse(s.startedAt) >= since);
  const points = (ev?.trajectory ?? []).filter((p) => Date.parse(p.at) >= since);
  const trend = (fam: string): FamilyTrend => {
    const zs = points.map((p) => p.familyZ[fam]).filter((z): z is number => z !== null && z !== undefined);
    if (!zs.length) return "unknown";
    const m = zs.reduce((a, b) => a + b, 0) / zs.length;
    return m < -1 ? "lower" : m > 1 ? "higher" : "steady";
  };
  const days = (fn: (c: CheckIn) => boolean) =>
    [...new Set(week.filter((s) => s.checkIn && fn(s.checkIn)).map((s) => s.startedAt))];
  const context = (
    [
      ["poor_sleep", (c: CheckIn) => c.sleepHours < 5 || c.sleepQuality <= 2],
      ["ill", (c: CheckIn) => c.ill],
      ["high_stress", (c: CheckIn) => c.stress >= 4],
      ["fasting", (c: CheckIn) => c.fasting],
    ] as const
  )
    .map(([factor, fn]) => ({ factor, days: days(fn) }))
    .filter((c) => c.days.length > 0);
  return {
    sessions: week.length,
    families: { memory: trend("memory"), speed: trend("speed"), executive: trend("executive") },
    context,
  };
}
