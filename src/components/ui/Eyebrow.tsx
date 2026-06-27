import { cn } from "@/lib/utils";

interface EyebrowProps {
  index: string;
  label: string;
  tone?: "light" | "dark";
  className?: string;
}

export function Eyebrow({ index, label, tone = "light", className }: EyebrowProps) {
  const text = label ? `( ${index} ) — ${label}` : `( ${index} )`;

  return (
    <p
      className={cn(
        "eyebrow",
        tone === "light" ? "eyebrow-on-light" : "eyebrow-on-dark",
        className
      )}
    >
      {text}
    </p>
  );
}
