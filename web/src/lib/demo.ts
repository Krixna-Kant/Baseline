import { informantReport, READING_UNITS } from "./context.ts";
import { mulberry32 } from "./random.ts";
import { SCHEMA_VERSION } from "./types.ts";
import type { CheckIn, Consents, InformantReport, Profile, Reading, RiskProfile, Session, TaskResult } from "./types";

/**
 * Khalid, the scripted demo user. Everything is synthetic and generated from a fixed seed, so the
 * story is identical on every device and needs no network beyond the local engine. The engine
 * still makes every state decision; this file only writes the history it sees.
 */

const DAY = 86_400_000;
const SEED = 1962;

export const DEMO_STAGES = ["baseline", "sleep", "ramadan", "watch", "review", "shared"] as const;
export type DemoStage = (typeof DEMO_STAGES)[number];

/** Story day each stage stops at; that day becomes "today" when the stage is loaded. */
export const STAGE_DAY: Record<DemoStage, number> = {
  baseline: 30,
  sleep: 46,
  ramadan: 106,
  watch: 145,
  review: 152,
  shared: 152,
};

const SLEEP_DIP = { from: 37, to: 46 };
const RAMADAN = { from: 76, to: 105 };
const CHANGE_ONSET = 114;
export const MARIAM_DAY = 146;

/** True change in personal SD units on a story day (ramp after onset, then holds). */
function trueChange(day: number) {
  if (day < CHANGE_ONSET) return 0;
  return -Math.min(1.2, ((day - CHANGE_ONSET) / 36) * 1.2);
}

function contextFor(day: number) {
  const sleepDip = day >= SLEEP_DIP.from && day <= SLEEP_DIP.to;
  const fasting = day >= RAMADAN.from && day <= RAMADAN.to;
  return { sleepDip, fasting };
}

/** Session days: baseline every other day, then about three a week, plus a retest burst after onset. */
function sessionDays(): number[] {
  const days: number[] = [];
  for (let d = 0; d < 28; d += 2) days.push(d);
  for (let d = 30; d <= STAGE_DAY.review; d += d % 7 === 2 ? 3 : 2) days.push(d);
  return days;
}

const FAMILY_SD = { memory: 0.11, speed: 0.08, executive: 0.11 };

function checkIn(day: number, rand: () => number): CheckIn {
  const { sleepDip, fasting } = contextFor(day);
  return {
    sleepHours: sleepDip ? 4 : 7 + Math.round(rand()),
    sleepQuality: sleepDip ? 2 : 4,
    mood: 4,
    stress: 2,
    ill: false,
    hearingOk: true,
    visionOk: true,
    loneliness: 1,
    fasting,
    newMedication: false,
    caffeine: !fasting,
    redFlag: false,
  };
}

function session(index: number, day: number, at: string, rand: () => number): Session {
  const noise = () => (rand() + rand() + rand() - 1.5) * 1.4;
  const { sleepDip, fasting } = contextFor(day);
  const practice = 0.5 * (1 - Math.exp(-index / 3));
  const context = (sleepDip ? -2.2 : 0) + (fasting ? -0.25 : 0);
  const shift = practice + context + trueChange(day);

  const memory = 0.72 + FAMILY_SD.memory * (shift + noise());
  const speed = -Math.log(0.56) + FAMILY_SD.speed * (shift + noise());
  const simple = Math.round(1000 * Math.exp(-speed) * 0.9);
  const choice = Math.round(simple * 1.25);
  const accuracy = Math.min(1, 0.78 + FAMILY_SD.executive * (shift + noise()));
  const formId = `khalid-${index}`;
  const task = (family: TaskResult["family"], metrics: TaskResult["metrics"], phase?: TaskResult["phase"]): TaskResult => ({
    family,
    ...(phase ? { phase } : {}),
    formId: `${family}-${formId}`,
    practice: false,
    startedAt: at,
    endedAt: at,
    events: [],
    metrics,
    validity: [],
  });

  return {
    id: `khalid-s${index}`,
    type: index < 14 ? "baseline" : "daily",
    startedAt: at,
    endedAt: at,
    completed: true,
    deviceType: "phone",
    inputMode: "tap",
    assisted: false,
    checkIn: checkIn(day, rand),
    tasks: [
      task("shopping", { discrimination: memory }, "immediate"),
      task("quick", { simpleMedianRt: simple, choiceMedianRt: choice }),
      task("medication", { cellAccuracy: accuracy, timeMs: 30_000 }),
      task("shopping", { discrimination: memory }, "delayed"),
    ],
    source: "simulation",
    isSynthetic: true,
    schemaVersion: SCHEMA_VERSION,
  };
}

export interface DemoState {
  profile: Profile;
  consents: Consents;
  sessions: Session[];
  risk: RiskProfile;
  informant: InformantReport[];
  readings: Reading[];
}

/** Khalid's history up to a stage, with the stage's story day placed at `now`. */
export function khalid(stage: DemoStage, now: number): DemoState {
  const cutoff = STAGE_DAY[stage];
  const start = now - cutoff * DAY - 3 * 3_600_000;
  const at = (day: number, hour = 9) => new Date(start + day * DAY + (hour - 9) * 3_600_000).toISOString();
  const rand = mulberry32(SEED);

  const sessions = sessionDays()
    .map((day, i) => ({ day, s: session(i, day, at(day, contextFor(day).fasting ? 21 : 9), rand) }))
    .filter(({ day }) => day <= cutoff)
    .map(({ s }) => s);

  const granted = { granted: true, at: at(0) };
  const consents: Consents = {
    core: granted,
    informant: granted,
    device: granted,
    records_import: granted,
    genomics: { granted: false, at: at(0) },
    share_clinician: granted,
    research_use: { granted: false, at: at(0) },
  };

  const profile: Profile = {
    id: "khalid-demo",
    createdAt: at(0),
    language: "ar",
    birthYear: 1962,
    sex: "male",
    education: "secondary",
    digitalFamiliarity: { answers: [1, 1, 0], score: 2, band: "low" },
    sensory: { hearingOk: true, visionOk: true, textScale: 1.15 },
    assistedDefault: false,
    isSynthetic: true,
  };

  const imported = { source: "import" as const, at: at(1) };
  const own = { source: "app" as const, at: at(1) };
  const risk: RiskProfile = {
    factors: {
      hypertension: { value: "yes", ...imported },
      diabetes: { value: "yes", ...imported },
      high_ldl: { value: "yes", ...imported },
      obesity: { value: "no", ...imported },
      hearing_loss: { value: "unknown", ...own },
      inactivity: { value: "yes", ...own },
      smoking: { value: "no", ...own },
      social_isolation: { value: "no", ...own },
      depression: { value: "no", ...own },
    },
    familyHistory: { value: "yes", relation: "parent", onsetBefore65: "no" },
    updatedAt: at(1),
  };

  const informant =
    cutoff >= MARIAM_DAY
      ? [
          informantReport([1, 0, 1, 0, 1, 0, 0, 1], {
            id: "khalid-mariam",
            at: at(MARIAM_DAY, 19),
            relationship: "child",
            language: "ar",
            source: "informant",
            isSynthetic: true,
          }),
        ]
      : [];

  const readings: Reading[] = [];
  const bpRand = mulberry32(SEED + 1);
  for (let day = 2; day <= cutoff; day += 7) {
    const sys = Math.round(142 + bpRand() * 10);
    const dia = Math.round(88 + bpRand() * 6);
    readings.push({
      id: `khalid-bp${day}`,
      type: "bp",
      values: { systolic: sys, diastolic: dia },
      unit: READING_UNITS.bp,
      measuredAt: at(day, 7),
      source: "device",
      deviceModel: "Simulated BP cuff",
      context: "resting",
      quality: "good",
      consentScope: "device",
      isSynthetic: true,
    });
  }
  for (let day = Math.max(0, cutoff - 13); day <= cutoff; day++) {
    const { sleepDip } = contextFor(day);
    readings.push({
      id: `khalid-sl${day}`,
      type: "sleep",
      values: { value: sleepDip ? 4.2 : 7 + Math.round(bpRand() * 10) / 10 },
      unit: READING_UNITS.sleep,
      measuredAt: at(day, 7),
      source: "device",
      deviceModel: "Simulated sleep ring",
      quality: "good",
      consentScope: "device",
      isSynthetic: true,
    });
  }
  readings.push({
    id: "khalid-hba1c",
    type: "hba1c",
    values: { value: 7.2 },
    unit: READING_UNITS.hba1c,
    measuredAt: at(1),
    source: "import",
    deviceModel: "Weqaya screening summary (synthetic)",
    quality: "good",
    consentScope: "records_import",
    isSynthetic: true,
  });

  return { profile, consents, sessions, risk, informant, readings };
}
