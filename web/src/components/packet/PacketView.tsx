import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Packet } from "@/lib/packet";
import { fmt } from "@/lib/format";
import { TrajectoryChart } from "@/components/charts/TrajectoryChart";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";

function Panel({ title, icon, children, className = "" }: { title: string; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 break-inside-avoid ${className}`}>
      <h3 className="flex items-center gap-2 text-lg font-bold">
        {icon && <Icon name={icon} className="size-5 text-brand" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

const STATES = ["stable", "watch", "review", "urgent"] as const;
const STATE_ON: Record<(typeof STATES)[number], string> = {
  stable: "bg-stable text-white",
  watch: "bg-watch text-white",
  review: "bg-review text-white",
  urgent: "bg-urgent text-white",
};

const AXIS = { lo: -3, hi: 2 };
const pos = (v: number) => `${((Math.min(Math.max(v, AXIS.lo), AXIS.hi) - AXIS.lo) / (AXIS.hi - AXIS.lo)) * 100}%`;

/** One rendering for the person (genomics withheld) and the clinician (genomics with counselling prompt). */
export function PacketView({
  packet,
  dict,
  lang,
  audience,
}: {
  packet: Packet;
  dict: Dictionary;
  lang: Locale;
  audience: "person" | "clinician";
}) {
  const t = dict.packet;
  const d = packet.decision;
  const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(lang, { dateStyle: "medium" }) : "—");
  const ctx = dict.status.context;
  const current = d ? (d.state === "watch_context" ? "watch" : d.state) : null;

  const bands: [string, ReactNode][] = [
    [t.age, <span key="a" dir="ltr">{packet.person.ageBand}</span>],
    [t.sex, dict.onboarding.sexOptions[packet.person.sex as keyof typeof dict.onboarding.sexOptions]],
    [t.education, dict.onboarding.educationOptions[packet.person.education as keyof typeof dict.onboarding.educationOptions]],
    [t.language, packet.person.language === "ar" ? "العربية" : "English"],
    [t.familiarity, t.bands[packet.person.digitalFamiliarity as keyof typeof t.bands]],
    [t.assisted, packet.person.assisted ? dict.common.yes : dict.common.no],
    [t.sessions, `${packet.person.sessions} · ${t.since} ${date(packet.person.firstSession)}`],
  ];

  return (
    <div className="flex flex-col gap-4 text-base">
      <Panel title={t.person} icon="users">
        <dl className="flex flex-wrap gap-2">
          {bands.map(([k, v]) => (
            <div key={k} className="flex flex-col rounded-xl bg-surface px-3 py-2">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title={t.decision} icon="shield">
        {d ? (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">{t.stateRow}</p>
              <ol className="grid grid-cols-4 gap-1.5 rounded-full bg-surface p-1.5">
                {STATES.map((s) => (
                  <li
                    key={s}
                    aria-current={current === s ? "step" : undefined}
                    className={`rounded-full px-2 py-2 text-center text-sm font-semibold ${current === s ? STATE_ON[s] : "text-muted"}`}
                  >
                    {dict.status.stateNames[s]}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-lg font-semibold">
              {t.rules[d.ruleFired as keyof typeof t.rules] ?? ""}{" "}
              <span className="font-mono text-sm font-normal text-muted">{d.ruleFired}</span>
            </p>
            {d.composite && (
              <p dir="ltr" className="text-start font-mono text-sm">
                composite {d.composite.estimate.toFixed(2)} SD [{d.composite.low.toFixed(2)}, {d.composite.high.toFixed(2)}] · z{" "}
                {d.composite.z.toFixed(2)}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted">{t.noDecision}</p>
        )}
      </Panel>

      {packet.trajectory.length > 1 && (
        <Panel title={t.trajectory} icon="chart">
          <TrajectoryChart points={packet.trajectory} label={t.trajectory} usualLabel={t.usual} locale={lang} />
          <p className="text-sm text-muted">{t.trajectoryNote}</p>
        </Panel>
      )}

      {d && Object.keys(d.families).length > 0 && (
        <section className="flex flex-col gap-3 break-inside-avoid">
          <h3 className="text-lg font-bold">{t.domains}</h3>
          <ul className="grid gap-3 sm:grid-cols-3">
            {Object.entries(d.families).map(([f, iv]) => (
              <li key={f} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold">{t.families[f as keyof typeof t.families]}</p>
                <div className="relative h-6 rounded-full bg-surface [direction:ltr]" aria-hidden>
                  <div
                    className="absolute inset-y-1 rounded-full bg-mint"
                    style={{ left: pos(iv.low), right: `calc(100% - ${pos(iv.high)})` }}
                  />
                  <div className="absolute inset-y-0.5 w-0.5 bg-ink/50" style={{ left: pos(0) }} />
                  <div
                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
                    style={{ left: pos(iv.estimate) }}
                  />
                </div>
                <p dir="ltr" className="text-start font-mono text-sm text-muted">
                  {t.change}: {iv.estimate.toFixed(2)} [{iv.low.toFixed(2)}, {iv.high.toFixed(2)}]
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={t.confounders} icon="moon">
          <ul className="flex flex-wrap gap-2">
            {packet.confounders.checked.map((c) => {
              const present = packet.confounders.present.includes(c);
              return (
                <li
                  key={c}
                  className={`rounded-full px-3 py-1 text-sm ${present ? "bg-watch-soft font-semibold text-watch" : "bg-surface text-muted"}`}
                >
                  {ctx[c as keyof typeof ctx]}: {present ? t.present : t.notPresent}
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title={t.informant} icon="users">
          {packet.informant.length ? (
            <ul className="flex flex-col gap-2">
              {packet.informant.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface px-3 py-2">
                  <span>
                    {date(r.at)} · {dict.family.relationships[r.relationship as keyof typeof dict.family.relationships]} ·{" "}
                    {r.score}/{r.outOf}
                  </span>
                  {r.newDifficulty && (
                    <span className="rounded-full bg-review-soft px-2.5 py-0.5 text-sm font-semibold text-review">{t.informantFlag}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">{t.none}</p>
          )}
        </Panel>

        <Panel title={t.risk} icon="heart">
          <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {packet.risk
              .filter((r) => r.value !== "not_asked")
              .map((r) => (
                <li key={r.factor}>
                  {t.factors[r.factor as keyof typeof t.factors]}: <strong>{t.values[r.value as keyof typeof t.values]}</strong>
                  {r.source === "import" && <span className="text-muted"> ({t.fromRecord})</span>}
                </li>
              ))}
          </ul>
          {packet.risk.every((r) => r.value === "not_asked") && <p className="text-muted">{t.none}</p>}
          {packet.familyHistory && packet.familyHistory.value !== "unknown" && (
            <p>
              {t.familyHistory}: <strong>{t.values[packet.familyHistory.value]}</strong>
              {packet.familyHistory.onsetBefore65 === "yes" && ` · ${t.earlyOnset}`}
            </p>
          )}
        </Panel>

        <Panel title={t.readings} icon="device">
          {packet.readings.length ? (
            <ul className="flex flex-col gap-2">
              {packet.readings.map((r) => (
                <li key={r.type} className="flex flex-col rounded-xl bg-surface px-3 py-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{dict.devices.types[r.type]}:</span>
                    <strong dir="ltr">{r.text}</strong>
                    {r.level !== "info" && <span>({dict.devices.levels[r.level as "high" | "low" | "ok"]})</span>}
                    {r.synthetic && <SimulatedBadge label={dict.common.simulated} />}
                  </span>
                  <span className="text-sm text-muted">
                    {date(r.at)} · {dict.devices.sources[r.source as keyof typeof dict.devices.sources]} ·{" "}
                    {dict.devices.quality[r.quality as keyof typeof dict.devices.quality]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">{t.none}</p>
          )}
        </Panel>
      </div>

      <Panel title={t.genomics} icon="sparkle">
        {audience === "person" ? (
          <p className="text-muted">{packet.genomics ? t.genomicsPerson : t.genomicsNotShared}</p>
        ) : packet.genomics ? (
          <div className="flex flex-col gap-1">
            <p className="flex flex-wrap items-center gap-2">
              APOE: <strong>{dict.health.apoe[packet.genomics.apoe4 as keyof typeof dict.health.apoe]}</strong>
              <SimulatedBadge label={dict.common.simulated} />
            </p>
            <p className="rounded-xl bg-watch-soft p-3">{t.counselling}</p>
          </div>
        ) : (
          <p className="text-muted">{t.genomicsNotShared}</p>
        )}
      </Panel>

      <footer className="flex flex-col gap-2 rounded-2xl bg-brand-soft p-4">
        <p className="font-semibold">{dict.common.screeningNotice}</p>
        <p className="text-sm text-muted">{t.unsigned}</p>
        {d && (
          <p className="text-sm text-muted">
            {fmt(t.generated, { date: date(d.decidedAt), engine: d.engineVersion, threshold: d.thresholdVersion })}
          </p>
        )}
      </footer>
    </div>
  );
}
