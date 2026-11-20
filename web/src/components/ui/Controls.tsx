"use client";

import { useState } from "react";
import { canSpeak, speak, stopSpeaking } from "@/lib/speech";

const optionBase =
  "min-h-14 rounded-2xl border-2 px-5 text-lg font-semibold transition-colors text-start " +
  "aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand-strong";

export function ChoiceGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns = 1,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3 | 5;
}) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 5: "grid-cols-5" }[columns];
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-xl font-semibold">{label}</legend>
      <div className={`grid gap-3 ${cols}`}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`${optionBase} border-line bg-card ${columns === 5 ? "px-0 text-center" : ""}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function YesNo({
  label,
  value,
  onChange,
  yes,
  no,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  yes: string;
  no: string;
}) {
  return (
    <ChoiceGroup
      label={label}
      columns={2}
      value={value === null ? null : value ? "y" : "n"}
      onChange={(v) => onChange(v === "y")}
      options={[
        { value: "y", label: yes },
        { value: "n", label: no },
      ]}
    />
  );
}

export function Scale5({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ChoiceGroup
        label={label}
        columns={5}
        value={value}
        onChange={onChange}
        options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
      />
      <div className="flex justify-between text-sm text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function ListenButton({
  text,
  lang,
  label,
  stopLabel,
}: {
  text: string;
  lang: "ar" | "en";
  label: string;
  stopLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (playing) {
          stopSpeaking();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        speak(text, lang, () => setPlaying(false));
      }}
      className="inline-flex min-h-12 items-center gap-2 self-start rounded-xl border-2 border-brand bg-card px-4 text-base font-semibold text-brand"
    >
      <span aria-hidden>{playing ? "■" : "🔊"}</span>
      {playing ? stopLabel : label}
    </button>
  );
}

export function StepHeader({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}
