import type { Dictionary } from "@/i18n/dictionaries";
import { Button } from "@/components/ui/Button";

export function UrgentScreen({ dict, onBack }: { dict: Dictionary; onBack: () => void }) {
  const t = dict.urgent;
  return (
    <section role="alert" className="flex flex-col gap-5 rounded-[var(--radius-card)] border-2 border-urgent bg-urgent-soft p-6">
      <h1 className="text-3xl font-bold text-urgent">{t.title}</h1>
      <p className="text-xl">{t.body}</p>
      <a
        href="tel:998"
        className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-urgent text-2xl font-bold text-white"
      >
        {t.call}
      </a>
      <Button variant="quiet" onClick={onBack}>
        {t.back}
      </Button>
    </section>
  );
}
