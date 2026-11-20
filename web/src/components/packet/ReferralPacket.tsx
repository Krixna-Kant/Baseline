"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { wallNow } from "@/lib/clock";
import { buildPacket } from "@/lib/packet";
import { routes } from "@/lib/plan";
import { hasConsent, newId, setConsent, update, useAppState, visibleData } from "@/lib/store";
import { useEvaluation } from "@/lib/useEvaluation";
import { fmt } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PacketView } from "./PacketView";

export function ReferralPacket({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.packet;
  const state = useAppState();
  const { data, loading, error } = useEvaluation();
  if (!state.hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!state.profile) return <ButtonLink href={`/${lang}/onboarding`}>{dict.home.start}</ButtonLink>;

  const now = wallNow();
  const packet = buildPacket(state, data, now);
  if (!packet) return null;
  const canShare = hasConsent(state.consents, "share_clinician");
  const open = state.referrals.find((r) => !r.outcome);
  const visible = visibleData(state);
  const route =
    routes({
      profile: state.profile,
      sessions: state.sessions,
      factors: visible.factors,
      readings: visible.readings,
      evaluation: data,
      now,
    })[0] ?? "primary_care_packet";

  const share = () => {
    if (!data) return;
    update((s) => ({
      ...s,
      referrals: [
        ...s.referrals,
        {
          id: newId("ref"),
          sharedAt: new Date().toISOString(),
          state: data.explanation.state,
          ruleFired: data.explanation.ruleFired,
          thresholdVersion: data.explanation.thresholdVersion,
          route,
        },
      ],
    }));
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `baseline-summary-${packet.generatedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-lg print:hidden">{t.intro}</p>
      {loading && <p className="text-lg text-muted">{dict.status.checking}</p>}
      {error && <p className="text-lg">{dict.status.offline}</p>}

      <Card className="print:border-0 print:p-0 print:shadow-none">
        <PacketView packet={packet} dict={dict} lang={lang} audience="person" />
      </Card>

      <Card className="flex flex-col gap-4 print:hidden">
        <h2 className="text-2xl font-bold">{t.shareTitle}</h2>
        {open ? (
          <p className="rounded-2xl bg-stable-soft p-4 text-lg">
            {fmt(t.shared, { date: new Date(open.sharedAt).toLocaleDateString(lang) })}
            {open.decision && ` ${t.reviewed}`}
          </p>
        ) : canShare ? (
          <>
            <p className="text-lg">{t.shareBody}</p>
            <Button onClick={share} disabled={!data} className="self-start">
              {t.share}
            </Button>
          </>
        ) : (
          <>
            <p className="text-lg">{t.shareOff}</p>
            <Button variant="secondary" className="self-start" onClick={() => setConsent("share_clinician", true)}>
              {t.allowShare}
            </Button>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => window.print()}>
            {t.print}
          </Button>
          <Button variant="secondary" onClick={download}>
            {t.download}
          </Button>
        </div>
      </Card>
    </div>
  );
}
