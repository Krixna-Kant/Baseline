import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AppHeader } from "@/components/AppHeader";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { StateChip, type MonitoringState } from "@/components/ui/StateChip";

const swatches = [
  ["surface", "bg-surface"],
  ["ink", "bg-ink"],
  ["muted", "bg-muted"],
  ["brand", "bg-brand"],
  ["brand-soft", "bg-brand-soft"],
  ["stable", "bg-stable"],
  ["watch", "bg-watch"],
  ["review", "bg-review"],
  ["urgent", "bg-urgent"],
  ["simulated", "bg-simulated"],
] as const;

const typeScale = [
  ["text-4xl font-bold", "4xl"],
  ["text-2xl font-bold", "2xl"],
  ["text-xl font-semibold", "xl"],
  ["text-lg", "lg"],
  ["text-base", "base"],
] as const;

const states: MonitoringState[] = ["stable", "watch", "review", "urgent"];

export default async function DesignPage({ params }: PageProps<"/[lang]/design">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const d = dict.design;

  return (
    <>
      <AppHeader locale={lang} appName={dict.common.appName} switchLabel={dict.common.switchLanguage} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 pb-12">
        <div className="flex flex-col gap-2 pt-4">
          <ButtonLink href={`/${lang}`} variant="quiet" className="-mx-2 self-start">
            {dict.common.back}
          </ButtonLink>
          <h1 className="text-4xl font-bold">{d.title}</h1>
          <p className="text-lg text-muted">{d.intro}</p>
        </div>

        <Card>
          <h2 className="mb-4 text-2xl font-bold">{d.colors}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {swatches.map(([name, cls]) => (
              <li key={name} className="flex flex-col gap-1">
                <span className={`h-14 rounded-xl border border-line ${cls}`} />
                <code className="text-sm text-muted" dir="ltr">
                  {name}
                </code>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-2xl font-bold">{d.type}</h2>
          <div className="flex flex-col gap-3">
            {typeScale.map(([cls, name]) => (
              <div key={name} className="flex items-baseline justify-between gap-4">
                <span className={cls}>{d.sample}</span>
                <code className="shrink-0 text-sm text-muted" dir="ltr">
                  {name}
                </code>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-2xl font-bold">{d.buttons}</h2>
          <div className="flex flex-col gap-3">
            <Button>{d.primary}</Button>
            <Button variant="secondary">{d.secondary}</Button>
            <Button variant="quiet">{d.quiet}</Button>
            <Button disabled>{d.disabled}</Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-2xl font-bold">{d.states}</h2>
          <ul className="flex flex-col gap-4">
            {states.map((s) => (
              <li key={s} className="flex flex-col items-start gap-1">
                <StateChip state={s} label={d.stateNames[s]} />
                <p className="text-muted">{d.stateHints[s]}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-2xl font-bold">{d.badges}</h2>
          <div className="flex flex-col items-start gap-2">
            <SimulatedBadge label={dict.common.simulated} hint={dict.common.simulatedHint} />
            <p className="text-muted">{dict.common.simulatedHint}</p>
          </div>
        </Card>
      </main>
    </>
  );
}
