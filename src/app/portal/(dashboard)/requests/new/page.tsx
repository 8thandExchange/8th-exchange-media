import Link from "next/link";
import { NewRequestForm } from "@/components/portal/NewRequestForm";

export default function NewRequestPage() {
  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/portal/requests" className="inv-link text-sm">
        ← Back to requests
      </Link>
      <div className="inv-page-header" style={{ marginTop: 12 }}>
        <div>
          <h1 className="inv-page-title">New request</h1>
          <p className="inv-page-subtitle">Tell us what you need.</p>
        </div>
      </div>

      <div className="inv-card">
        <div className="inv-detail-section">
          <NewRequestForm />
        </div>
      </div>
    </div>
  );
}
