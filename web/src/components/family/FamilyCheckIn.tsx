"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hasConsent, useAppState } from "@/lib/store";
import { fmt } from "@/lib/format";
import { INFORMANT_ITEMS } from "@/lib/context";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";

export function FamilyCheckIn({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.family;
  const { hydrated, profile, consents, informant } = useAppState();
  const [copied, setCopied] = useState(false);

  if (!hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!profile) return <ButtonLink href={`/${lang}/onboarding`}>{dict.home.start}</ButtonLink>;

  const on = hasConsent(consents, "informant");
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/${lang}/family/answer`;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-lg">{t.intro}</p>

      {!on ? (
        <Card>
          <p className="text-lg">{t.off}</p>
          <ButtonLink href={`/${lang}/privacy`} variant="secondary" className="mt-4">
            {dict.nav.privacy.title}
          </ButtonLink>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{t.inviteTitle}</h2>
            <p className="text-lg">{t.inviteBody}</p>
            <p className="break-all rounded-xl bg-surface p-3 font-mono text-base" dir="ltr">
              {link}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard?.writeText(link);
                  setCopied(true);
                }}
              >
                {copied ? t.copied : t.copy}
              </Button>
              <ButtonLink href={`/${lang}/family/answer`}>{t.startHere}</ButtonLink>
            </div>
            <p className="text-base text-muted">{t.privacy}</p>
            <p className="text-base text-muted">{t.monthly}</p>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{t.previous}</h2>
            {informant.length === 0 && <p className="text-lg text-muted">{t.noneYet}</p>}
            <ul className="flex flex-col gap-3">
              {[...informant].reverse().map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-4 text-lg">
                  <span className="font-semibold">{new Date(r.at).toLocaleDateString(lang)}</span>
                  <span>{t.relationships[r.relationship]}</span>
                  <span>{fmt(t.changes, { n: r.score, total: INFORMANT_ITEMS })}</span>
                  {r.isSynthetic && <SimulatedBadge label={dict.common.simulated} />}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
      <p className="text-sm text-muted">{t.licence}</p>
    </div>
  );
}
