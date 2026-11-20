import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Packet } from "@/lib/packet";
import { TrajectoryChart } from "@/components/charts/TrajectoryChart";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-4 break-inside-avoid">
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
    </section>
  );
}

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

  return (
    <div className="flex flex-col gap-4 text-base">
      <Section title={t.person}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted">{t.age}</dt>
          <dd dir="ltr" className="text-start">{packet.person.ageBand}</dd>
          <dt className="text-muted">{t.sex}</dt>
          <dd>{dict.onboarding.sexOptions[packet.person.sex as keyof typeof dict.onboarding.sexOptions]}</dd>
          <dt className="text-muted">{t.education}</dt>
          <dd>{dict.onboarding.educationOptions[packet.person.education as keyof typeof dict.onboarding.educationOptions]}</dd>
          <dt className="text-muted">{t.language}</dt>
          <dd>{packet.person.language === "ar" ? "العربية" : "English"}</dd>
          <dt className="text-muted">{t.familiarity}</dt>
          <dd>{t.bands[packet.person.digitalFamiliarity as keyof typeof t.bands]}</dd>
          <dt className="text-muted">{t.assisted}</dt>
          <dd>{packet.person.assisted ? dict.common.yes : dict.common.no}</dd>
          <dt className="text-muted">{t.sessions}</dt>
          <dd>
            {packet.person.sessions} · {t.since} {date(packet.person.firstSession)}
          </dd>
        </dl>
      </Section>

      <Section title={t.decision}>
        {d ? (
          <>
            <p className="text-lg font-semibold">
              {dict.status.stateNames[d.state as keyof typeof dict.status.stateNames] ?? d.state} ·{" "}
              <span className="font-mono text-base">{d.ruleFired}</span>
            </p>
            <p className="text-muted">{t.rules[d.ruleFired as keyof typeof t.rules] ?? ""}</p>
            {d.composite && (
              <p dir="ltr" className="text-start font-mono">
                composite {d.composite.estimate.toFixed(2)} SD [{d.composite.low.toFixed(2)}, {d.composite.high.toFixed(2)}] · z{" "}
                {d.composite.z.toFixed(2)}
              </p>
            )}
            <table className="w-full text-start" dir="ltr">
              <thead>
                <tr className="text-muted">
                  <th className="text-start font-normal">{t.family}</th>
                  <th className="text-start font-normal">{t.change}</th>
                  <th className="text-start font-normal">95%</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {Object.entries(d.families).map(([f, iv]) => (
                  <tr key={f}>
                    <td className="font-sans">{t.families[f as keyof typeof t.families]}</td>
                    <td>{iv.estimate.toFixed(2)}</td>
                    <td>
                      [{iv.low.toFixed(2)}, {iv.high.toFixed(2)}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted">
              {t.threshold} {d.thresholdVersion} · {t.engine} {d.engineVersion} · {date(d.decidedAt)}
            </p>
          </>
        ) : (
          <p className="text-muted">{t.noDecision}</p>
        )}
      </Section>

      {packet.trajectory.length > 1 && (
        <Section title={t.trajectory}>
          <TrajectoryChart points={packet.trajectory} label={t.trajectory} usualLabel={t.usual} locale={lang} />
          <p className="text-muted">{t.trajectoryNote}</p>
        </Section>
      )}

      <Section title={t.confounders}>
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
      </Section>

      <Section title={t.informant}>
        {packet.informant.length ? (
          <ul className="flex flex-col gap-1">
            {packet.informant.map((r, i) => (
              <li key={i}>
                {date(r.at)} · {dict.family.relationships[r.relationship as keyof typeof dict.family.relationships]} ·{" "}
                {r.score}/{r.outOf} {r.newDifficulty && <strong className="text-review">· {t.informantFlag}</strong>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t.none}</p>
        )}
      </Section>

      <Section title={t.risk}>
        <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          {packet.risk
            .filter((r) => r.value !== "not_asked")
            .map((r) => (
              <li key={r.factor}>
                {t.factors[r.factor as keyof typeof t.factors]}:{" "}
                <strong>{t.values[r.value as keyof typeof t.values]}</strong>
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
      </Section>

      <Section title={t.readings}>
        {packet.readings.length ? (
          <ul className="flex flex-col gap-1">
            {packet.readings.map((r) => (
              <li key={r.type} className="flex flex-wrap items-center gap-2">
                <span>{dict.devices.types[r.type]}:</span>
                <strong dir="ltr">{r.text}</strong>
                {r.level !== "info" && <span>({dict.devices.levels[r.level as "high" | "low" | "ok"]})</span>}
                <span className="text-muted">
                  · {date(r.at)} · {dict.devices.sources[r.source as keyof typeof dict.devices.sources]} ·{" "}
                  {dict.devices.quality[r.quality as keyof typeof dict.devices.quality]}
                </span>
                {r.synthetic && <SimulatedBadge label={dict.common.simulated} />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t.none}</p>
        )}
      </Section>

      <Section title={t.genomics}>
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
      </Section>

      <p className="rounded-2xl bg-brand-soft p-4 font-semibold">{dict.common.screeningNotice}</p>
    </div>
  );
}
