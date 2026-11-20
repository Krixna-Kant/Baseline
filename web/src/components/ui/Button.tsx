import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet" | "light";

const base =
  "inline-flex min-h-14 items-center justify-center gap-3 rounded-full text-lg font-semibold " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "px-7 bg-brand text-white hover:bg-brand-strong",
  secondary: "px-7 border-2 border-brand bg-card text-brand hover:bg-brand-soft",
  quiet: "px-2 text-brand underline-offset-4 hover:underline",
  light: "px-7 bg-white text-night hover:bg-mint",
};

export function buttonClasses(variant: Variant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
