"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Interval } from "@/lib/engine";
import { fmt } from "@/lib/format";
import { wallNow } from "@/lib/clock";
import { routes, weeklyStory } from "@/lib/plan";
import { useAppState, visibleData } from "@/lib/store";
import { useEvaluation } from "@/lib/useEvaluation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <div role="img" aria-label={label} className="relative h-8 w-full rounded-full bg-line [direction:ltr]">
      <div
        className="absolute inset-y-1 rounded-full bg-brand/40"
        style={{ left: pos(interval.low), right: `calc(100% - ${pos(interval.high)})` }}
      />
      <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: pos(0) }} />
      <div className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" style={{ left: pos(interval.estimate) }} />
    </div>
  );
}

export function StatusCard({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.status;
  const state = useAppState();
  const { loading, error, data } = useEvaluation();
  const ex = data?.explanation;
  if (ex?.state === "building" || !state.profile) return null;

  const visible = visibleData(state);
  const now = wallNow();
  const story = weeklyStory(state.sessions, data, now);
  const next = routes({
    profile: state.profile,
    sessions: state.sessions,
    factors: visible.factors,
    readings: visible.readings,
    evaluation: data,
    now,
  });
  const dayName = (iso: string) => new Date(iso).toLocaleDateString(lang, { weekday: "long" });

  return (
    <>
      <Card className="flex flex-col gap-4" aria-live="polite">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        {loading && <p className="text-lg text-muted">{t.checking}</p>}
        {error && <p className="text-lg">{t.offline}</p>}
        {ex && (
          <>
            <div className="flex items-start">
              <StateChip state={CHIP[ex.state]} label={t.stateNames[ex.state]} />
            </div>
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
              <div className="flex flex-col gap-2">
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

      {ex && ex.state !== "urgent" && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">{t.storyTitle}</h2>
          <p className="text-lg">{fmt(t.storySessions, { n: story.sessions })}</p>
          <ul className="flex list-disc flex-col gap-2 ps-6 text-lg">
            {(["memory", "speed", "executive"] as const).map((f) =>
              story.families[f] === "unknown" ? null : (
                <li key={f}>{fmt(t.storyFamily[story.families[f]], { task: t.storyTasks[f] })}</li>
              ),
            )}
            {story.context.map((c) => (
              <li key={c.factor}>
                {fmt(t.storyContext, {
                  context: t.context[c.factor],
                  days: [...new Set(c.days.map(dayName))].join(lang === "ar" ? " و" : ", "),
                })}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {next.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">{t.routesTitle}</h2>
          <ul className="flex flex-col gap-3">
            {next.map((r) => (
              <li key={r} className="rounded-2xl bg-brand-soft p-4 text-lg">
                {t.routes[r]}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
