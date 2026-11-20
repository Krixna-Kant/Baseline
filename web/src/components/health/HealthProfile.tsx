"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hasConsent, update, useAppState, visibleData } from "@/lib/store";
import { RISK_FACTORS, type RiskProfile, type Tri } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/Controls";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";

type Draft = Pick<RiskProfile, "factors" | "familyHistory" | "genomics">;

export function HealthProfile({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.health;
  const state = useAppState();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);

  if (!state.hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!state.profile) return <ButtonLink href={`/${lang}/onboarding`}>{dict.home.start}</ButtonLink>;

  const visible = visibleData(state);
  const current: Draft = draft ?? {
    factors: visible.factors,
    familyHistory: state.risk?.familyHistory ?? { value: "unknown" },
    genomics: visible.genomics,
  };
  const genomicsOn = hasConsent(state.consents, "genomics");
  const tri = (v: Tri | undefined) => v ?? null;
  const triOptions = [
    { value: "yes" as Tri, label: dict.common.yes },
    { value: "no" as Tri, label: dict.common.no },
    { value: "unknown" as Tri, label: t.dontKnow },
  ];

  const edit = (fn: (d: Draft) => Draft) => {
    setDraft(fn(current));
    setSaved(false);
  };

  const save = () => {
    const at = new Date().toISOString();
    update((s) => ({
      ...s,
      risk: {
        // Keep imported answers the user cannot currently see, so revoking consent does not delete them.
        factors: { ...s.risk?.factors, ...current.factors },
        familyHistory: current.familyHistory,
        genomics: genomicsOn ? current.genomics : s.risk?.genomics,
        updatedAt: at,
      },
    }));
    setDraft(null);
    setSaved(true);
  };

  const actionable = RISK_FACTORS.filter((f) => current.factors[f]?.value === "yes");

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-lg">{t.intro}</p>

      <Card className="flex flex-col gap-8">
        {RISK_FACTORS.map((f) => {
          const answer = current.factors[f];
          return (
            <div key={f} className="flex flex-col gap-2">
              <ChoiceGroup
                label={t.questions[f]}
                columns={3}
                value={tri(answer?.value)}
                onChange={(value) =>
                  edit((d) => ({
                    ...d,
                    factors: { ...d.factors, [f]: { value, source: "app", at: new Date().toISOString() } },
                  }))
                }
                options={triOptions}
              />
              {answer?.source === "import" && <p className="text-sm text-muted">{t.fromRecord}</p>}
            </div>
          );
        })}
      </Card>

      <Card className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">{t.familyTitle}</h2>
        <ChoiceGroup
          label={t.familyQuestion}
          columns={3}
          value={current.familyHistory.value}
          onChange={(value) => edit((d) => ({ ...d, familyHistory: { ...d.familyHistory, value } }))}
          options={triOptions}
        />
        {current.familyHistory.value === "yes" && (
          <>
            <ChoiceGroup
              label={t.relation}
              columns={3}
              value={current.familyHistory.relation ?? null}
              onChange={(relation) => edit((d) => ({ ...d, familyHistory: { ...d.familyHistory, relation } }))}
              options={(["parent", "sibling", "other"] as const).map((r) => ({ value: r, label: t.relations[r] }))}
            />
            <ChoiceGroup
              label={t.onsetQuestion}
              columns={3}
              value={current.familyHistory.onsetBefore65 ?? null}
              onChange={(onsetBefore65) =>
                edit((d) => ({ ...d, familyHistory: { ...d.familyHistory, onsetBefore65 } }))
              }
              options={triOptions}
            />
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">{t.genomicsTitle}</h2>
          <SimulatedBadge label={dict.common.simulated} hint={dict.common.simulatedHint} />
        </div>
        {genomicsOn ? (
          <>
            <p className="text-lg">{t.genomicsBody}</p>
            <ChoiceGroup
              label={t.genomicsTitle}
              value={current.genomics?.apoe4 ?? "unknown"}
              onChange={(apoe4) =>
                edit((d) => ({ ...d, genomics: { apoe4, isSynthetic: true, at: new Date().toISOString() } }))
              }
              options={(["unknown", "non_carrier", "carrier"] as const).map((v) => ({ value: v, label: t.apoe[v] }))}
            />
          </>
        ) : (
          <p className="text-lg text-muted">{t.genomicsOff}</p>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={save} disabled={!draft}>
          {t.save}
        </Button>
        {saved && (
          <p role="status" className="text-lg font-semibold text-brand">
            {t.saved}
          </p>
        )}
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t.whatYouCanDoTitle}</h2>
        {actionable.length ? (
          <ul className="flex list-disc flex-col gap-3 ps-6 text-lg">
            {actionable.map((f) => (
              <li key={f}>{t.actions[f]}</li>
            ))}
          </ul>
        ) : (
          <p className="text-lg text-muted">{t.whatYouCanDoEmpty}</p>
        )}
        <p className="text-base text-muted">{t.noScores}</p>
        <ButtonLink href={`/${lang}/plan`} variant="secondary" className="self-start">
          {dict.nav.plan.title}
        </ButtonLink>
      </Card>
    </div>
  );
}
