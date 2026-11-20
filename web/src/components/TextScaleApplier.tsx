"use client";

import { useEffect } from "react";
import { useAppState } from "@/lib/store";

export function TextScaleApplier() {
  const { profile } = useAppState();
  const scale = profile?.sensory.textScale ?? 1;
  useEffect(() => {
    document.documentElement.style.fontSize = `${112.5 * scale}%`;
  }, [scale]);
  return null;
}
