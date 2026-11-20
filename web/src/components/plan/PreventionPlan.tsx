"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { wallNow } from "@/lib/clock";
import { preventionPlan, routes } from "@/lib/plan";
import { update, useAppState, visibleData } from "@/lib/store";
import { useEvaluation } from "@/lib/useEvaluation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const THIS_WEEK = 3;

function weekStart(now: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function PreventionPlan({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.plan;
  const state = useAppState();
  const { data } = useEvaluation();
  if (!state.hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!state.profile) return <ButtonLink href={`/${lang}/onboarding`}>{dict.home.start}</ButtonLink>;

  const now = wallNow();
  const visible = visibleData(state);
  const input = {
    profile: state.profile,
    sessions: state.sessions,
    factors: visible.factors,
    readings: visible.readings,
    evaluation: data,
    now,
  };
  const goals = preventionPlan(input);
  const where = routes(input);
  const week = weekStart(now);
  const isDone = (key: string) => state.goalChecks.includes(`${key}@${week}`);
  const toggle = (key: string) =>
    update((s) => {
      const id = `${key}@${week}`;
      return {
        ...s,
        goalChecks: s.goalChecks.includes(id) ? s.goalChecks.filter((x) => x !== id) : [...s.goalChecks, id],
      };
    });

  const section = (title: string, list: typeof goals) =>
    list.length > 0 && (
      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <ul className="flex flex-col gap-4">
          {list.map((g) => {
            const text = t.goals[g.key];
            const done = isDone(g.key);
            return (
              <li key={g.key} className="flex flex-col gap-2 rounded-2xl border border-line p-4">
                <p className="text-lg font-semibold">{text.title}</p>
                <p className="text-lg">{g.variant === "ramadan" && "ramadan" in text ? text.ramadan : text.body}</p>
                {g.because.length > 0 && (
                  <p className="text-base text-muted">
                    {t.because} {g.because.map((b) => t.reasons[b as keyof typeof t.reasons]).join(" · ")}
                  </p>
                )}
                <button
                  type="button"
                  aria-pressed={done}
                  onClick={() => toggle(g.key)}
                  className="min-h-12 self-start rounded-xl border-2 border-line px-4 text-base font-semibold aria-pressed:border-stable aria-pressed:bg-stable-soft aria-pressed:text-stable"
                >
                  {done ? t.doneThisWeek : t.markDone}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    );

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-lg">{t.intro}</p>
      {section(t.thisWeek, goals.slice(0, THIS_WEEK))}
      {section(t.later, goals.slice(THIS_WEEK))}
      {where.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">{dict.status.routesTitle}</h2>
          <ul className="flex flex-col gap-3">
            {where.map((r) => (
              <li key={r} className="rounded-2xl bg-brand-soft p-4 text-lg">
                {dict.status.routes[r]}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <ButtonLink href={`/${lang}/health`} variant="secondary" className="self-start">
        {dict.nav.health.title}
      </ButtonLink>
      <p className="text-base text-muted">{t.evidence}</p>
    </div>
  );
}
