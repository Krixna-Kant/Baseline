"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/Controls";
import type { TimelapseUser } from "./types";

const STATE_FILL: Record<string, string> = {
  stable: "fill-stable-soft",
  watch_context: "fill-watch-soft",
  watch: "fill-watch-soft",
  review: "fill-review-soft",
  urgent: "fill-urgent-soft",
  building: "fill-line",
};

export function Timelapse({ dict, users }: { dict: Dictionary; users: TimelapseUser[] }) {
  const t = dict.lab;
  const [key, setKey] = useState(users[0]?.key ?? "");
  const [frame, setFrame] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const u = users.find((x) => x.key === key) ?? users[0];
  const n = u?.points.length ?? 0;
  const shown = frame ?? n - 1;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setFrame((f) => {
        const next = (f ?? -1) + 1;
        if (next >= n - 1) {
          setPlaying(false);
          return n - 1;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(id);
  }, [playing, n]);

  if (!u) return null;
  const W = 600;
  const H = 240;
  const pad = 36;
  const maxDay = u.points[n - 1].day;
  const x = (d: number) => pad + (d / maxDay) * (W - pad - 10);
  const lo = Math.min(-3.5, ...u.points.map((p) => Math.min(p.z ?? 0, p.true_change * 2)));
  const y = (v: number) => 12 + ((1.5 - v) / (1.5 - lo)) * (H - pad - 12);
  const visible = u.points.slice(0, shown + 1);
  const path = (sel: (p: TimelapseUser["points"][number]) => number | null) =>
    visible
      .map((p) => [p.day, sel(p)] as const)
      .filter(([, v]) => v != null)
      .map(([d, v], i) => `${i ? "L" : "M"}${x(d)},${y(v as number)}`)
      .join(" ");
  const cur = u.points[shown];

  return (
    <div className="flex flex-col gap-4">
      <ChoiceGroup
        label=""
        columns={3}
        value={key}
        onChange={(k) => {
          setKey(k);
          setFrame(null);
          setPlaying(false);
        }}
        options={users.map((x) => ({ value: x.key, label: x.label }))}
      />
      <p className="text-base text-muted">
        {Object.values(u.profile).join(" · ")}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full [direction:ltr]" role="img" aria-label={u.label}>
        {visible.map((p, i) => {
          const next = u.points[i + 1]?.day ?? p.day + 1;
          return <rect key={i} x={x(p.day)} width={Math.max(0.5, x(next) - x(p.day))} y={12} height={H - pad - 12} className={STATE_FILL[p.state] ?? "fill-line"} />;
        })}
        <line x1={pad} x2={W - 10} y1={y(0)} y2={y(0)} className="stroke-line" />
        <text x={pad - 4} y={y(0) + 4} textAnchor="end" className="fill-muted text-[11px]">
          0
        </text>
        {u.onset_day != null && u.onset_day <= cur.day && (
          <g>
            <line x1={x(u.onset_day)} x2={x(u.onset_day)} y1={12} y2={H - pad} className="stroke-ink" strokeDasharray="3 3" />
            <text x={x(u.onset_day) + 3} y={24} className="fill-ink text-[11px]">
              {t.onset}
            </text>
          </g>
        )}
        {u.review_day != null && u.review_day <= cur.day && (
          <g>
            <line x1={x(u.review_day)} x2={x(u.review_day)} y1={12} y2={H - pad} className="stroke-review" strokeWidth={2} />
            <text x={x(u.review_day) + 3} y={38} className="fill-review text-[11px] font-semibold">
              {t.review}
            </text>
          </g>
        )}
        <path d={path((p) => p.true_change)} fill="none" className="stroke-muted" strokeWidth={2} strokeDasharray="5 4" />
        <path d={path((p) => p.z)} fill="none" className="stroke-brand" strokeWidth={2.5} />
        <text x={(W + pad) / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[12px]">
          {fmt(t.day, { n: Math.round(cur.day) })}
        </text>
      </svg>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-6 bg-brand" /> {t.engineView}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-6 border-t-2 border-dashed border-muted" /> {t.trueChange}
        </span>
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          if (!playing && shown >= n - 1) setFrame(0);
          setPlaying(!playing);
        }}
      >
        {playing ? t.pause : t.play}
      </Button>
    </div>
  );
}
