"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { wallNow } from "@/lib/clock";
import { fmt } from "@/lib/format";
import { openNoor } from "@/lib/noorBridge";
import { preventionPlan } from "@/lib/plan";
import { BASELINE_SESSIONS, completedSessions, resetAll, useAppState, visibleData } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { NoorAvatar } from "@/components/noor/NoorAvatar";
import { RoutesCard, StatusCard, WeekCards } from "./StatusCard";

function ProgressRing({ done, total, center }: { done: number; total: number; center: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const frac = Math.min(done / total, 1);
  return (
    <div className="relative grid size-36 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-brand-soft)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${frac * c} ${c}`}
        />
      </svg>
      <span className="text-center text-xl font-bold text-brand">{center}</span>
    </div>
  );
}

function greetingKey(hour: number): keyof Dictionary["dashboard"]["greetings"] {
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}

export function HomeGate({ dict, lang, welcome }: { dict: Dictionary; lang: Locale; welcome: ReactNode }) {
  const state = useAppState();
  const { hydrated, profile, sessions, reminder, noorPersona } = state;
  if (!hydrated) return <p className="pt-6 text-muted">{dict.common.loading}</p>;
  if (!profile) return <>{welcome}</>;

  const t = dict.dashboard;
  const now = wallNow();
  const done = completedSessions(sessions);
  const inBaseline = done.length < BASELINE_SESSIONS;
  const last = done.at(-1);
  const today = new Date(now).toDateString();
  const doneToday = done.some((s) => new Date(s.startedAt).toDateString() === today);
  const noorName = dict.noor.personas[noorPersona];

  const visible = visibleData(state);
  const goal = preventionPlan({
    profile,
    sessions,
    factors: visible.factors,
    readings: visible.readings,
    now,
  })[0];
  const goalText = goal ? (dict.plan.goals[goal.key] as { title: string; body: string; ramadan?: string }) : null;

  return (
    <div className="flex flex-col gap-8 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold sm:text-4xl">{t.greetings[greetingKey(new Date(now).getHours())]}</h1>
        <p className="text-lg text-muted">{t.greetingSub}</p>
      </header>

      {reminder && (!last || last.startedAt < reminder.at) && (
        <p className="flex items-center gap-3 rounded-2xl bg-watch-soft p-4 text-lg">
          <Icon name="clock" className="size-6 text-watch" />
          {fmt(t.reminder, {
            date: new Date(reminder.at).toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" }),
          })}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {!inBaseline && <StatusCard dict={dict} lang={lang} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="card-shadow flex flex-col justify-between gap-6 rounded-[var(--radius-card)] bg-night p-6 text-white">
              <div className="flex flex-col gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-night-soft text-mint">
                  <Icon name="play" className="size-7" />
                </span>
                <h2 className="text-2xl font-bold">
                  {inBaseline ? t.baselineTitle : doneToday ? t.todayDone : t.todayReady}
                </h2>
                <p className="text-lg text-white/80">
                  {inBaseline ? fmt(t.baselineBody, { done: done.length, total: BASELINE_SESSIONS }) : t.todayBody}
                </p>
              </div>
              <ButtonLink href={`/${lang}/session`} variant="light">
                {inBaseline ? t.startBaseline : doneToday ? t.todayAgain : t.startDaily}
                <Icon name="arrow" className="size-5" />
              </ButtonLink>
            </section>

            {goal && goalText && (
              <Link
                href={`/${lang}/plan`}
                className="card-shadow group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-brand text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/home-morning.jpg"
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-strong via-brand-strong/70 to-transparent" />
                <div className="relative flex flex-col gap-1 p-6">
                  <span className="self-start rounded-full bg-mint px-3 py-1 text-sm font-semibold text-brand-strong">
                    {t.stepTitle}
                  </span>
                  <p className="text-xl font-bold">{goalText.title}</p>
                  <p className="text-base text-white/90">
                    {goal.variant === "ramadan" && goalText.ramadan ? goalText.ramadan : goalText.body}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-2 font-semibold">
                    {t.stepCta}
                    <Icon name="arrow" className="size-5" />
                  </span>
                </div>
              </Link>
            )}
          </div>

          {!inBaseline && <WeekCards dict={dict} lang={lang} />}
          {!inBaseline && <RoutesCard dict={dict} />}
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="flex flex-col items-center gap-3 text-center">
            <h2 className="self-start text-xl font-bold">{t.progressTitle}</h2>
            <ProgressRing
              done={done.length}
              total={BASELINE_SESSIONS}
              center={inBaseline ? fmt(t.progressSessions, { done: done.length, total: BASELINE_SESSIONS }) : t.progressSet}
            />
            <p className="text-base text-muted">
              {fmt(t.sessionsDone, { n: done.length })}
              {last && (
                <>
                  <br />
                  {fmt(t.lastSession, { date: new Date(last.startedAt).toLocaleDateString(lang) })}
                </>
              )}
            </p>
          </Card>

          <Card className="flex flex-col gap-4 bg-brand-soft/70">
            <div className="flex items-center gap-3">
              <NoorAvatar persona={noorPersona} mood="idle" size={52} />
              <div>
                <p className="text-sm font-semibold text-brand">{t.companionTitle}</p>
                <h2 className="text-xl font-bold">{noorName}</h2>
              </div>
            </div>
            <p className="text-base text-muted">{t.companionBody}</p>
            <Button variant="primary" onClick={openNoor}>
              <Icon name="mic" className="size-5" />
              {fmt(t.companionCta, { name: noorName })}
            </Button>
          </Card>

          <Card className="flex flex-col gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon name="users" />
            </span>
            <h2 className="text-xl font-bold">{t.familyTitle}</h2>
            <p className="text-base text-muted">{t.familyBody}</p>
            <ButtonLink href={`/${lang}/family`} variant="secondary">
              {t.familyCta}
            </ButtonLink>
          </Card>
        </aside>
      </div>

      <nav aria-label={t.moreTitle} className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t.moreTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MORE.map(({ key, icon }) => (
            <li key={key}>
              <Link
                href={`/${lang}/${key}`}
                className="card-shadow flex h-full items-start gap-3 rounded-2xl border border-line/80 bg-card p-4 hover:border-brand"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={icon} className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold text-ink">{dict.nav[key].title}</span>
                  <span className="text-sm text-muted">{dict.nav[key].body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col items-center gap-3">
        <p className="w-full rounded-2xl bg-brand-soft p-4 text-base">{dict.common.screeningNotice}</p>
        <Button
          variant="quiet"
          className="text-base text-urgent"
          onClick={() => {
            if (window.confirm(t.resetConfirm)) resetAll();
          }}
        >
          {t.resetDemo}
        </Button>
      </div>
    </div>
  );
}

const MORE: { key: "health" | "packet" | "privacy" | "demo" | "clinic" | "lab" | "plan" | "devices"; icon: IconName }[] = [
  { key: "health", icon: "heart" },
  { key: "packet", icon: "doc" },
  { key: "privacy", icon: "shield" },
  { key: "demo", icon: "clock" },
  { key: "clinic", icon: "clinic" },
  { key: "lab", icon: "chart" },
];
