"use client";

import { useSyncExternalStore } from "react";
import type {
  Consents,
  ConsentScope,
  InformantReport,
  Profile,
  Reading,
  Referral,
  RiskProfile,
  Session,
} from "./types";

export interface AppState {
  profile: Profile | null;
  consents: Consents | null;
  sessions: Session[];
  risk: RiskProfile | null;
  informant: InformantReport[];
  readings: Reading[];
  referrals: Referral[];
  /** "goalKey@weekStart" for goals the user marked done that week. */
  goalChecks: string[];
}

const KEY = "baseline:v1";
const EMPTY: AppState = {
  profile: null,
  consents: null,
  sessions: [],
  risk: null,
  informant: [],
  readings: [],
  referrals: [],
  goalChecks: [],
};

let cache: AppState | null = null;
const listeners = new Set<() => void>();

function read(): AppState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<AppState>) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: AppState) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function update(fn: (s: AppState) => AppState) {
  write(fn(read()));
}

export function getState(): AppState {
  return read();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppState(): AppState & { hydrated: boolean } {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { ...state, hydrated };
}

export function resetAll() {
  localStorage.removeItem(KEY);
  cache = null;
  listeners.forEach((l) => l());
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function hasConsent(consents: Consents | null, scope: ConsentScope) {
  return Boolean(consents?.[scope]?.granted);
}

export function setConsent(scope: ConsentScope, granted: boolean) {
  update((s) =>
    s.consents ? { ...s, consents: { ...s.consents, [scope]: { granted, at: new Date().toISOString() } } } : s,
  );
}

/** Data the user has withdrawn consent for is hidden everywhere, but kept until they delete it. */
export function visibleData(s: Pick<AppState, "consents" | "informant" | "readings" | "risk">) {
  const imports = hasConsent(s.consents, "records_import");
  const factors = Object.fromEntries(
    Object.entries(s.risk?.factors ?? {}).filter(([, a]) => imports || a.source !== "import"),
  ) as RiskProfile["factors"];
  return {
    informant: hasConsent(s.consents, "informant") ? s.informant : [],
    readings: s.readings.filter((r) => hasConsent(s.consents, r.consentScope)),
    factors,
    familyHistory: s.risk?.familyHistory,
    genomics: hasConsent(s.consents, "genomics") ? s.risk?.genomics : undefined,
  };
}

export const BASELINE_SESSIONS = 14;

export function completedSessions(sessions: Session[]) {
  return sessions.filter((s) => s.completed);
}

export function nextSessionType(sessions: Session[]): Session["type"] {
  return completedSessions(sessions).length < BASELINE_SESSIONS ? "baseline" : "daily";
}
