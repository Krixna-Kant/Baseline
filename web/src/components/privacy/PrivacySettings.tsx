"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hasConsent, resetAll, setConsent, useAppState } from "@/lib/store";
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
