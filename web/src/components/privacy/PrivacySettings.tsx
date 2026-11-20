"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { buildPilotExport } from "@/lib/pilot";
import { getState, hasConsent, resetAll, setConsent, useAppState } from "@/lib/store";
import type { ConsentScope } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const SCOPES: ConsentScope[] = [
  "core",
  "informant",
  "device",
  "records_import",
  "genomics",
  "share_clinician",
  "research_use",
];

function PilotExportCard({ dict }: { dict: Dictionary }) {
  const t = dict.privacy;
  const state = useAppState();
  const allowed = hasConsent(state.consents, "research_use");
  const download = () => {
    const data = buildPilotExport(getState(), Date.now());
    if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `baseline-pilot-${data.participant}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-lg font-semibold">{t.pilotTitle}</p>
      <p className="text-base text-muted">{t.pilotBody}</p>
      {!allowed ? (
        <p className="text-base font-semibold">{t.pilotNeedsConsent}</p>
      ) : state.sessions.length === 0 ? (
        <p className="text-base font-semibold">{t.pilotEmpty}</p>
      ) : (
        <Button variant="secondary" className="self-start" onClick={download}>
          {t.pilotDownload}
        </Button>
      )}
    </Card>
  );
}

export function PrivacySettings({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.privacy;
  const { hydrated, profile, consents } = useAppState();
  if (!hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!profile) return <ButtonLink href={`/${lang}/onboarding`}>{dict.home.start}</ButtonLink>;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-lg">{t.intro}</p>
      <Card className="flex flex-col divide-y divide-line p-0">
        {SCOPES.map((scope) => {
          const s = dict.onboarding.scopes[scope];
          const on = hasConsent(consents, scope);
          const required = scope === "core";
          return (
            <div key={scope} className="flex items-center justify-between gap-4 p-5">
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold">{s.title}</p>
                <p className="text-base text-muted">{s.body}</p>
              </div>
              {required ? (
                <span className="shrink-0 text-base font-semibold text-muted">{dict.onboarding.consentRequired}</span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={s.title}
                  onClick={() => setConsent(scope, !on)}
                  className={`min-h-12 shrink-0 rounded-full border-2 px-5 text-base font-semibold ${
                    on ? "border-brand bg-brand text-white" : "border-line bg-card text-muted"
                  }`}
                >
                  {on ? t.on : t.off}
                </button>
              )}
            </div>
          );
        })}
      </Card>
      <p className="text-base text-muted">{t.kept}</p>
      <PilotExportCard dict={dict} />
      <Button
        variant="quiet"
        className="self-center text-base text-urgent"
        onClick={() => {
          if (window.confirm(dict.dashboard.resetConfirm)) resetAll();
        }}
      >
        {dict.dashboard.resetDemo}
      </Button>
    </div>
  );
}
