"use client";

import { useEffect, useState } from "react";
import { evaluate, type EvaluateResponse } from "./engine";
import { informantForEngine } from "./context";
import { useAppState, visibleData } from "./store";

const cache = new Map<string, Promise<EvaluateResponse>>();

type Result = { key: string; data?: EvaluateResponse; error?: boolean };

/** The latest engine decision for the local history, shared across screens and cached per history. */
export function useEvaluation() {
  const state = useAppState();
  const { sessions, referrals } = state;
  const informant = visibleData(state).informant;
  const reviewedAt = referrals
    .map((r) => r.decision?.at)
    .filter((x): x is string => Boolean(x))
    .sort()
    .at(-1);
  const last = sessions.at(-1);
  const key = [sessions.length, last?.id, last?.completed, informant.length, informant.at(-1)?.id, reviewedAt].join(":");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!state.hydrated || sessions.length === 0) return;
    let live = true;
    let pending = cache.get(key);
    if (!pending) {
      pending = evaluate(sessions, informantForEngine(informant), undefined, reviewedAt);
      pending.catch(() => cache.delete(key));
      cache.set(key, pending);
    }
    pending
      .then((data) => live && setResult({ key, data }))
      .catch(() => live && setResult({ key, error: true }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state.hydrated]);

  const current = result?.key === key ? result : null;
  return {
    loading: state.hydrated && sessions.length > 0 && !current,
    error: Boolean(current?.error),
    data: current?.data,
  };
}
