import { cn } from "@/lib/utils";
import { statusLabel, type RequestStatus } from "@/lib/portal/service";

const TONES: Record<RequestStatus, string> = {
  new: "inv-badge-open",
  in_progress: "inv-badge-open",
  in_review: "inv-badge-draft",
  delivered: "inv-badge-paid",
  closed: "inv-badge-void",
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <span className={cn("inv-badge", TONES[status], className)}>{statusLabel(status)}</span>
  );
}
