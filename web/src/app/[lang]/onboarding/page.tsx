import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AppHeader } from "@/components/AppHeader";
import { Onboarding } from "@/components/onboarding/Onboarding";

export default async function OnboardingPage({ params }: PageProps<"/[lang]/onboarding">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <AppHeader locale={lang} appName={dict.common.appName} switchLabel={dict.common.switchLanguage} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12">
        <Onboarding dict={dict} lang={lang} />
      </main>
    </>
  );
}
