import type { NoorPersona } from "@/lib/store";

export type NoorMood = "idle" | "listening" | "thinking" | "speaking";

const PALETTE: Record<NoorPersona, { glow: string; core: string; ring: string }> = {
  noor: { glow: "#f6d58e", core: "#1f5c45", ring: "#e3efe7" },
  rashid: { glow: "#e8c9a0", core: "#7a4a1e", ring: "#f5ebe0" },
};

/** An abstract "light" figure: no face to stereotype, clear motion for each state. */
export function NoorAvatar({ persona, mood, size = 56 }: { persona: NoorPersona; mood: NoorMood; size?: number }) {
  const p = PALETTE[persona];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <circle cx="32" cy="32" r="30" fill={p.ring} />
      <circle cx="32" cy="32" r="22" fill={p.glow} opacity={0.55} className={mood === "listening" ? "noor-pulse" : ""} />
      <circle cx="32" cy="32" r="15" fill={p.core} />
      {mood === "thinking" ? (
        <g fill="#fff">
          {[24, 32, 40].map((x, i) => (
            <circle key={x} cx={x} cy="32" r="2.4" className="noor-dot" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </g>
      ) : (
        <>
          <circle cx="27" cy="29" r="2" fill="#fff" />
          <circle cx="37" cy="29" r="2" fill="#fff" />
          <rect
            x="27"
            y="36"
            width="10"
            height={mood === "speaking" ? 4 : 2}
            rx="1.5"
            fill="#fff"
            className={mood === "speaking" ? "noor-talk" : ""}
          />
        </>
      )}
    </svg>
  );
}
