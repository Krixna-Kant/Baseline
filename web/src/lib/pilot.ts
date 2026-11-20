import type { AppState } from "./store";
import type { Session } from "./types";

export const PILOT_WINDOW_DAYS = 7;
const ANCHOR = Date.UTC(2000, 0, 3);
const DAY = 86_400_000;

export interface PilotExport {
  kind: "baseline-pilot-export";
  schemaVersion: 1;
  participant: string;
  windowDays: number;
  bands: { language: string; ageBand: string; sex: string; education: string; familiarity: string };
  sessions: Session[];
}

function ageBand(birthYear: number, now: number) {
  const age = new Date(now).getFullYear() - birthYear;
  if (age < 50) return "<50";
  if (age < 65) return "50-64";
  if (age < 75) return "65-74";
  return "75+";
}

/**
 * Anonymised pilot-week file: bands instead of birth year, a fresh random code instead of the
 * profile id, raw events removed, and every date shifted by whole days so the first session
 * falls on 3 Jan 2000 (time of day and gaps between sessions are kept).
 */
export function buildPilotExport(state: AppState, now: number): PilotExport | null {
  const p = state.profile;
  if (!p || state.sessions.length === 0) return null;
  const first = Math.min(...state.sessions.map((s) => Date.parse(s.startedAt)));
  const shift = Math.floor(first / DAY) * DAY - ANCHOR;
  const move = (iso: string) => new Date(Date.parse(iso) - shift).toISOString();
  return {
    kind: "baseline-pilot-export",
    schemaVersion: 1,
    participant: `P-${crypto.randomUUID().slice(0, 6)}`,
    windowDays: PILOT_WINDOW_DAYS,
    bands: {
      language: p.language,
      ageBand: ageBand(p.birthYear, now),
      sex: p.sex,
      education: p.education,
      familiarity: p.digitalFamiliarity.band,
    },
    sessions: state.sessions.map((s) => ({
      ...s,
      id: `s${state.sessions.indexOf(s) + 1}`,
      startedAt: move(s.startedAt),
      endedAt: s.endedAt ? move(s.endedAt) : undefined,
      tasks: s.tasks.map((t) => ({ ...t, startedAt: move(t.startedAt), endedAt: move(t.endedAt), events: [] })),
    })),
  };
}
