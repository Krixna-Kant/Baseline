"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ListenButton } from "@/components/ui/Controls";

export function TaskIntro({
  title,
  body,
  lang,
  listen,
  stop,
  practiceBadge,
  startLabel,
  onStart,
  children,
}: {
  title: string;
  body: string;
  lang: "ar" | "en";
  listen: string;
  stop: string;
  practiceBadge?: string;
  startLabel: string;
  onStart: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      {practiceBadge && (
        <span className="self-start rounded-full bg-watch-soft px-3 py-1 text-sm font-semibold text-watch">
          {practiceBadge}
        </span>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-xl">{body}</p>
      <ListenButton text={body} lang={lang} label={listen} stopLabel={stop} />
      {children}
      <Button onClick={onStart}>{startLabel}</Button>
    </section>
  );
}
