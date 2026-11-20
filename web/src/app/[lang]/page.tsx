import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AppHeader } from "@/components/AppHeader";
import { HomeGate } from "@/components/home/HomeGate";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const welcome = (
    <div className="flex flex-col gap-10 pt-6">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl font-bold leading-tight text-brand-strong sm:text-5xl">{dict.home.tagline}</h1>
          <p className="text-lg text-muted">{dict.home.intro}</p>
          <ButtonLink href={`/${lang}/onboarding`} className="self-start">
            {dict.home.start}
            <Icon name="arrow" className="size-5" />
          </ButtonLink>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home-morning.jpg"
          alt=""
          className="card-shadow aspect-[4/3] w-full rounded-[2rem] object-cover"
        />
      </section>

      <section aria-labelledby="steps-title" className="flex flex-col gap-4">
        <h2 id="steps-title" className="text-2xl font-bold">
          {dict.home.stepsTitle}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {dict.home.steps.map((step, i) => (
            <li key={step.title}>
              <Card className="flex h-full flex-col gap-3">
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-lg font-bold text-brand-strong"
                >
                  {i + 1}
                </span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <p className="rounded-2xl bg-brand-soft p-4 text-base text-ink">{dict.common.screeningNotice}</p>
    </div>
  );

  return (
    <>
      <AppHeader locale={lang} appName={dict.common.appName} switchLabel={dict.common.switchLanguage} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 pb-12">
        <HomeGate dict={dict} lang={lang} welcome={welcome} />
      </main>
    </>
  );
}
