import type { EngineState, TrajectoryPoint } from "@/lib/engine";

const BAND: Record<EngineState, string> = {
  building: "var(--color-line)",
  stable: "var(--color-stable-soft)",
  watch_context: "var(--color-watch-soft)",
  watch: "var(--color-watch-soft)",
  review: "var(--color-review-soft)",
  urgent: "var(--color-urgent-soft)",
};

const W = 640;
const H = 220;
const PAD = { l: 36, r: 12, t: 12, b: 28 };

/** Composite change in personal SD units with a ±1.96·SE band, coloured by the engine state at each session. */
export function TrajectoryChart({
  points,
  label,
  usualLabel,
  locale,
}: {
  points: TrajectoryPoint[];
  label: string;
  usualLabel: string;
  locale: string;
}) {
  const pts = points.filter((p) => p.compositeLevel !== null && p.compositeSe !== null);
  if (pts.length < 2) return null;
  const t0 = Date.parse(pts[0].at);
  const t1 = Date.parse(pts.at(-1)!.at);
  const span = Math.max(t1 - t0, 1);
  const lows = pts.map((p) => p.compositeLevel! - 1.96 * p.compositeSe!);
  const highs = pts.map((p) => p.compositeLevel! + 1.96 * p.compositeSe!);
  const lo = Math.min(-2, ...lows);
  const hi = Math.max(1, ...highs);
  const x = (at: string) => PAD.l + ((Date.parse(at) - t0) / span) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + ((hi - v) / (hi - lo)) * (H - PAD.t - PAD.b);
  const band =
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.at)},${y(highs[i])}`).join("") +
    [...pts].reverse().map((p, i) => `L${x(p.at)},${y(lows[pts.length - 1 - i])}`).join("") +
    "Z";
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.at)},${y(p.compositeLevel!)}`).join("");
  const ticks = [lo, 0, hi].map((v) => Math.round(v * 10) / 10);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full [direction:ltr]">
      {pts.map((p, i) => {
        const x0 = i ? (x(pts[i - 1].at) + x(p.at)) / 2 : PAD.l;
        const x1 = i < pts.length - 1 ? (x(p.at) + x(pts[i + 1].at)) / 2 : W - PAD.r;
        return <rect key={p.sessionId + i} x={x0} y={PAD.t} width={x1 - x0} height={H - PAD.t - PAD.b} fill={BAND[p.state]} />;
      })}
      <path d={band} fill="var(--color-brand)" opacity={0.15} />
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="var(--color-muted)" strokeDasharray="4 4" />
      <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth={2.5} />
      {ticks.map((v) => (
        <text key={v} x={PAD.l - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">
          {v}
        </text>
      ))}
      <text x={W - PAD.r} y={y(0) - 6} textAnchor="end" fontSize={11} fill="var(--color-muted)">
        {usualLabel}
      </text>
      {[pts[0], pts.at(-1)!].map((p, i) => (
        <text
          key={i}
          x={x(p.at)}
          y={H - 8}
          textAnchor={i ? "end" : "start"}
          fontSize={11}
          fill="var(--color-muted)"
        >
          {new Date(p.at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
        </text>
      ))}
    </svg>
  );
}
