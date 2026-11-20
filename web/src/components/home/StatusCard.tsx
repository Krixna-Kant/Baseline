"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Session } from "@/lib/types";
import { evaluate, type EvaluateResponse } from "@/lib/engine";
import { fmt } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { StateChip, type MonitoringState } from "@/components/ui/StateChip";

const CHIP: Record<string, MonitoringState> = {
  stable: "stable",
  watch_context: "watch",
  watch: "watch",
  review: "review",
  urgent: "urgent",
};

type Result = { key: string; data?: EvaluateResponse; error?: boolean };

export function StatusCard({ dict, sessions }: { dict: Dictionary; sessions: Session[] }) {
  const t = dict.status;
  const key = `${sessions.length}:${sessions.at(-1)?.id ?? ""}:${sessions.at(-1)?.completed ?? ""}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    evaluate(sessions, [], ctrl.signal)
      .then((data) => setResult({ key, data }))
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ key, error: true });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = result?.key === key ? result : null;
  const ex = current?.data?.explanation;
  if (ex?.state === "building") return null;

  return (
    <Card className="flex flex-col gap-4" aria-live="polite">
      <h2 className="text-2xl font-bold">{t.title}</h2>
      {!current && <p className="text-lg text-muted">{t.checking}</p>}
      {current?.error && <p className="text-lg">{t.offline}</p>}
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
