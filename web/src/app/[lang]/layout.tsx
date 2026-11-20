import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Noto_Sans, Noto_Sans_Arabic } from "next/font/google";
import { dirFor, hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { TextScaleApplier } from "@/components/TextScaleApplier";
import { Noor } from "@/components/noor/Noor";
import "../globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    appleWebApp: { capable: true, title: dict.common.appName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#f8f4ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { noor, status, urgent, devices, plan } = await getDictionary(lang);

  return (
    <html
      lang={lang}
      dir={dirFor(lang)}
      className={`${notoSans.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-ink">
        {children}
        <Noor dict={{ noor, status, urgent, devices, plan }} lang={lang} />
        <ServiceWorkerRegister />
        <TextScaleApplier />
      </body>
    </html>
  );
}
