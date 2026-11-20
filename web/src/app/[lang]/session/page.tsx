import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SessionRunner } from "@/components/session/SessionRunner";

export default async function SessionPage({ params }: PageProps<"/[lang]/session">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
      <SessionRunner dict={dict} lang={lang} />
    </main>
  );
}
