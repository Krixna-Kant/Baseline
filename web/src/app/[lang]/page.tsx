import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AppHeader } from "@/components/AppHeader";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <AppHeader locale={lang} appName={dict.common.appName} switchLabel={dict.common.switchLanguage} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 pb-12">
        <section className="flex flex-col gap-4 pt-6">
          <h1 className="text-4xl font-bold leading-tight">{dict.home.tagline}</h1>
          <p className="text-lg text-muted">{dict.home.intro}</p>
        </section>

        <section aria-labelledby="steps-title" className="flex flex-col gap-4">
          <h2 id="steps-title" className="text-2xl font-bold">
            {dict.home.stepsTitle}
          </h2>
          <ol className="flex flex-col gap-3">
            {dict.home.steps.map((step, i) => (
              <li key={step.title}>
                <Card className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-lg font-bold text-brand"
                  >
                    {(i + 1).toLocaleString(lang)}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted">{step.body}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-3">
          <Button disabled aria-describedby="start-soon">
            {dict.home.start}
          </Button>
          <p id="start-soon" className="text-center text-sm text-muted">
            {dict.home.startSoon}
          </p>
          <ButtonLink href={`/${lang}/design`} variant="quiet">
            {dict.home.designLink}
          </ButtonLink>
        </div>

        <p className="rounded-2xl bg-brand-soft p-4 text-base text-ink">{dict.common.screeningNotice}</p>
      </main>
    </>
  );
}
