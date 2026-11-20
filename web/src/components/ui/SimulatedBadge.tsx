export function SimulatedBadge({ label, hint }: { label: string; hint?: string }) {
  return (
    <span
      title={hint}
      className="inline-flex items-center gap-2 rounded-full border border-simulated/30 bg-simulated-soft px-3 py-1 text-sm font-semibold text-simulated"
    >
      <span aria-hidden className="size-2 rounded-full bg-simulated" />
      {label}
      {hint && <span className="sr-only">: {hint}</span>}
    </span>
  );
}
