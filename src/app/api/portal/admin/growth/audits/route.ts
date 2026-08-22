import { NextResponse } from "next/server";
import { z } from "zod";
import { crawlWebsite } from "@/lib/growth/audit";
import { scoreAudit } from "@/lib/growth/scoring";
import {
  completeAudit,
  createAuditRecord,
  failAudit,
  listAudits,
} from "@/lib/growth/service";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const auditInput = z.object({
  clientId: z.string().uuid().nullable().optional(),
  websiteUrl: z.string().trim().min(3).max(2048),
  maxPages: z.number().int().min(1).max(25).default(12),
});

export async function GET() {
  try {
    await requireInvoicingAuth();
    return NextResponse.json({ audits: await listAudits() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load audits";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = auditInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid website URL" },
      { status: 400 }
    );
  }

  let audit: Awaited<ReturnType<typeof createAuditRecord>> | null = null;
  try {
    audit = await createAuditRecord({
      clientId: parsed.data.clientId ?? null,
      websiteUrl: parsed.data.websiteUrl,
      maxPages: parsed.data.maxPages,
    });
    const result = await crawlWebsite(parsed.data.websiteUrl, parsed.data.maxPages);
    const opportunities = scoreAudit(result.pages, result.summary);
    await completeAudit({
      audit,
      pages: result.pages,
      opportunities,
      summary: result.summary,
      partial: result.partial,
      warnings: result.warnings,
    });
    return NextResponse.json(
      {
        ok: true,
        auditId: audit.id,
        pagesScanned: result.pages.length,
        opportunities: opportunities.length,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Website audit failed";
    if (audit) {
      try {
        await failAudit(audit.id, message);
      } catch (writeError) {
        console.error("Could not mark growth audit failed", writeError);
      }
    }
    return NextResponse.json(
      {
        error: `${message}. Confirm the site is publicly reachable and does not block the 8E audit crawler.`,
      },
      { status: 422 }
    );
  }
}
