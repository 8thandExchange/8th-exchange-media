import { cn } from "@/lib/utils";
import { statusLabel, type RequestStatus } from "@/lib/portal/service";

const TONES: Record<RequestStatus, string> = {
  new: "border-navy/25 text-navy",
  in_progress: "border-gold-dark/40 bg-gold/15 text-gold-dark",
  in_review: "border-navy/25 bg-navy/5 text-navy",
  delivered: "border-navy bg-navy text-cream",
  closed: "border-navy/15 text-ink/45",
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
        TONES[status],
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
