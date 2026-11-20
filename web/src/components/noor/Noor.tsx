"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { wallNow } from "@/lib/clock";
import { READING_UNITS, readingLevel } from "@/lib/context";
import { fmt } from "@/lib/format";
import { acceptRephrase, respond, type NoorAction, type NoorText, type NoorTools } from "@/lib/noor/core";
import { preventionPlan, weeklyStory } from "@/lib/plan";
import { canListen, canSpeak, listenOnce, speak, stopSpeaking } from "@/lib/speech";
import { hasConsent, logNoor, newId, update, useAppState, visibleData, type NoorPersona } from "@/lib/store";
import type { Reading } from "@/lib/types";
import { useEvaluation } from "@/lib/useEvaluation";
import { NoorAvatar, type NoorMood } from "./NoorAvatar";

export type NoorDict = Pick<Dictionary, "noor" | "status" | "urgent" | "devices" | "plan">;

interface Turn {
  id: string;
  role: "user" | "noor";
  text: string;
  actions?: NoorAction[];
  done?: boolean;
}

/** Noor stays out of scored activities, consent and the informant's form, and out of clinician tools. */
const HIDDEN = /\/(session|onboarding|clinic|lab|family\/answer)(\/|$)/;

const DAY = 86_400_000;

export function Noor({ dict, lang }: { dict: NoorDict; lang: Locale }) {
  const t = dict.noor;
  const pathname = usePathname();
  const state = useAppState();
  const { data } = useEvaluation();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState<NoorMood>("idle");
  const [voice, setVoice] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [turns, mood]);

  if (!state.hydrated || !state.profile || HIDDEN.test(pathname)) return null;

  const persona = state.noorPersona;
  const name = t.personas[persona];
  const profile = state.profile;

  const say = (text: string) => {
    if (!voice || !canSpeak()) {
      setMood("idle");
      return;
    }
    setMood("speaking");
    speak(text, lang, () => setMood("idle"));
  };

  const dayName = (iso: string) => new Date(iso).toLocaleDateString(lang, { weekday: "long" });

  const tools: NoorTools = {
    get_state: () =>
      data
        ? {
            state: data.explanation.state,
            ruleFired: data.explanation.ruleFired,
            nextStep: data.explanation.nextStep,
            baselineSessions: data.explanation.baselineSessions,
            baselineNeeded: data.explanation.baselineNeeded,
          }
        : null,
    get_trajectory_summary: () => {
      if (!data) return null;
      const story = weeklyStory(state.sessions, data, wallNow());
      return { ...story, context: story.context.map((c) => ({ ...c, days: [...new Set(c.days.map(dayName))] })) };
    },
    get_template: (key) => {
      if (key === "urgent") return dict.urgent.body;
      const s = key.slice("state.".length) as keyof typeof dict.status.body;
      if (s === "watch_context") {
        const first = data?.explanation.confoundersConsidered[0] as keyof typeof dict.status.context | undefined;
        return fmt(dict.status.body.watch_context, {
          context: first ? dict.status.context[first] : dict.status.contextFallback,
        });
      }
      return dict.status.body[s];
    },
    get_goal: () => {
      const v = visibleData(state);
      const goal = preventionPlan({
        profile,
        sessions: state.sessions,
        factors: v.factors,
        readings: v.readings,
        evaluation: data,
        now: wallNow(),
      })[0];
      if (!goal) return null;
      const g = dict.plan.goals[goal.key];
      return { title: g.title, body: goal.variant === "ramadan" && "ramadan" in g ? g.ramadan : g.body };
    },
    draft_packet: () => ({ href: `/${lang}/packet` }),
    invite_informant: () => ({ href: `/${lang}/family` }),
    schedule_retest: () => {
      const step = data?.explanation.nextStep ?? "";
      const days = step === "retest_in_3_to_7_days" ? 3 : 1;
      const at = new Date(wallNow() + days * DAY);
      at.setHours(10, 0, 0, 0);
      update((s) => ({ ...s, reminder: { at: at.toISOString(), reason: step } }));
      return { date: at.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" }) };
    },
    escalate: () => {
      stopSpeaking();
    },
  };

  const noorText: NoorText = {
    name,
    replies: t.replies,
    links: t.links,
    story: {
      sessions: dict.status.storySessions,
      family: dict.status.storyFamily,
      tasks: dict.status.storyTasks,
      context: dict.status.storyContext,
      contextNames: dict.status.context,
      joiner: lang === "ar" ? " و" : ", ",
    },
    readingTypes: dict.devices.types,
    dayName,
  };

  const addNoor = (text: string, extra: Partial<Turn> = {}, log: Partial<Parameters<typeof logNoor>[0][0]> = {}) => {
    setTurns((ts) => [...ts, { id: newId("n"), role: "noor", text, ...extra }]);
    logNoor([{ at: new Date().toISOString(), role: "noor", text, ...log }]);
    say(text);
  };

  const openPanel = () => {
    setOpen(true);
    if (turns.length === 0) addNoor(fmt(t.replies.intro, { name }), {}, { intent: "intro" });
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    stopSpeaking();
    setTurns((ts) => [...ts, { id: newId("u"), role: "user", text }]);
    logNoor([{ at: new Date().toISOString(), role: "user", text }]);
    setMood("thinking");
    const reply = respond(text, tools, noorText);
    let out = reply.text;
    let rephrased = false;
    if (!reply.locked) {
      const res = await fetch("/api/noor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply.text, lang, persona }),
      }).catch(() => null);
      if (res?.status === 200) {
        const candidate = ((await res.json()) as { text?: string }).text ?? "";
        if (acceptRephrase(reply.text, candidate, Object.values(dict.status.stateNames))) {
          out = candidate;
          rephrased = true;
        }
      }
    }
    addNoor(out, { actions: reply.actions }, { intent: reply.intent, tools: reply.tools, locked: reply.locked, rephrased });
  };

  const markDone = (id: string) => setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, done: true } : x)));

  const confirm = (turn: Turn, action: NoorAction, yes: boolean) => {
    markDone(turn.id);
    if (!yes) return addNoor(t.replies.cancelled, {}, { intent: "cancelled" });
    if (action.kind === "confirm_reading") {
      if (!hasConsent(state.consents, "device")) return addNoor(t.replies.deviceOff, {}, { intent: "log_reading" });
      const r = action.reading;
      const reading: Reading = {
        ...r,
        id: newId("rd"),
        unit: READING_UNITS[r.type],
        measuredAt: new Date().toISOString(),
        source: "app",
        quality: "good",
        note: r.type === "sleep" ? "sleep_estimate" : undefined,
        consentScope: "device",
        isSynthetic: false,
      };
      update((s) => ({ ...s, readings: [...s.readings, reading] }));
      const level = readingLevel(reading);
      return addNoor(level === "high" ? t.replies.readingSavedHigh : t.replies.readingSaved, {}, {
        intent: "log_reading",
        tools: ["log_reading"],
      });
    }
    if (action.kind === "confirm_sleep") {
      update((s) => ({ ...s, draftCheckIn: { ...s.draftCheckIn, ...action.draft } }));
      return addNoor(t.replies.sleepSaved, {}, { intent: "log_checkin", tools: ["log_checkin"] });
    }
  };

  const href = (h: string) => (h.startsWith("/") ? h : `/${lang}/${h}`);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          className="noor-launcher fixed bottom-5 end-5 z-40 flex items-center gap-3 rounded-full border border-line bg-card py-2 ps-2 pe-5 text-lg font-semibold shadow-lg"
        >
          <NoorAvatar persona={persona} mood="idle" size={48} />
          {fmt(t.ask, { name })}
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={name}
          className="noor-launcher fixed inset-0 z-50 flex flex-col border-line bg-card shadow-2xl sm:inset-auto sm:end-5 sm:bottom-5 sm:h-[min(75vh,44rem)] sm:min-h-[32rem] sm:w-[28rem] sm:rounded-3xl sm:border"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
            <NoorAvatar persona={persona} mood={mood} />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xl font-bold">{name}</p>
              <p className="text-sm text-muted">{t.disclaimer}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setOpen(false);
                setMood("idle");
              }}
              className="min-h-12 rounded-xl px-3 text-base font-semibold text-brand"
            >
              {t.close}
            </button>
          </header>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-4 py-2 text-sm">
            <span className="text-muted">{t.personaLabel}</span>
            {(["noor", "rashid"] as NoorPersona[]).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={persona === p}
                onClick={() => update((s) => ({ ...s, noorPersona: p }))}
                className="min-h-9 rounded-full border border-line px-3 aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:font-semibold"
              >
                {t.personas[p]}
              </button>
            ))}
            {canSpeak() && (
              <button
                type="button"
                aria-pressed={voice}
                onClick={() => {
                  if (voice) stopSpeaking();
                  setVoice(!voice);
                }}
                className="ms-auto min-h-9 rounded-full border border-line px-3 aria-pressed:border-brand aria-pressed:bg-brand-soft"
              >
                {voice ? t.voiceOn : t.voiceOff}
              </button>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
            {turns.map((turn) => (
              <div key={turn.id} className={`flex flex-col gap-2 ${turn.role === "user" ? "items-end" : "items-start"}`}>
                <p
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-lg ${
                    turn.role === "user" ? "bg-brand text-white" : "bg-surface"
                  }`}
                >
                  {turn.text}
                </p>
                {turn.actions?.map((a, i) => {
                  if (a.kind === "call")
                    return (
                      <a
                        key={i}
                        href="tel:998"
                        className="inline-flex min-h-14 items-center rounded-2xl bg-urgent px-6 text-xl font-bold text-white"
                      >
                        {dict.urgent.call}
                      </a>
                    );
                  if (a.kind === "link")
                    return (
                      <a
                        key={i}
                        href={href(a.href)}
                        className="inline-flex min-h-12 items-center rounded-xl border-2 border-brand px-4 text-base font-semibold text-brand"
                      >
                        {a.label}
                      </a>
                    );
                  if (turn.done) return null;
                  return (
                    <div key={i} className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirm(turn, a, true)}
                        className="min-h-12 rounded-xl bg-brand px-5 text-base font-semibold text-white"
                      >
                        {t.confirmYes}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirm(turn, a, false)}
                        className="min-h-12 rounded-xl border-2 border-line px-5 text-base font-semibold"
                      >
                        {t.confirmNo}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
            {mood === "thinking" && <p className="text-base text-muted">{t.thinking}</p>}
            <div ref={endRef} />
          </div>

          <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-line px-4 pt-3 pb-1">
            {t.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => send(chip)}
                className="min-h-10 shrink-0 rounded-full border border-line bg-surface px-3 text-sm font-semibold"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            className="flex shrink-0 gap-2 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="noor-input" className="sr-only">
              {t.placeholder}
            </label>
            <input
              id="noor-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-card px-3 text-lg"
            />
            {canListen() && (
              <button
                type="button"
                aria-label={t.speak}
                disabled={mood === "listening"}
                onClick={() => {
                  stopSpeaking();
                  setMood("listening");
                  listenOnce(
                    lang,
                    (heard) => send(heard),
                    () => setMood((m) => (m === "listening" ? "idle" : m)),
                  );
                }}
                className="min-h-12 rounded-2xl border-2 border-brand px-3 text-lg text-brand"
              >
                🎤
              </button>
            )}
            <button type="submit" className="min-h-12 rounded-2xl bg-brand px-4 text-base font-semibold text-white">
              {t.send}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
