"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { TextScale } from "@/lib/types";
import { fmt } from "@/lib/format";
import { openNoor } from "@/lib/noorBridge";
import { update, useAppState } from "@/lib/store";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface AppNavText {
  appName: string;
  switchLabel: string;
  shell: Dictionary["shell"];
  personas: Dictionary["noor"]["personas"];
  more: { key: string; title: string }[];
}

const TOP: { key: keyof Dictionary["shell"]["nav"]; icon: IconName }[] = [
  { key: "home", icon: "home" },
  { key: "session", icon: "play" },
  { key: "plan", icon: "leaf" },
  { key: "family", icon: "users" },
  { key: "devices", icon: "device" },
  { key: "packet", icon: "doc" },
];

const TABS: { key: "home" | "session" | "plan" | "devices"; icon: IconName }[] = [
  { key: "home", icon: "home" },
  { key: "session", icon: "play" },
  { key: "plan", icon: "leaf" },
  { key: "devices", icon: "device" },
];

const MORE_ICONS: Record<string, IconName> = {
  family: "users",
  packet: "doc",
  health: "heart",
  privacy: "shield",
  clinic: "clinic",
  lab: "chart",
  demo: "clock",
};

const SCALES: TextScale[] = [1, 1.15, 1.3];

function TextSizeToggle({ label, names }: { label: string; names: string[] }) {
  const { profile } = useAppState();
  if (!profile) return null;
  const current = profile.sensory.textScale;
  return (
    <div role="group" aria-label={label} className="flex items-center rounded-full border border-line bg-card p-1">
      {SCALES.map((s, i) => (
        <button
          key={s}
          type="button"
          aria-pressed={current === s}
          aria-label={names[i]}
          title={names[i]}
          onClick={() =>
            update((st) => (st.profile ? { ...st, profile: { ...st.profile, sensory: { ...st.profile.sensory, textScale: s } } } : st))
          }
          className={`grid size-10 place-items-center rounded-full font-bold leading-none ${
            current === s ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
          }`}
          style={{ fontSize: `${0.8 + i * 0.15}rem` }}
        >
          A
        </button>
      ))}
    </div>
  );
}

function Logo({ lang, name }: { lang: Locale; name: string }) {
  return (
    <Link href={`/${lang}`} className="flex items-center gap-2.5 text-xl font-bold text-brand">
      <span aria-hidden className="grid size-10 place-items-center rounded-2xl bg-brand text-white">
        <Icon name="leaf" className="size-6" />
      </span>
      {name}
    </Link>
  );
}

export function AppNav({ lang, text }: { lang: Locale; text: AppNavText }) {
  const pathname = usePathname();
  const { hydrated, profile, noorPersona } = useAppState();
  const [moreOpen, setMoreOpen] = useState(false);
  const signedIn = hydrated && Boolean(profile);
  const t = text.shell;

  const href = (key: string) => (key === "home" ? `/${lang}` : `/${lang}/${key}`);
  const active = (key: string) =>
    key === "home" ? pathname === `/${lang}` : pathname === href(key) || pathname.startsWith(`${href(key)}/`);
  const moreActive = text.more.some((m) => active(m.key));
  const noorName = text.personas[noorPersona];

  return (
    <>
      <header className="app-chrome sticky top-0 z-30 border-b border-line/70 bg-surface/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Logo lang={lang} name={text.appName} />
          {signedIn && (
            <nav aria-label={t.mainNav} className="hidden min-w-0 flex-1 justify-center lg:flex">
              <ul className="flex min-w-0 items-center gap-1 overflow-x-auto">
                {TOP.map(({ key }) => (
                  <li key={key}>
                    <Link
                      href={href(key)}
                      title={t.nav[key]}
                      aria-current={active(key) ? "page" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-full px-3 text-base font-semibold whitespace-nowrap ${
                        active(key) ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"
                      }`}
                    >
                      {t.tabs[key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="ms-auto flex shrink-0 items-center gap-2 lg:ms-0">
            <div className="hidden lg:block">
              <TextSizeToggle label={t.textSize} names={t.textSizes} />
            </div>
            <LanguageSwitcher locale={lang} label={text.switchLabel} />
            {signedIn && (
              <button
                type="button"
                onClick={openNoor}
                className="hidden min-h-11 items-center gap-2 rounded-full bg-brand-soft px-4 text-base font-semibold whitespace-nowrap text-brand 2xl:inline-flex"
              >
                <span aria-hidden className="size-2.5 rounded-full bg-stable" />
                {fmt(t.noorHere, { name: noorName })}
              </button>
            )}
          </div>
        </div>
      </header>

      {signedIn && (
        <nav
          aria-label={t.mainNav}
          className="app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="mx-auto grid max-w-xl grid-cols-5">
            {TABS.map(({ key, icon }) => (
              <li key={key}>
                <Link
                  href={href(key)}
                  aria-current={active(key) ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
                    active(key) ? "text-brand" : "text-muted"
                  }`}
                >
                  <span className={`grid h-8 w-14 place-items-center rounded-full ${active(key) ? "bg-brand-soft" : ""}`}>
                    <Icon name={icon} />
                  </span>
                  {t.tabs[key]}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((o) => !o)}
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
                  moreOpen || moreActive ? "text-brand" : "text-muted"
                }`}
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full ${moreOpen || moreActive ? "bg-brand-soft" : ""}`}>
                  <Icon name="grid" />
                </span>
                {t.tabs.more}
              </button>
            </li>
          </ul>
        </nav>
      )}

      {signedIn && moreOpen && (
        <div className="app-chrome fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t.moreTitle}>
          <button type="button" aria-label={t.close} className="absolute inset-0 bg-ink/30" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-[2rem] bg-surface p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t.moreTitle}</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label={t.close}
                className="grid size-11 place-items-center rounded-full bg-card"
              >
                <Icon name="close" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {text.more.map((m) => (
                <li key={m.key}>
                  <Link
                    href={href(m.key)}
                    onClick={() => setMoreOpen(false)}
                    className={`flex h-full min-h-20 flex-col justify-between gap-2 rounded-2xl border bg-card p-4 font-semibold ${
                      active(m.key) ? "border-brand text-brand" : "border-line text-ink"
                    }`}
                  >
                    <Icon name={MORE_ICONS[m.key] ?? "grid"} className="size-6 text-brand" />
                    {m.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ps-4">
              <span className="font-semibold">{t.textSize}</span>
              <TextSizeToggle label={t.textSize} names={t.textSizes} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
