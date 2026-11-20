import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppHeader({
  locale,
  appName,
  switchLabel,
}: {
  locale: Locale;
  appName: string;
  switchLabel: string;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-4">
      <Link href={`/${locale}`} className="flex items-center gap-3 text-xl font-bold text-ink">
        <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-brand text-white">
          B
        </span>
        {appName}
      </Link>
      <LanguageSwitcher locale={locale} label={switchLabel} />
    </header>
  );
}
