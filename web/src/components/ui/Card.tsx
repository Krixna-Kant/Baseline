import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-line bg-card p-6 shadow-sm ${className}`}
      {...props}
    />
  );
}
