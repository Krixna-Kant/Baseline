"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { wallNow } from "@/lib/clock";
import { fmt } from "@/lib/format";
import { buildPacket } from "@/lib/packet";
import { median } from "@/lib/random";
import { update, useAppState } from "@/lib/store";
import type { Referral, ReviewDecision, ReviewOutcome } from "@/lib/types";
import { useEvaluation } from "@/lib/useEvaluation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/Controls";
import { StateChip, type MonitoringState } from "@/components/ui/StateChip";
import { PacketView } from "@/components/packet/PacketView";

const URGENCY: Record<string, number> = { urgent: 0, review: 1, watch: 2, watch_context: 3, stable: 4 };
const CHIP: Record<string, MonitoringState> = {
  stable: "stable",
  watch_context: "watch",
  watch: "watch",
  review: "review",
  urgent: "urgent",
};
const ONWARD = ["neurology", "geriatrics", "memory_clinic", "audiology", "mental_health", "primary_care"] as const;
const OUTCOMES: ReviewOutcome[] = ["no_impairment", "mci", "dementia", "reversible_cause", "mood_or_sleep", "sensory", "pending"];

const HOUR = 3_600_000;

function waited(from: string, to: number) {
  return (to - Date.parse(from)) / HOUR;
}

function patch(id: string, fn: (r: Referral) => Referral) {
  update((s) => ({ ...s, referrals: s.referrals.map((r) => (r.id === id ? fn(r) : r)) }));
}

export function ClinicConsole({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.clinic;
  const state = useAppState();
  const { data } = useEvaluation();
  const [selected, setSelected] = useState<string | null>(null);
  const [kind, setKind] = useState<ReviewDecision | null>(null);
  const [reason, setReason] = useState("");
  const [onward, setOnward] = useState<(typeof ONWARD)[number] | null>(null);
  const [outcome, setOutcome] = useState<ReviewOutcome | null>(null);
  const [detail, setDetail] = useState("");

  if (!state.hydrated) return <p className="text-muted">{dict.common.loading}</p>;

  const now = wallNow();
  const hours = (h: number) => (h < 48 ? fmt(t.hours, { n: Math.round(h) }) : fmt(t.days, { n: Math.round(h / 24) }));
  const open = state.referrals
    .filter((r) => !r.outcome)
    .sort((a, b) => (URGENCY[a.state] ?? 9) - (URGENCY[b.state] ?? 9) || a.sharedAt.localeCompare(b.sharedAt));
  const closed = state.referrals.filter((r) => r.outcome);
  const decided = state.referrals.filter((r) => r.decision);
  const flagToReview = median(decided.map((r) => waited(r.sharedAt, Date.parse(r.decision!.at))));
  const overrides = decided.filter((r) => r.decision!.kind === "override").length;
  const current = state.referrals.find((r) => r.id === selected) ?? null;
  const packet = current ? buildPacket(state, data, now) : null;

  const openCase = (r: Referral) => {
    setSelected(r.id);
    setKind(null);
    setReason("");
    setOnward(null);
    setOutcome(null);
    setDetail("");
    if (!r.openedAt) patch(r.id, (x) => ({ ...x, openedAt: new Date().toISOString() }));
  };

  const decide = () => {
    if (!current || !kind) return;
    patch(current.id, (x) => ({
      ...x,
      decision: {
        kind,
        reason: reason.trim() || undefined,
        referredTo: kind === "refer_onward" ? (onward ?? undefined) : undefined,
        at: new Date().toISOString(),
      },
    }));
  };

  const close = () => {
    if (!current || !outcome) return;
    patch(current.id, (x) => ({
      ...x,
      outcome: { kind: outcome, detail: detail.trim() || undefined, at: new Date().toISOString() },
    }));
    setSelected(null);
  };

  const exportLabels = () => {
    const labels = state.referrals
      .filter((r) => r.outcome)
      .map((r) => ({
        sharedAt: r.sharedAt,
        state: r.state,
        rule: r.ruleFired,
        thresholdVersion: r.thresholdVersion,
        decision: r.decision?.kind,
        override: r.decision?.kind === "override",
        hoursToReview: r.decision ? waited(r.sharedAt, Date.parse(r.decision.at)) : null,
        outcome: r.outcome!.kind,
      }));
    const blob = new Blob([JSON.stringify({ kind: "baseline-outcome-labels", labels }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "baseline-outcome-labels.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const decisionValid = kind !== null && (kind !== "override" || reason.trim().length > 0) && (kind !== "refer_onward" || onward);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="rounded-2xl bg-simulated-soft p-4 text-base text-simulated">{t.demoNote}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t.metricOpen, String(open.length)],
          [t.metricTime, flagToReview === null ? "—" : hours(flagToReview)],
          [t.metricOverrides, decided.length ? `${overrides}/${decided.length}` : "—"],
          [t.metricOutcomes, String(closed.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t.queue}</h2>
        {open.length === 0 && <p className="text-lg text-muted">{t.empty}</p>}
        <ul className="flex flex-col gap-2">
          {open.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={selected === r.id}
                onClick={() => openCase(r)}
                className="flex w-full flex-wrap items-center gap-3 rounded-xl border-2 border-line p-4 text-start aria-pressed:border-brand"
              >
                <StateChip state={CHIP[r.state] ?? "watch"} label={dict.status.stateNames[r.state as keyof typeof dict.status.stateNames] ?? r.state} />
                <span className="font-mono text-sm">{r.ruleFired}</span>
                <span className="text-base">{t.routeShort[r.route as keyof typeof t.routeShort] ?? r.route}</span>
                <span className="ms-auto text-base text-muted">
                  {r.decision ? t.decided : fmt(t.waiting, { time: hours(waited(r.sharedAt, now)) })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {current && packet && (
        <Card className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{t.caseTitle}</h2>
            <span className="text-base text-muted">
              {fmt(t.sharedOn, { date: new Date(current.sharedAt).toLocaleString(lang) })} ·{" "}
              {fmt(t.snapshot, { state: current.state, rule: current.ruleFired, v: current.thresholdVersion })}
            </span>
          </div>

          <PacketView packet={packet} dict={dict} lang={lang} audience="clinician" />

          <div className="flex flex-col gap-4 border-t border-line pt-4">
            <h3 className="text-xl font-bold">{t.decisionTitle}</h3>
            {current.decision ? (
              <p className="rounded-2xl bg-stable-soft p-4 text-lg">
                {t.decisions[current.decision.kind]}
                {current.decision.referredTo && ` → ${t.onward[current.decision.referredTo as keyof typeof t.onward]}`}
                {current.decision.reason && ` · ${current.decision.reason}`} ·{" "}
                {new Date(current.decision.at).toLocaleString(lang)}
              </p>
            ) : (
              <>
                <ChoiceGroup
                  label={t.decisionPrompt}
                  columns={3}
                  value={kind}
                  onChange={setKind}
                  options={(["accept", "override", "refer_onward"] as const).map((k) => ({ value: k, label: t.decisions[k] }))}
                />
                <p className="text-base text-muted">{t.decisionHelp[kind ?? "accept"]}</p>
                {kind === "refer_onward" && (
                  <ChoiceGroup
                    label={t.onwardPrompt}
                    columns={2}
                    value={onward}
                    onChange={setOnward}
                    options={ONWARD.map((o) => ({ value: o, label: t.onward[o] }))}
                  />
                )}
                <label className="flex flex-col gap-2 text-lg font-semibold">
                  {kind === "override" ? t.reasonRequired : t.note}
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="rounded-2xl border-2 border-line bg-card p-3 text-base font-normal"
                  />
                </label>
                <Button onClick={decide} disabled={!decisionValid} className="self-start">
                  {t.saveDecision}
                </Button>
              </>
            )}
          </div>

          {current.decision && (
            <div className="flex flex-col gap-4 border-t border-line pt-4">
              <h3 className="text-xl font-bold">{t.outcomeTitle}</h3>
              <ChoiceGroup
                label={t.outcomePrompt}
                columns={2}
                value={outcome}
                onChange={setOutcome}
                options={OUTCOMES.map((o) => ({ value: o, label: t.outcomes[o] }))}
              />
              <label className="flex flex-col gap-2 text-lg font-semibold">
                {t.outcomeDetail}
                <input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="min-h-12 rounded-2xl border-2 border-line bg-card px-3 text-base font-normal"
                />
              </label>
              <Button onClick={close} disabled={!outcome} className="self-start">
                {t.saveOutcome}
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t.closed}</h2>
        {closed.length === 0 && <p className="text-lg text-muted">{t.noneClosed}</p>}
        <ul className="flex flex-col gap-2">
          {closed.map((r) => (
            <li key={r.id} className="rounded-xl border border-line p-3 text-base">
              {new Date(r.sharedAt).toLocaleDateString(lang)} · {r.state} · {r.decision && t.decisions[r.decision.kind]} →{" "}
              <strong>{t.outcomes[r.outcome!.kind]}</strong>
              {r.outcome!.detail && ` (${r.outcome!.detail})`}
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={exportLabels} disabled={closed.length === 0} className="self-start">
          {t.exportLabels}
        </Button>
        <p className="text-base text-muted">{t.labelsNote}</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <details>
          <summary className="cursor-pointer text-2xl font-bold">
            {fmt(t.auditTitle, { n: state.noorLog.length })}
          </summary>
          <p className="pt-2 text-base text-muted">{t.auditNote}</p>
          <ol className="flex flex-col gap-2 pt-3 text-base">
            {state.noorLog
              .slice(-100)
              .reverse()
              .map((e, i) => (
                <li key={i} className="rounded-xl border border-line p-3">
                  <p className="text-sm text-muted" dir="ltr">
                    {new Date(e.at).toLocaleString(lang)} · {e.role}
                    {e.intent && ` · ${e.intent}`}
                    {e.tools?.length ? ` · tools: ${e.tools.join(", ")}` : ""}
                    {e.locked && " · template-locked"}
                    {e.rephrased && " · LLM-rephrased"}
                  </p>
                  <p>{e.text}</p>
                </li>
              ))}
          </ol>
        </details>
      </Card>
    </div>
  );
}
