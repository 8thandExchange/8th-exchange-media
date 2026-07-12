import Link from "next/link";
import { NewRequestForm } from "@/components/portal/NewRequestForm";

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/portal" className="nav-link">
        ← Back to requests
      </Link>
      <div className="mb-8 mt-4">
        <p className="eyebrow eyebrow-on-light mb-2">New Request</p>
        <h1 className="font-display text-3xl text-navy">Tell us what you need.</h1>
      </div>

      <div className="border-hairline bg-paper p-6 md:p-8">
        <NewRequestForm />
      </div>
    </div>
  );
}
