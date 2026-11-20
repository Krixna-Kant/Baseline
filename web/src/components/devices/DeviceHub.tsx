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
import { Icon, type IconName } from "@/components/ui/Icon";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { fmt } from "@/lib/format";

const DEVICE_TYPES: Record<SimDevice, Reading["type"][]> = {
  bp_cuff: ["bp"],
  glucometer: ["glucose"],
  watch: ["sleep", "steps"],
};

const DEVICE_ICON: Record<SimDevice, IconName> = { bp_cuff: "heart", glucometer: "drop", watch: "moon" };

const READINGS_PREVIEW = 12;

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
  const [showAll, setShowAll] = useState(false);

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

  const lastOf = (d: SimDevice) => readings.find((r) => DEVICE_TYPES[d].includes(r.type));
  const shown = showAll ? readings : readings.slice(0, READINGS_PREVIEW);

  return (
    <div className="flex flex-col gap-6">
      <section className="card-shadow relative overflow-hidden rounded-[2rem] bg-brand-strong text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/devices-hero.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-strong via-brand-strong/80 to-transparent rtl:bg-gradient-to-l" />
        <div className="relative flex max-w-xl flex-col gap-3 p-6 sm:p-10">
          <h1 className="text-3xl font-bold sm:text-4xl">{t.title}</h1>
          <p className="text-lg text-white/90">{t.intro}</p>
        </div>
      </section>

      {!deviceOn ? (
        <Card>
          <p className="text-lg">{t.off}</p>
          <ButtonLink href={`/${lang}/privacy`} variant="secondary" className="mt-4">
            {dict.nav.privacy.title}
          </ButtonLink>
        </Card>
      ) : (
        <>
          <section aria-labelledby="sim-title" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="sim-title" className="text-2xl font-bold">
                {t.simTitle}
              </h2>
              <SimulatedBadge label={dict.common.simulated} hint={dict.common.simulatedHint} />
            </div>
            <p className="text-lg text-muted">{t.simBody}</p>
            <ul className="grid gap-4 sm:grid-cols-3">
              {(["bp_cuff", "glucometer", "watch"] as SimDevice[]).map((d) => {
                const last = lastOf(d);
                return (
                  <li key={d}>
                    <Card className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                          <Icon name={DEVICE_ICON[d]} />
                        </span>
                        <p className="text-lg font-semibold leading-snug">{t.sim[d]}</p>
                      </div>
                      <p className="flex items-center gap-2 text-base text-muted">
                        <span aria-hidden className={`size-2.5 rounded-full ${last ? "bg-stable" : "bg-line"}`} />
                        {last
                          ? fmt(t.lastReading, {
                              date: new Date(last.measuredAt).toLocaleDateString(lang, { day: "numeric", month: "short" }),
                            })
                          : t.noReadingYet}
                      </p>
                      <Button
                        variant="secondary"
                        className="mt-auto min-h-12 text-base"
                        onClick={() => {
                          add(simulateWeek(d, newSeed(), Date.now(), newId));
                          setNotice(t.simAdded);
                        }}
                      >
                        {t.simAdd}
                      </Button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {notice && (
        <p role="status" className="flex items-center gap-3 rounded-2xl bg-stable-soft p-4 text-lg text-stable">
          <Icon name="check" />
          {notice}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {deviceOn && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-night text-mint">
                <Icon name="mic" />
              </span>
              <h2 className="text-2xl font-bold">{t.manualTitle}</h2>
            </div>
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
        )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="doc" />
          </span>
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
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t.listTitle}</h2>
        {readings.length === 0 && <p className="text-lg text-muted">{t.none}</p>}
        {readings.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-start text-base">
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  {(["type", "value", "when", "source", "status"] as const).map((c) => (
                    <th key={c} scope="col" className="px-3 py-2 text-start font-semibold">
                      {t.cols[c]}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2">
                    <span className="sr-only">{t.delete}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const level = readingLevel(r);
                  return (
                    <tr key={r.id} className="border-b border-line/60 last:border-0">
                      <td className="px-3 py-3 font-semibold">{t.types[r.type]}</td>
                      <td className="px-3 py-3 whitespace-nowrap" dir="ltr">
                        {formatReading(r)}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {new Date(r.measuredAt).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}
                        {r.context && <span className="block text-sm">{t.contexts[r.context]}</span>}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        <span className="flex flex-wrap items-center gap-2">
                          {t.sources[r.source]}
                          {r.isSynthetic && <SimulatedBadge label={dict.common.simulated} />}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {level !== "info" && (
                          <span className={`rounded-full px-3 py-0.5 text-sm font-semibold whitespace-nowrap ${LEVEL_STYLE[level]}`}>
                            {t.levels[level]}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-end">
                        <Button
                          variant="quiet"
                          className="min-h-10 text-base"
                          onClick={() => update((s) => ({ ...s, readings: s.readings.filter((x) => x.id !== r.id) }))}
                        >
                          {t.delete}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <ul className="flex flex-col gap-3 md:hidden">
          {shown.map((r) => {
            const level = readingLevel(r);
            return (
              <li key={r.id} className="flex flex-col gap-2 rounded-2xl border border-line p-4">
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
        {!showAll && readings.length > READINGS_PREVIEW && (
          <Button variant="secondary" className="self-center" onClick={() => setShowAll(true)}>
            {fmt(t.showAll, { n: readings.length })}
          </Button>
        )}
      </Card>
    </div>
  );
}
