export type MonitoringState = "stable" | "watch" | "review" | "urgent";

const styles: Record<MonitoringState, string> = {
  stable: "bg-stable-soft text-stable border-stable/30",
  watch: "bg-watch-soft text-watch border-watch/30",
  review: "bg-review-soft text-review border-review/30",
  urgent: "bg-urgent-soft text-urgent border-urgent/40",
};

export function StateChip({ state, label }: { state: MonitoringState; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-base font-semibold ${styles[state]}`}
    >
      <span aria-hidden className="size-2.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
