import type { InformantReport, Reading, ReadingType, RiskFactor, RiskProfile } from "./types";
import type { InformantInput } from "./engine";
import { mulberry32 } from "./random.ts";

const DAY = 86_400_000;

export const READING_UNITS: Record<ReadingType, string> = {
  bp: "mmHg",
  glucose: "mg/dL",
  hba1c: "%",
  sleep: "h",
  steps: "steps",
  weight: "kg",
};

export const INFORMANT_ITEMS = 8;
export const INFORMANT_CUTOFF = 2;

export function informantReport(
  answers: (0 | 1 | null)[],
  meta: Pick<InformantReport, "id" | "at" | "relationship" | "language" | "source" | "isSynthetic">,
): InformantReport {
  const score = answers.reduce<number>((a, b) => a + (b ?? 0), 0);
  return { ...meta, answers, score, newDifficulty: score >= INFORMANT_CUTOFF };
}

export function informantForEngine(reports: InformantReport[]): InformantInput[] {
  return reports.map((r) => ({ at: r.at, newDifficulty: r.newDifficulty, score: r.score }));
}

export type ReadingLevel = "ok" | "high" | "low" | "info";

export function readingLevel(r: Reading): ReadingLevel {
  const v = r.values;
  switch (r.type) {
    case "bp":
      if (v.systolic >= 140 || v.diastolic >= 90) return "high";
      if (v.systolic < 90) return "low";
      return "ok";
    case "glucose":
      if (v.value < 70) return "low";
      if (r.context === "fasting" ? v.value >= 126 : v.value >= 200) return "high";
      return "ok";
    case "hba1c":
      return v.value >= 6.5 ? "high" : "ok";
    default:
      return "info";
  }
}

export function formatReading(r: Reading) {
  const v = r.values;
  if (r.type === "bp") return `${v.systolic}/${v.diastolic} ${r.unit}`;
  if (r.type === "steps") return `${Math.round(v.value).toLocaleString("en")} ${r.unit}`;
  return `${v.value} ${r.unit}`;
}

export interface ContextFlags {
  bpUncontrolled: boolean;
  glucoseHigh: boolean;
  shortSleep: boolean;
  lowActivity: boolean;
}

/** Device and record signals for advice and routing only; they never enter the cognitive state. */
export function contextFlags(readings: Reading[], now: number): ContextFlags {
  const within = (days: number) =>
    readings.filter((r) => r.quality !== "poor" && now - Date.parse(r.measuredAt) <= days * DAY);
  const recent30 = within(30);
  const recent90 = within(90);
  const sleep = recent30.filter((r) => r.type === "sleep").map((r) => r.values.value);
  const steps = recent30.filter((r) => r.type === "steps").map((r) => r.values.value);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    bpUncontrolled: recent30.filter((r) => r.type === "bp" && readingLevel(r) === "high").length >= 2,
    glucoseHigh: recent90.some((r) => (r.type === "glucose" || r.type === "hba1c") && readingLevel(r) === "high"),
    shortSleep: sleep.length >= 3 && mean(sleep) < 6,
    lowActivity: steps.length >= 3 && mean(steps) < 5000,
  };
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(text: string) {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/٫/g, ".");
}

export type ParsedReading = Pick<Reading, "type" | "values" | "context">;

/** "My pressure was 132 over 84", "sugar 110 fasting", "ضغطي ١٣٢ على ٨٤" → a reading to confirm. */
export function parseSpokenReading(input: string): ParsedReading | null {
  const text = normalizeDigits(input.toLowerCase());
  const bp = text.match(/(\d{2,3})\s*(?:\/|over|on|على|علي)\s*(\d{2,3})/);
  if (bp) {
    const [s, d] = [Number(bp[1]), Number(bp[2])];
    if (s > d && s >= 70 && s <= 260 && d >= 40 && d <= 160) {
      return { type: "bp", values: { systolic: s, diastolic: d }, context: "resting" };
    }
  }
  const num = text.match(/(\d+(?:\.\d+)?)/);
  if (!num) return null;
  const value = Number(num[1]);
  if (/a1c|hba1c|تراكمي/.test(text) && value > 3 && value < 20) return { type: "hba1c", values: { value } };
  if (/sugar|glucose|سكر|جلوكوز/.test(text) && value >= 30 && value <= 600) {
    const fasting = /fasting|before (?:breakfast|food)|صائم|صيام|على الريق/.test(text);
    return { type: "glucose", values: { value }, context: fasting ? "fasting" : "unknown" };
  }
  if (/sleep|slept|hours|نوم|نمت|ساعات/.test(text) && value > 0 && value <= 16) {
    return { type: "sleep", values: { value } };
  }
  if (/step|walk|خطوة|خطوات|مشي/.test(text) && value >= 0) return { type: "steps", values: { value } };
  if (/weigh|kg|kilo|وزن|كيلو/.test(text) && value > 25 && value < 300) return { type: "weight", values: { value } };
  return null;
}

export type SimDevice = "bp_cuff" | "glucometer" | "watch";

export const SIM_MODELS: Record<SimDevice, string> = {
  bp_cuff: "Simulated BP cuff",
  glucometer: "Simulated glucometer",
  watch: "Simulated wearable",
};

/** A plausible week of readings for a person with mildly raised blood pressure and glucose. */
export function simulateWeek(device: SimDevice, seed: number, now: number, newId: (p: string) => string): Reading[] {
  const rand = mulberry32(seed);
  const noise = (sd: number) => (rand() + rand() + rand() - 1.5) * sd * 1.4;
  const out: Reading[] = [];
  for (let d = 6; d >= 0; d--) {
    const morning = new Date(now - d * DAY);
    morning.setHours(7, Math.floor(rand() * 50), 0, 0);
    const base = {
      measuredAt: morning.toISOString(),
      source: "device" as const,
      deviceModel: SIM_MODELS[device],
      consentScope: "device" as const,
      isSynthetic: true,
    };
    if (device === "bp_cuff") {
      const afterExercise = rand() < 0.12;
      out.push({
        ...base,
        id: newId("rd"),
        type: "bp",
        unit: READING_UNITS.bp,
        values: {
          systolic: Math.round(138 + noise(7) + (afterExercise ? 12 : 0)),
          diastolic: Math.round(86 + noise(5) + (afterExercise ? 5 : 0)),
        },
        context: afterExercise ? "after_exercise" : "resting",
        quality: afterExercise ? "uncertain" : "good",
      });
    } else if (device === "glucometer") {
      out.push({
        ...base,
        id: newId("rd"),
        type: "glucose",
        unit: READING_UNITS.glucose,
        values: { value: Math.round(118 + noise(10)) },
        context: "fasting",
        quality: "good",
      });
    } else {
      out.push(
        {
          ...base,
          id: newId("rd"),
          type: "sleep",
          unit: READING_UNITS.sleep,
          values: { value: Math.round((6.1 + noise(0.8)) * 10) / 10 },
          quality: "uncertain",
          note: "sleep_estimate",
        },
        {
          ...base,
          id: newId("rd"),
          type: "steps",
          unit: READING_UNITS.steps,
          values: { value: Math.max(500, Math.round(4800 + noise(1500))) },
          quality: "good",
        },
      );
    }
  }
  return out;
}

/** Synthetic stand-in for a Weqaya screening summary. Nothing here comes from a real record. */
export function sampleRecordBundle(now: number, newId: (p: string) => string) {
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();
  const base = {
    source: "import" as const,
    deviceModel: "Weqaya screening summary (synthetic)",
    consentScope: "records_import" as const,
    isSynthetic: true,
    quality: "good" as const,
  };
  const readings: Reading[] = [
    { ...base, id: newId("rd"), type: "bp", unit: "mmHg", values: { systolic: 148, diastolic: 92 }, measuredAt: at(62), context: "resting" },
    { ...base, id: newId("rd"), type: "hba1c", unit: "%", values: { value: 7.1 }, measuredAt: at(62) },
    { ...base, id: newId("rd"), type: "weight", unit: "kg", values: { value: 91 }, measuredAt: at(62) },
  ];
  const factors: Partial<Record<RiskFactor, RiskProfile["factors"][RiskFactor]>> = {
    hypertension: { value: "yes", source: "import", at: at(62) },
    diabetes: { value: "yes", source: "import", at: at(62) },
    high_ldl: { value: "yes", source: "import", at: at(62) },
    obesity: { value: "yes", source: "import", at: at(62) },
  };
  return { readings, factors, summary: { source: "Weqaya", date: at(62) } };
}
