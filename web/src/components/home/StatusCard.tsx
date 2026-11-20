"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Interval } from "@/lib/engine";
import { fmt } from "@/lib/format";
import { wallNow } from "@/lib/clock";
import { routes, weeklyStory, type FamilyTrend } from "@/lib/plan";
import { useAppState, visibleData } from "@/lib/store";
import { useEvaluation } from "@/lib/useEvaluation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StateChip, type MonitoringState } from "@/components/ui/StateChip";

const CHIP: Record<string, MonitoringState> = {
  stable: "stable",
  watch_context: "watch",
  watch: "watch",
  review: "review",
  urgent: "urgent",
};

const AXIS = { lo: -3, hi: 2 };

function RangeBar({ interval, label }: { interval: Interval; label: string }) {
  const pos = (v: number) => `${((Math.min(Math.max(v, AXIS.lo), AXIS.hi) - AXIS.lo) / (AXIS.hi - AXIS.lo)) * 100}%`;
  return (
    <div role="img" aria-label={label} className="relative h-9 w-full rounded-full bg-surface ring-1 ring-line [direction:ltr]">
      <div
        className="absolute inset-y-1.5 rounded-full bg-mint"
        style={{ left: pos(interval.low), right: `calc(100% - ${pos(interval.high)})` }}
      />
      <div className="absolute inset-y-1 w-0.5 rounded bg-ink/60" style={{ left: pos(0) }} />
      <div
        className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-brand shadow"
        style={{ left: pos(interval.estimate) }}
      />
    </div>
  );
}

function usePlanInput() {
  const state = useAppState();
  const { data } = useEvaluation();
  if (!state.profile) return null;
  const visible = visibleData(state);
  const now = wallNow();
  return {
    data,
    now,
    input: { profile: state.profile, sessions: state.sessions, factors: visible.factors, readings: visible.readings, evaluation: data, now },
  };
}

export function StatusCard({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.status;
  const { profile } = useAppState();
  const { loading, error, data } = useEvaluation();
  const ex = data?.explanation;
  if (ex?.state === "building" || !profile) return null;

  return (
    <Card className="flex flex-col gap-5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        {ex && <StateChip state={CHIP[ex.state]} label={t.stateNames[ex.state]} />}
      </div>
      {loading && <p className="text-lg text-muted">{t.checking}</p>}
      {error && <p className="text-lg">{t.offline}</p>}
      {ex && (
        <>
          <p className="text-lg">
            {ex.state === "watch_context"
              ? fmt(t.body.watch_context, {
                  context: ex.confoundersConsidered.length
                    ? t.context[ex.confoundersConsidered[0] as keyof typeof t.context]
                    : t.contextFallback,
                })
              : t.body[ex.state]}
          </p>
          {ex.gap && <p className="rounded-2xl bg-watch-soft p-4 text-lg">{t.gap}</p>}
          {ex.composite && ex.state !== "urgent" && (
            <div className="flex flex-col gap-2 rounded-2xl bg-brand-soft/60 p-4">
              <p className="text-base font-semibold">{t.rangeLabel}</p>
              <RangeBar interval={ex.composite} label={t.rangeLabel} />
              <div className="relative h-5 text-sm text-muted [direction:ltr]">
                <span className="absolute left-0">{t.rangeLower}</span>
                <span className="absolute left-[60%] -translate-x-1/2">{t.rangeUsual}</span>
              </div>
              <p className="text-base text-muted">{t.rangeExplain}</p>
            </div>
          )}
          {(ex.state === "review" || ex.state === "watch") && (
            <ButtonLink href={`/${lang}/packet`} variant={ex.state === "review" ? "primary" : "secondary"}>
              {t.seePacket}
            </ButtonLink>
          )}
          <details className="text-base text-muted">
            <summary className="cursor-pointer py-2">{t.details}</summary>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pt-2" dir="ltr">
              <dt>{t.rule}</dt>
              <dd className="font-mono">{ex.ruleFired}</dd>
              {ex.composite && (
                <>
                  <dt>{t.composite}</dt>
                  <dd className="font-mono">
                    {ex.composite.estimate.toFixed(2)} [{ex.composite.low.toFixed(2)}, {ex.composite.high.toFixed(2)}] · z{" "}
                    {ex.composite.z.toFixed(2)}
                  </dd>
                </>
              )}
            </dl>
            <p className="pt-2">{fmt(t.version, { v: ex.thresholdVersion })}</p>
          </details>
        </>
      )}
    </Card>
  );
}

const FAMILY_ICON: Record<"memory" | "speed" | "executive", IconName> = { memory: "sparkle", speed: "clock", executive: "grid" };

const TREND_STYLE: Record<FamilyTrend, string> = {
  steady: "bg-stable-soft text-stable",
  higher: "bg-stable-soft text-stable",
  lower: "bg-watch-soft text-watch",
  unknown: "bg-surface text-muted",
};

export function WeekCards({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.status;
  const plan = usePlanInput();
  const ex = plan?.data?.explanation;
  if (!plan || !ex || ex.state === "urgent" || ex.state === "building") return null;
  const story = weeklyStory(plan.input.sessions, plan.data, plan.now);
  const dayName = (iso: string) => new Date(iso).toLocaleDateString(lang, { weekday: "long" });

  return (
    <section aria-labelledby="week-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="week-title" className="text-2xl font-bold">
          {t.storyTitle}
        </h2>
        <p className="text-base text-muted">{fmt(t.storySessions, { n: story.sessions })}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {(["memory", "speed", "executive"] as const).map((f) => (
          <li key={f} className="card-shadow flex flex-col gap-3 rounded-[var(--radius-card)] border border-line/80 bg-card p-5">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon name={FAMILY_ICON[f]} />
            </span>
            <p className="text-lg font-semibold leading-snug">{t.storyTasks[f]}</p>
            <span className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${TREND_STYLE[story.families[f]]}`}>
              {dict.dashboard.trend[story.families[f]]}
            </span>
          </li>
        ))}
      </ul>
      {story.context.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-2xl bg-card/60 px-4 py-3 text-base text-muted">
          {story.context.map((c) => (
            <li key={c.factor}>
              {fmt(t.storyContext, {
                context: t.context[c.factor],
                days: [...new Set(c.days.map(dayName))].join(lang === "ar" ? " و" : ", "),
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RoutesCard({ dict }: { dict: Dictionary }) {
  const t = dict.status;
  const plan = usePlanInput();
  if (!plan) return null;
  const next = routes(plan.input);
  if (next.length === 0) return null;
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">{t.routesTitle}</h2>
      <ul className="flex flex-col gap-3">
        {next.map((r) => (
          <li
            key={r}
            className={`flex items-start gap-3 rounded-2xl p-4 text-lg ${r === "emergency" ? "bg-urgent-soft text-urgent" : "bg-brand-soft"}`}
          >
            <Icon name={r === "emergency" ? "heart" : "arrow"} className="mt-1 size-5 text-brand" />
            {t.routes[r]}
          </li>
        ))}
      </ul>
    </Card>
  );
}
