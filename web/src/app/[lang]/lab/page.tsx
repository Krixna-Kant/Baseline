import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AppHeader } from "@/components/AppHeader";
import { LabView } from "@/components/lab/LabView";

export async function generateMetadata({ params }: PageProps<"/[lang]/lab">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: `${dict.lab.title} — ${dict.common.appName}` };
}

export default async function LabPage({ params }: PageProps<"/[lang]/lab">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <AppHeader locale={lang} appName={dict.common.appName} switchLabel={dict.common.switchLanguage} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-12">
        <LabView dict={dict} />
      </main>
    </>
  );
}
