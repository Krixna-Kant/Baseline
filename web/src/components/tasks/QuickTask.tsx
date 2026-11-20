"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { TARGETS } from "@/lib/content";
import { median, mulberry32, sd, shuffle } from "@/lib/random";
import type { RawEvent, TaskResult } from "@/lib/types";
import { nowMs } from "@/lib/clock";
import { TaskIntro } from "./TaskIntro";

type Stage = "introSimple" | "simple" | "introChoice" | "choice";
type TrialState = "wait" | "stimulus" | "tooSoon";
type Stim = "A" | "B";

const ANTICIPATION_MS = 150;
const LAPSE_MS = 3000;

export function QuickTask({
  dict,
  lang,
  seed,
  practice,
  onDone,
}: {
  dict: Dictionary;
  lang: "ar" | "en";
  seed: number;
  practice: boolean;
  onDone: (result: TaskResult) => void;
}) {
  const t = dict.tasks.quick;
  const nSimple = practice ? 3 : 15;
  const nChoice = practice ? 4 : 20;

  const plan = useMemo(() => {
    const rand = mulberry32(seed);
    const foreperiods = Array.from({ length: nSimple + nChoice }, () => 1000 + Math.round(rand() * 1500));
    const half = Math.floor(nChoice / 2);
    const stims = shuffle<Stim>([...Array(half).fill("A"), ...Array(nChoice - half).fill("B")], rand);
    return { foreperiods, stims };
  }, [seed, nSimple, nChoice]);

  const [stage, setStage] = useState<Stage>("introSimple");
  const [trial, setTrial] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [trialState, setTrialState] = useState<TrialState>("wait");

  const events = useRef<RawEvent[]>([]);
  const t0 = useRef(0);
  const onset = useRef(0);
  const startedAt = useRef("");
  const simpleRts = useRef<(number | null)[]>([]);
  const choice = useRef<{ stim: Stim; resp: Stim | null; rt: number | null }[]>([]);
  const anticipations = useRef(0);

  const running = stage === "simple" || stage === "choice";
  const total = stage === "simple" ? nSimple : nChoice;
  const stim: Stim = stage === "choice" ? plan.stims[trial] : "A";

  const now = () => Math.round(nowMs() - t0.current);

  function finish() {
    const s = simpleRts.current.filter((x): x is number => x !== null);
    const correct = choice.current.filter((c) => c.rt !== null && c.resp === c.stim);
    const cRts = correct.map((c) => c.rt as number);
    const sMean = s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
    const cMean = cRts.length ? cRts.reduce((a, b) => a + b, 0) / cRts.length : null;
    const sSd = sd(s);
    const cSd = sd(cRts);
    const lapses =
      simpleRts.current.filter((x) => x === null).length + choice.current.filter((c) => c.rt === null).length;
    onDone({
      family: "quick",
      formId: `quick-${seed}`,
      practice,
      startedAt: startedAt.current,
      endedAt: new Date().toISOString(),
      events: events.current,
      metrics: {
        simpleMedianRt: median(s),
        choiceMedianRt: median(cRts),
        choiceAccuracy: choice.current.length ? correct.length / choice.current.length : null,
        simpleCv: sMean && sSd !== null ? sSd / sMean : null,
        choiceCv: cMean && cSd !== null ? cSd / cMean : null,
        anticipations: anticipations.current,
        lapses,
      },
      validity: s.length < nSimple / 2 ? ["too_few_valid_trials"] : [],
    });
  }

  function advance() {
    if (trial + 1 < total) {
      setTrial(trial + 1);
      setAttempt(0);
      setTrialState("wait");
      return;
    }
    if (stage === "simple") {
      setStage("introChoice");
      return;
    }
    finish();
  }

  useEffect(() => {
    if (!running || trialState !== "wait") return;
    const fp = plan.foreperiods[(stage === "simple" ? 0 : nSimple) + trial];
    const id = setTimeout(() => {
      onset.current = nowMs();
      events.current.push({ t: now(), type: "onset", data: { stage, trial, stim } });
      setTrialState("stimulus");
    }, fp);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, trialState, trial, attempt, stage]);

  useEffect(() => {
    if (!running || trialState !== "stimulus") return;
    const id = setTimeout(() => {
      events.current.push({ t: now(), type: "lapse", data: { stage, trial } });
      if (stage === "simple") simpleRts.current.push(null);
      else choice.current.push({ stim, resp: null, rt: null });
      advance();
    }, LAPSE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, trialState, trial, stage]);

  useEffect(() => {
    if (trialState !== "tooSoon") return;
    const id = setTimeout(() => {
      setAttempt((a) => a + 1);
      setTrialState("wait");
    }, 900);
    return () => clearTimeout(id);
  }, [trialState]);

  function press(resp: Stim) {
    if (!running) return;
    if (trialState === "wait") {
      anticipations.current += 1;
      events.current.push({ t: now(), type: "anticipation", data: { stage, trial } });
      setTrialState("tooSoon");
      return;
    }
    if (trialState !== "stimulus") return;
    const rt = Math.round(nowMs() - onset.current);
    events.current.push({ t: now(), type: "response", data: { stage, trial, resp, rt } });
    if (rt < ANTICIPATION_MS) anticipations.current += 1;
    if (stage === "simple") simpleRts.current.push(rt < ANTICIPATION_MS ? null : rt);
    else choice.current.push({ stim, resp, rt: rt < ANTICIPATION_MS ? null : rt });
    setTrialState("wait");
    advance();
  }

  function start(next: "simple" | "choice") {
    if (next === "simple") {
      t0.current = nowMs();
      startedAt.current = new Date().toISOString();
    }
    setTrial(0);
    setAttempt(0);
    setTrialState("wait");
    setStage(next);
  }

  const badge = practice ? dict.tasks.practiceBadge : undefined;

  if (stage === "introSimple" || stage === "introChoice") {
    const simple = stage === "introSimple";
    return (
      <TaskIntro
        title={t.name}
        body={simple ? t.introSimple : t.introChoice}
        lang={lang}
        listen={dict.common.listen}
        stop={dict.common.stop}
        practiceBadge={badge}
        startLabel={dict.tasks.start}
        onStart={() => start(simple ? "simple" : "choice")}
      >
        <p aria-hidden className="text-center text-6xl">
          {simple ? TARGETS.quickSimple : `${TARGETS.quickChoiceA}  ${TARGETS.quickChoiceB}`}
        </p>
      </TaskIntro>
    );
  }

  const display =
    trialState === "stimulus" ? (stim === "A" ? TARGETS.quickChoiceA : TARGETS.quickChoiceB) : trialState === "tooSoon" ? "✋" : "";

  return (
    <section className="flex select-none flex-col gap-6">
      <div className="flex items-center justify-between text-muted">
        <span>{t.name}</span>
        <span dir="ltr">
          {trial + 1} / {total}
        </span>
      </div>
      <div className="grid h-64 place-items-center rounded-[var(--radius-card)] border-2 border-line bg-card" aria-live="assertive">
        <span className="text-9xl" aria-label={trialState === "stimulus" ? (stim === "A" ? t.coffee : t.teapot) : undefined}>
          {display}
        </span>
        {trialState === "wait" && <span className="text-xl text-muted">{t.wait}</span>}
        {trialState === "tooSoon" && <span className="text-xl font-semibold text-watch">{t.tooSoon}</span>}
      </div>
      {stage === "simple" ? (
        <button
          type="button"
          onPointerDown={() => press("A")}
          className="min-h-32 rounded-[var(--radius-card)] bg-brand text-3xl font-bold text-white active:bg-brand-strong"
        >
          {t.tap}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(["A", "B"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onPointerDown={() => press(s)}
              className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] bg-brand text-xl font-bold text-white active:bg-brand-strong"
            >
              <span aria-hidden className="text-5xl">
                {s === "A" ? TARGETS.quickChoiceA : TARGETS.quickChoiceB}
              </span>
              {s === "A" ? t.coffee : t.teapot}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
