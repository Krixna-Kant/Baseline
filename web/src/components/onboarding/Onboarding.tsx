"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { newId, update, useAppState } from "@/lib/store";
import { fmt } from "@/lib/format";
import { hasVoice } from "@/lib/speech";
import type { ConsentScope, Consents, Education, FamiliarityBand, Profile, TextScale } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup, ListenButton, StepHeader, YesNo } from "@/components/ui/Controls";

const SCOPES: ConsentScope[] = [
  "core",
  "informant",
  "device",
  "records_import",
  "genomics",
  "share_clinician",
  "research_use",
];

const DEFAULT_CONSENT: Record<ConsentScope, boolean> = {
  core: true,
  informant: true,
  device: true,
  records_import: false,
  genomics: false,
  share_clinician: false,
  research_use: false,
};

function familiarityBand(score: number): FamiliarityBand {
  if (score <= 2) return "low";
  if (score <= 4) return "medium";
  return "high";
}

const STEPS = 5;

export function Onboarding({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.onboarding;
  const c = dict.common;
  const router = useRouter();
  const { hydrated } = useAppState();

  const [step, setStep] = useState(0);
  const [birthYear, setBirthYear] = useState("");
  const [sex, setSex] = useState<Profile["sex"] | null>(null);
  const [education, setEducation] = useState<Education | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [hearingOk, setHearingOk] = useState<boolean | null>(null);
  const [visionOk, setVisionOk] = useState<boolean | null>(null);
  const [textScale, setTextScale] = useState<TextScale>(1);
  const [assisted, setAssisted] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(DEFAULT_CONSENT);

  if (!hydrated) return <p className="p-6 text-muted">{c.loading}</p>;

  const year = Number(birthYear);
  const currentYear = new Date().getFullYear();
  const yearValid = Number.isInteger(year) && year >= 1915 && year <= currentYear - 18;

  const canContinue = [
    true,
    yearValid && education !== null,
    answers.every((a) => a !== null),
    hearingOk !== null && visionOk !== null && assisted !== null,
    consent.core,
  ][step];

  function applyScale(scale: TextScale) {
    setTextScale(scale);
    document.documentElement.style.fontSize = `${112.5 * scale}%`;
  }

  function finish() {
    const now = new Date().toISOString();
    const score = answers.reduce<number>((a, b) => a + (b ?? 0), 0);
    const profile: Profile = {
      id: newId("user"),
      createdAt: now,
      language: lang,
      birthYear: year,
      sex: sex ?? "undisclosed",
      education: education ?? "secondary",
      digitalFamiliarity: { answers: answers.map((a) => a ?? 0), score, band: familiarityBand(score) },
      sensory: { hearingOk: hearingOk ?? true, visionOk: visionOk ?? true, textScale },
      assistedDefault: assisted ?? false,
      isSynthetic: false,
    };
    const consents = Object.fromEntries(
      SCOPES.map((s) => [s, { granted: consent[s], at: now }]),
    ) as Consents;
    update((s) => ({ ...s, profile, consents }));
    router.push(`/${lang}`);
  }

  const familiarityOptions = [
    { value: 2, label: c.yes },
    { value: 1, label: c.sometimes },
    { value: 0, label: c.no },
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepHeader step={step + 1} total={STEPS + 1} label={fmt(c.stepOf, { n: step + 1, total: STEPS + 1 })} />

      {step === 0 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{t.welcomeTitle}</h1>
          <p className="text-lg text-muted">{t.welcomeBody}</p>
          <ListenButton text={`${t.welcomeTitle}. ${t.welcomeBody}`} lang={lang} label={c.listen} stopLabel={c.stop} />
          <p className="rounded-2xl bg-brand-soft p-4">{c.screeningNotice}</p>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">{t.aboutTitle}</h1>
            <p className="text-lg text-muted">{t.aboutBody}</p>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-xl font-semibold">{t.birthYear}</span>
            <input
              inputMode="numeric"
              dir="ltr"
              maxLength={4}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ""))}
              placeholder="1965"
              className="min-h-14 rounded-2xl border-2 border-line bg-card px-5 text-xl"
            />
          </label>
          <ChoiceGroup
            label={t.sex}
            value={sex}
            onChange={setSex}
            options={(["female", "male", "undisclosed"] as const).map((v) => ({ value: v, label: t.sexOptions[v] }))}
          />
          <ChoiceGroup
            label={t.education}
            value={education}
            onChange={setEducation}
            options={(["none_primary", "secondary", "tertiary"] as const).map((v) => ({
              value: v,
              label: t.educationOptions[v],
            }))}
          />
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">{t.familiarityTitle}</h1>
            <p className="text-lg text-muted">{t.familiarityBody}</p>
          </div>
          {t.familiarityQuestions.map((q, i) => (
            <ChoiceGroup
              key={q}
              label={q}
              columns={3}
              value={answers[i]}
              onChange={(v) => setAnswers((prev) => prev.map((a, j) => (j === i ? v : a)))}
              options={familiarityOptions}
            />
          ))}
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">{t.sensoryTitle}</h1>
          <Card className="flex flex-col gap-4">
            <p className="text-lg">{t.hearingPrompt}</p>
            <ListenButton text={t.hearingSample} lang={lang} label={c.listen} stopLabel={c.stop} />
            {!hasVoice(lang) && <p className="text-sm text-watch">{t.noVoice}</p>}
            <YesNo label="" value={hearingOk} onChange={setHearingOk} yes={c.yes} no={c.no} />
          </Card>
          <Card className="flex flex-col gap-4">
            <ChoiceGroup
              label={t.textSizePrompt}
              columns={3}
              value={textScale}
              onChange={applyScale}
              options={([1, 1.15, 1.3] as const).map((v) => ({
                value: v,
                label: t.textSizes[String(v) as "1" | "1.15" | "1.3"],
              }))}
            />
            <YesNo label={t.visionPrompt} value={visionOk} onChange={setVisionOk} yes={c.yes} no={c.no} />
          </Card>
          <YesNo label={t.assistedPrompt} value={assisted} onChange={setAssisted} yes={c.yes} no={c.no} />
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{t.consentTitle}</h1>
          <p className="text-lg text-muted">{t.consentBody}</p>
          <ul className="flex flex-col gap-3">
            {SCOPES.map((scope) => (
              <li key={scope}>
                <label className="flex min-h-14 cursor-pointer items-start gap-4 rounded-2xl border-2 border-line bg-card p-4">
                  <input
                    type="checkbox"
                    checked={consent[scope]}
                    disabled={scope === "core"}
                    onChange={(e) => setConsent((prev) => ({ ...prev, [scope]: e.target.checked }))}
                    className="mt-1 size-6 shrink-0 accent-[var(--color-brand)]"
                  />
                  <span className="flex flex-col">
                    <span className="text-lg font-semibold">
                      {t.scopes[scope].title}
                      {scope === "core" && <span className="ms-2 text-sm text-muted">({t.consentRequired})</span>}
                    </span>
                    <span className="text-muted">{t.scopes[scope].body}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 5 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{t.finishTitle}</h1>
          <p className="text-lg text-muted">{t.finishBody}</p>
        </section>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            {c.back}
          </Button>
        )}
        {step < STEPS ? (
          <Button className="flex-1" disabled={!canContinue} onClick={() => setStep(step + 1)}>
            {c.next}
          </Button>
        ) : (
          <Button className="flex-1" onClick={finish}>
            {t.finish}
          </Button>
        )}
      </div>
    </div>
  );
}
