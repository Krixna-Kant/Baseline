"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hasConsent, newId, update, useAppState } from "@/lib/store";
import { informantReport } from "@/lib/context";
import type { InformantReport } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/Controls";

type Answer = "yes" | "no" | "unknown";
const VALUE: Record<Answer, 0 | 1 | null> = { yes: 1, no: 0, unknown: null };
const RELATIONSHIPS: InformantReport["relationship"][] = ["spouse", "child", "sibling", "friend", "caregiver", "other"];

export function InformantForm({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.family;
  const { hydrated, profile, consents } = useAppState();
  const [relationship, setRelationship] = useState<InformantReport["relationship"] | null>(null);
  const [answers, setAnswers] = useState<(Answer | null)[]>(t.items.map(() => null));
  const [sent, setSent] = useState(false);

  if (!hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!profile || !hasConsent(consents, "informant")) {
    return (
      <Card>
        <p className="text-lg">{t.off}</p>
      </Card>
    );
  }

  if (sent) {
    return (
      <Card className="mt-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{t.thanks}</h1>
        <ButtonLink href={`/${lang}/family`}>{dict.common.done}</ButtonLink>
      </Card>
    );
  }

  const complete = relationship !== null && answers.every((a) => a !== null);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.formTitle}</h1>
      <p className="text-lg">{t.formIntro}</p>
      <Card className="flex flex-col gap-8">
        <ChoiceGroup
          label={t.relationship}
          columns={2}
          value={relationship}
          onChange={setRelationship}
          options={RELATIONSHIPS.map((r) => ({ value: r, label: t.relationships[r] }))}
        />
        {t.items.map((item, i) => (
          <ChoiceGroup
            key={i}
            label={`${i + 1}. ${item}`}
            columns={3}
            value={answers[i]}
            onChange={(v) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
            options={(["yes", "no", "unknown"] as const).map((v) => ({ value: v, label: t.answers[v] }))}
          />
        ))}
      </Card>
      <Button
        disabled={!complete}
        onClick={() => {
          if (!relationship) return;
          const report = informantReport(
            answers.map((a) => VALUE[a ?? "unknown"]),
            {
              id: newId("inf"),
              at: new Date().toISOString(),
              relationship,
              language: lang,
              source: "informant",
              isSynthetic: false,
            },
          );
          update((s) => ({ ...s, informant: [...s.informant, report] }));
          setSent(true);
        }}
      >
        {t.submit}
      </Button>
      <p className="text-sm text-muted">{t.licence}</p>
    </div>
  );
}
