"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { BASELINE_SESSIONS, completedSessions, newId, nextSessionType, update, useAppState } from "@/lib/store";
import { buildForms } from "@/lib/forms";
import { fmt } from "@/lib/format";
import { newSeed } from "@/lib/random";
import { SCHEMA_VERSION, type CheckIn, type Session, type TaskFamily, type TaskResult } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CheckInForm } from "./CheckInForm";
import { UrgentScreen } from "./UrgentScreen";
import { ShoppingTask } from "@/components/tasks/ShoppingTask";
import { QuickTask } from "@/components/tasks/QuickTask";
import { MedicationTask } from "@/components/tasks/MedicationTask";

type Step =
  | "checkin"
  | "urgent"
  | "shoppingPractice"
  | "shoppingImmediate"
  | "quickPractice"
  | "quick"
  | "medicationPractice"
  | "medication"
  | "shoppingDelayed"
  | "done";

function deviceType(): Session["deviceType"] {
  const w = window.innerWidth;
  return w < 640 ? "phone" : w < 1024 ? "tablet" : "desktop";
}

export function SessionRunner({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const { hydrated, profile, sessions } = useAppState();
  if (!hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!profile) {
    return (
      <ButtonLink href={`/${lang}/onboarding`} className="w-full">
        {dict.home.start}
      </ButtonLink>
    );
  }
  return <Runner dict={dict} lang={lang} sessions={sessions} assisted={profile.assistedDefault} />;
}

function Runner({
  dict,
  lang,
  sessions,
  assisted,
}: {
  dict: Dictionary;
  lang: Locale;
  sessions: Session[];
  assisted: boolean;
}) {
  const router = useRouter();
  const [seed] = useState(newSeed);
  const forms = useMemo(() => buildForms(seed), [seed]);

  // Fixed at mount: saving this session adds its practice runs to history, which must not reshape the plan mid-session.
  const [steps] = useState<Step[]>(() => {
    const practiced = new Set<TaskFamily>(sessions.flatMap((s) => s.tasks.filter((t) => t.practice).map((t) => t.family)));
    const out: Step[] = ["checkin"];
    if (!practiced.has("shopping")) out.push("shoppingPractice");
    out.push("shoppingImmediate");
    if (!practiced.has("quick")) out.push("quickPractice");
    out.push("quick");
    if (!practiced.has("medication")) out.push("medicationPractice");
    out.push("medication", "shoppingDelayed", "done");
    return out;
  });

  const [index, setIndex] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const [meta] = useState(() => ({
    id: newId("session"),
    type: nextSessionType(sessions),
    startedAt: new Date().toISOString(),
    deviceType: deviceType(),
    priorCompleted: completedSessions(sessions).length,
  }));
  const tasks = useRef<TaskResult[]>([]);
  const checkIn = useRef<CheckIn | undefined>(undefined);
  const saved = useRef(false);

  const step: Step = urgent ? "urgent" : steps[index];

  function save(completed: boolean) {
    const record: Session = {
      id: meta.id,
      type: meta.type,
      startedAt: meta.startedAt,
      endedAt: new Date().toISOString(),
      completed,
      deviceType: meta.deviceType,
      inputMode: "tap",
      assisted,
      checkIn: checkIn.current,
      tasks: [...tasks.current],
      source: "app",
      isSynthetic: false,
      schemaVersion: SCHEMA_VERSION,
    };
    update((st) => ({
      ...st,
      sessions: saved.current ? st.sessions.map((x) => (x.id === meta.id ? record : x)) : [...st.sessions, record],
    }));
    saved.current = true;
  }

  function next() {
    const ni = index + 1;
    setIndex(ni);
    if (steps[ni] === "done") save(true);
  }

  function onCheckIn(c: CheckIn) {
    checkIn.current = c;
    if (c.redFlag) {
      save(false);
      setUrgent(true);
      return;
    }
    next();
  }

  function onTask(result: TaskResult) {
    tasks.current.push(result);
    next();
  }

  const doneCount = meta.priorCompleted;
  const isBaseline = meta.type === "baseline";
  const label = isBaseline ? dict.session.baselineLabel : meta.type === "retest" ? dict.session.retestLabel : dict.session.dailyLabel;

  const common = { dict, lang } as const;

  return (
    <div className="flex flex-col gap-6">
      {step !== "done" && step !== "urgent" && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-semibold text-muted">{label}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="h-full rounded-full bg-brand" style={{ width: `${(index / (steps.length - 1)) * 100}%` }} />
            </div>
          </div>
          <Button
            variant="quiet"
            onClick={() => {
              if (index > 0) save(false);
              router.push(`/${lang}`);
            }}
          >
            {dict.session.quit}
          </Button>
        </div>
      )}

      {step === "urgent" && (
        <UrgentScreen
          dict={dict}
          onBack={() => {
            checkIn.current = undefined;
            setUrgent(false);
          }}
        />
      )}
      {step === "checkin" && <CheckInForm dict={dict} onDone={onCheckIn} />}
      {step === "shoppingPractice" && (
        <ShoppingTask key={step} {...common} form={forms.shoppingPractice} phase="immediate" practice onDone={onTask} />
      )}
      {step === "shoppingImmediate" && (
        <ShoppingTask key={step} {...common} form={forms.shopping} phase="immediate" practice={false} onDone={onTask} />
      )}
      {step === "quickPractice" && <QuickTask key={step} {...common} seed={seed + 11} practice onDone={onTask} />}
      {step === "quick" && <QuickTask key={step} {...common} seed={seed + 13} practice={false} onDone={onTask} />}
      {step === "medicationPractice" && (
        <MedicationTask key={step} {...common} form={forms.medicationPractice} practice onDone={onTask} />
      )}
      {step === "medication" && (
        <MedicationTask key={step} {...common} form={forms.medication} practice={false} onDone={onTask} />
      )}
      {step === "shoppingDelayed" && (
        <ShoppingTask
          key={step}
          {...common}
          form={{ ...forms.shopping, foils: forms.shopping.delayedFoils }}
          phase="delayed"
          practice={false}
          onDone={onTask}
        />
      )}
      {step === "done" && (
        <section className="flex flex-col gap-5">
          <h1 className="text-3xl font-bold">{dict.session.doneTitle}</h1>
          <p className="text-xl">
            {isBaseline
              ? doneCount + 1 >= BASELINE_SESSIONS
                ? dict.session.doneBodyBaselineComplete
                : fmt(dict.session.doneBodyBaseline, { left: BASELINE_SESSIONS - doneCount - 1 })
              : dict.session.doneBodyDaily}
          </p>
          <ButtonLink href={`/${lang}`}>{dict.common.home}</ButtonLink>
        </section>
      )}
    </div>
  );
}
