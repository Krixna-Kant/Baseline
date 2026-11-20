import { INSTRUCTIONS, MEDICINES, SHOPPING_ITEMS } from "./content";
import { mulberry32, pick } from "./random";
import type { ShoppingForm } from "@/components/tasks/ShoppingTask";
import type { MedicationForm } from "@/components/tasks/MedicationTask";

export interface SessionForms {
  seed: number;
  shopping: ShoppingForm & { delayedFoils: ShoppingForm["foils"] };
  shoppingPractice: ShoppingForm;
  medication: MedicationForm;
  medicationPractice: MedicationForm;
}

export function buildForms(seed: number): SessionForms {
  const rand = mulberry32(seed);
  const items = pick(SHOPPING_ITEMS, 22, rand);
  const meds = pick(MEDICINES, 5, rand);
  const instr = pick(INSTRUCTIONS, 5, rand);

  return {
    seed,
    shopping: {
      formId: `shopping-${seed}`,
      seed,
      targets: items.slice(0, 6),
      foils: items.slice(6, 12),
      delayedFoils: items.slice(12, 18),
      studySeconds: 20,
    },
    shoppingPractice: {
      formId: `shopping-practice-${seed}`,
      seed: seed + 1,
      targets: items.slice(18, 20),
      foils: items.slice(20, 22),
      studySeconds: 8,
    },
    medication: {
      formId: `medication-${seed}`,
      rows: meds.slice(0, 4).map((medicine, i) => ({ medicine, instruction: instr[i] })),
    },
    medicationPractice: {
      formId: `medication-practice-${seed}`,
      rows: [{ medicine: meds[4], instruction: instr[4] }],
    },
  };
}
