"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { wallNow } from "@/lib/clock";
import { informantForEngine } from "@/lib/context";
import { DEMO_STAGES, khalid, STAGE_DAY, type DemoStage } from "@/lib/demo";
import { enteringRule, evaluate } from "@/lib/engine";
import { fmt } from "@/lib/format";
import { routes } from "@/lib/plan";
import { resetAll, update } from "@/lib/store";
import type { Referral } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const OPENS: Record<DemoStage, string> = {
  baseline: "",
  sleep: "",
  ramadan: "/plan",
  watch: "/family",
  review: "/packet",
  shared: "/clinic",
};

async function sharedReferral(data: ReturnType<typeof khalid>, now: number): Promise<Referral> {
  const ev = await evaluate(data.sessions, informantForEngine(data.informant));
  const route =
    routes({
      profile: data.profile,
      sessions: data.sessions,
      factors: data.risk.factors,
      readings: data.readings,
      evaluation: ev,
      now,
    })[0] ?? "primary_care_packet";
  return {
    id: "khalid-ref",
    sharedAt: new Date(now - 3_600_000).toISOString(),
    state: ev.explanation.state,
    ruleFired: enteringRule(ev),
    thresholdVersion: ev.explanation.thresholdVersion,
    route,
  };
}

export function DemoStory({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.demo;
  const router = useRouter();
  const [busy, setBusy] = useState<DemoStage | null>(null);
  const [error, setError] = useState(false);

  const load = async (stage: DemoStage) => {
    setBusy(stage);
    setError(false);
    const now = wallNow();
    const data = khalid(stage, now);
    let referrals: Referral[] = [];
    if (stage === "shared") {
      try {
        referrals = [await sharedReferral(data, now)];
      } catch {
        setError(true);
        setBusy(null);
        return;
      }
    }
    update((s) => ({
      ...s,
      ...data,
      referrals,
      goalChecks: [],
      noorLog: [],
      draftCheckIn: null,
      reminder: null,
    }));
    router.push(`/${lang}${OPENS[stage]}`);
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-lg">{t.intro}</p>
      <p className="rounded-2xl bg-watch-soft p-4 text-base">{t.synthetic}</p>
      {error && (
        <p role="alert" className="rounded-2xl bg-urgent-soft p-4 text-base">
          {t.engineDown}
        </p>
      )}
      <ol className="flex flex-col gap-4">
        {DEMO_STAGES.map((stage, i) => {
          const s = t.stages[stage];
          return (
            <li key={stage}>
              <Card className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-muted">
                  {i + 1} · {fmt(t.day, { n: STAGE_DAY[stage] })}
                </p>
                <h2 className="text-2xl font-bold">{s.title}</h2>
                <p className="text-lg">{s.body}</p>
                <Button onClick={() => load(stage)} disabled={busy !== null}>
                  {busy === stage ? t.loading : `${t.load} ${lang === "ar" ? "←" : "→"} ${s.next}`}
                </Button>
              </Card>
            </li>
          );
        })}
      </ol>
      <Button
        variant="quiet"
        className="self-center text-base text-urgent"
        onClick={() => {
          resetAll();
          router.push(`/${lang}`);
        }}
      >
        {t.reset}
      </Button>
    </div>
  );
}
