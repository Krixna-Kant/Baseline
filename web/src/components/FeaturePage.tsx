import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { AppHeader } from "./AppHeader";

type Params = { params: Promise<{ lang: string }> };

/** Header + main frame for a client feature screen that only needs the dictionary and locale. */
export function featurePage(
  title: (d: Dictionary) => string,
  Body: ComponentType<{ dict: Dictionary; lang: Locale }>,
  width: "narrow" | "wide" = "narrow",
) {
  async function generateMetadata({ params }: Params) {
    const { lang } = await params;
    if (!hasLocale(lang)) return {};
    const dict = await getDictionary(lang);
    return { title: `${title(dict)} — ${dict.common.appName}` };
  }

  async function Page({ params }: Params) {
    const { lang } = await params;
    if (!hasLocale(lang)) notFound();
    const dict = await getDictionary(lang);
    return (
      <>
        <AppHeader locale={lang} appName={dict.common.appName} switchLabel={dict.common.switchLanguage} />
        <main className={`mx-auto w-full flex-1 px-5 pb-12 ${width === "wide" ? "max-w-4xl" : "max-w-2xl"}`}>
          <Body dict={dict} lang={lang} />
        </main>
      </>
    );
  }

  return { generateMetadata, Page };
}
