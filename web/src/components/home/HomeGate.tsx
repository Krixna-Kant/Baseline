"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { BASELINE_SESSIONS, completedSessions, resetAll, useAppState } from "@/lib/store";
import { fmt } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusCard } from "./StatusCard";

export function HomeGate({ dict, lang, welcome }: { dict: Dictionary; lang: Locale; welcome: ReactNode }) {
  const { hydrated, profile, sessions } = useAppState();
  if (!hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!profile) return <>{welcome}</>;

  const t = dict.dashboard;
  const done = completedSessions(sessions);
  const inBaseline = done.length < BASELINE_SESSIONS;
  const last = done.at(-1);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.greeting}</h1>

      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{inBaseline ? t.baselineTitle : t.baselineDone}</h2>
        {inBaseline && (
          <>
            <p className="text-lg">{fmt(t.baselineBody, { done: done.length, total: BASELINE_SESSIONS })}</p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="h-full rounded-full bg-brand" style={{ width: `${(done.length / BASELINE_SESSIONS) * 100}%` }} />
            </div>
          </>
        )}
        <ButtonLink href={`/${lang}/session`}>{inBaseline ? t.startBaseline : t.startDaily}</ButtonLink>
        <p className="text-muted">
          {fmt(t.sessionsDone, { n: done.length })}
          {last && ` · ${fmt(t.lastSession, { date: new Date(last.startedAt).toLocaleDateString(lang) })}`}
        </p>
      </Card>

      {!inBaseline && <StatusCard dict={dict} sessions={sessions} />}

      <p className="rounded-2xl bg-brand-soft p-4">{dict.common.screeningNotice}</p>

      <Button
        variant="quiet"
        className="self-center text-base text-urgent"
        onClick={() => {
          if (window.confirm(t.resetConfirm)) resetAll();
        }}
      >
        {t.resetDemo}
      </Button>
    </div>
  );
}
