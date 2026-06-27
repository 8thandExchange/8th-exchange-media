import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonProps {
  href?: string;
  children: React.ReactNode;
  tone?: "light" | "dark" | "dark-accent" | "dark-gold";
  pill?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({
  href,
  children,
  tone = "light",
  pill = false,
  className,
  type = "button",
  disabled,
}: ButtonProps) {
  const classes = cn(
    "btn",
    pill && "btn-pill",
    pill && tone === "light" && "btn-pill-on-light",
    pill && tone === "dark" && "btn-pill-on-dark",
    pill && tone === "dark-gold" && "btn-pill-on-dark-gold",
    !pill && tone === "light" && "btn-on-light",
    !pill && tone === "dark" && "btn-on-dark",
    !pill && tone === "dark-accent" && "btn-on-dark-accent",
    disabled && "pointer-events-none opacity-50",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}
