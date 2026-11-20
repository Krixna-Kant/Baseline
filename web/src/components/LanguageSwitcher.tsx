"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { otherLocale, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const target = otherLocale(locale);
  const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");

  return (
    <Link
      href={`/${target}${rest}`}
      lang={target}
      hrefLang={target}
      className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-base font-semibold text-ink hover:border-brand"
    >
      {label}
    </Link>
  );
}
