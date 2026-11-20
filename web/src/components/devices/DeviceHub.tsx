"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hasConsent, newId, update, useAppState, visibleData } from "@/lib/store";
import {
  formatReading,
  parseSpokenReading,
  READING_UNITS,
  readingLevel,
  sampleRecordBundle,
  simulateWeek,
  type ParsedReading,
  type SimDevice,
} from "@/lib/context";
import { canListen, listenOnce } from "@/lib/speech";
import { newSeed } from "@/lib/random";
import type { Reading } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/Controls";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";

const LEVEL_STYLE = {
  high: "bg-watch-soft text-watch",
  low: "bg-watch-soft text-watch",
  ok: "bg-stable-soft text-stable",
  info: "",
} as const;

export function DeviceHub({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.devices;
  const state = useAppState();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedReading | null>(null);
  const [failed, setFailed] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!state.hydrated) return <p className="text-muted">{dict.common.loading}</p>;
  if (!state.profile) return <ButtonLink href={`/${lang}/onboarding`}>{dict.home.start}</ButtonLink>;

  const deviceOn = hasConsent(state.consents, "device");
  const importOn = hasConsent(state.consents, "records_import");
  const readings = [...visibleData(state).readings].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));

  const add = (rs: Reading[]) => update((s) => ({ ...s, readings: [...s.readings, ...rs] }));

  const check = (input: string) => {
    const p = parseSpokenReading(input);
    setParsed(p);
    setFailed(!p);
  };

  const saveParsed = () => {
    if (!parsed) return;
    add([
      {
        ...parsed,
        id: newId("rd"),
        unit: READING_UNITS[parsed.type],
        measuredAt: new Date().toISOString(),
        source: "app",
        quality: parsed.context === "after_exercise" ? "uncertain" : "good",
        note: parsed.type === "sleep" ? "sleep_estimate" : undefined,
        consentScope: "device",
        isSynthetic: false,
      },
    ]);
    setParsed(null);
    setText("");
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-lg">{t.intro}</p>

      {!deviceOn ? (
        <Card>
          <p className="text-lg">{t.off}</p>
          <ButtonLink href={`/${lang}/privacy`} variant="secondary" className="mt-4">
            {dict.nav.privacy.title}
          </ButtonLink>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{t.simTitle}</h2>
              <SimulatedBadge label={dict.common.simulated} hint={dict.common.simulatedHint} />
            </div>
            <p className="text-lg">{t.simBody}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["bp_cuff", "glucometer", "watch"] as SimDevice[]).map((d) => (
                <Button
                  key={d}
                  variant="secondary"
                  onClick={() => {
                    add(simulateWeek(d, newSeed(), Date.now(), newId));
                    setNotice(t.simAdded);
                  }}
                >
                  {t.sim[d]}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{t.manualTitle}</h2>
            <p className="text-lg">{t.manualBody}</p>
            <form
              className="flex flex-wrap gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                check(text);
              }}
            >
              <label className="sr-only" htmlFor="reading-text">
                {t.manualTitle}
              </label>
              <input
                id="reading-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.manualPlaceholder}
                className="min-h-14 flex-1 rounded-2xl border-2 border-line bg-card px-4 text-lg"
              />
              {canListen() && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={listening}
                  onClick={() => {
                    setListening(true);
                    listenOnce(
                      lang,
                      (heard) => {
                        setText(heard);
                        check(heard);
                      },
                      () => setListening(false),
                    );
                  }}
                >
                  {listening ? t.listening : t.speak}
                </Button>
              )}
              <Button type="submit" disabled={!text.trim()}>
                {t.check}
              </Button>
            </form>
            {failed && <p className="text-lg text-watch">{t.notUnderstood}</p>}
            {parsed && (
              <div className="flex flex-col gap-4 rounded-2xl bg-brand-soft p-4">
                <p className="text-xl font-semibold">
                  {t.confirm} {t.types[parsed.type]}:{" "}
                  <span dir="ltr">
                    {formatReading({ ...parsed, unit: READING_UNITS[parsed.type] } as Reading)}
                  </span>
                </p>
                {(parsed.type === "bp" || parsed.type === "glucose") && (
                  <ChoiceGroup
                    label={t.contextLabel}
                    columns={2}
                    value={parsed.context ?? "unknown"}
                    onChange={(context) => setParsed({ ...parsed, context })}
                    options={(parsed.type === "bp"
                      ? (["resting", "after_exercise"] as const)
                      : (["fasting", "after_meal", "unknown"] as const)
                    ).map((c) => ({ value: c, label: t.contexts[c] }))}
                  />
                )}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={saveParsed}>{t.save}</Button>
                  <Button variant="quiet" onClick={() => setParsed(null)}>
                    {t.cancel}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">{t.importTitle}</h2>
          <SimulatedBadge label={dict.common.simulated} hint={dict.common.simulatedHint} />
        </div>
        {importOn ? (
          <>
            <p className="text-lg">{t.importBody}</p>
            <Button
              variant="secondary"
              className="self-start"
              onClick={() => {
                const b = sampleRecordBundle(Date.now(), newId);
                update((s) => ({
                  ...s,
                  readings: [...s.readings, ...b.readings],
                  risk: {
                    factors: { ...b.factors, ...s.risk?.factors },
                    familyHistory: s.risk?.familyHistory ?? { value: "unknown" },
                    genomics: s.risk?.genomics,
                    updatedAt: new Date().toISOString(),
                  },
                }));
                setNotice(t.imported);
              }}
            >
              {t.importButton}
            </Button>
          </>
        ) : (
          <>
            <p className="text-lg text-muted">{t.importOff}</p>
            <ButtonLink href={`/${lang}/privacy`} variant="secondary" className="self-start">
              {dict.nav.privacy.title}
            </ButtonLink>
          </>
        )}
      </Card>

      {notice && (
        <p role="status" className="rounded-2xl bg-brand-soft p-4 text-lg">
          {notice}
        </p>
      )}

      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t.listTitle}</h2>
        {readings.length === 0 && <p className="text-lg text-muted">{t.none}</p>}
        <ul className="flex flex-col gap-3">
          {readings.map((r) => {
            const level = readingLevel(r);
            return (
              <li key={r.id} className="flex flex-col gap-2 rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold">{t.types[r.type]}</span>
                  <span className="text-lg" dir="ltr">
                    {formatReading(r)}
                  </span>
                  {level !== "info" && (
                    <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${LEVEL_STYLE[level]}`}>
                      {t.levels[level]}
                    </span>
                  )}
                  {r.isSynthetic && <SimulatedBadge label={dict.common.simulated} />}
                </div>
                <p className="text-base text-muted">
                  {new Date(r.measuredAt).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                  {t.sources[r.source]}
                  {r.deviceModel && ` (${r.deviceModel})`}
                  {r.context && ` · ${t.contexts[r.context]}`} · {t.quality[r.quality]}
                </p>
                {r.note === "sleep_estimate" && <p className="text-sm text-muted">{t.sleepNote}</p>}
                <Button
                  variant="quiet"
                  className="min-h-10 self-start text-base"
                  onClick={() => update((s) => ({ ...s, readings: s.readings.filter((x) => x.id !== r.id) }))}
                >
                  {t.delete}
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
