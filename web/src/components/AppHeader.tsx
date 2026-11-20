import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AppNav } from "./AppNav";

const MORE = ["family", "packet", "health", "privacy", "clinic", "lab", "demo"] as const;

/** App chrome: top bar on every screen, plus a bottom tab bar on phones once a profile exists. */
export async function AppHeader({
  locale,
  appName,
  switchLabel,
}: {
  locale: Locale;
  appName: string;
  switchLabel: string;
}) {
  const dict = await getDictionary(locale);
  return (
    <AppNav
      lang={locale}
      text={{
        appName,
        switchLabel,
        shell: dict.shell,
        personas: dict.noor.personas,
        more: MORE.map((key) => ({ key, title: dict.nav[key].title })),
      }}
    />
  );
}
