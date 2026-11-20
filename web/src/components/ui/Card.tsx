import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return (
    <section
      className={`card-shadow rounded-[var(--radius-card)] border border-line/80 bg-card p-6 ${className}`}
      {...props}
    />
  );
}
