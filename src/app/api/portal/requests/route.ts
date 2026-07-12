import { NextResponse } from "next/server";
import { requirePortalClient } from "@/lib/portal/auth";
import { addUpdate, createRequest, type RequestPriority } from "@/lib/portal/service";

export async function POST(request: Request) {
  let clientId: string;
  try {
    clientId = await requirePortalClient();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      serviceType?: string;
      brief?: string;
      priority?: string;
      dueDate?: string;
    };

    if (!body.title?.trim() || !body.serviceType?.trim() || !body.brief?.trim()) {
      return NextResponse.json(
        { error: "Title, service type, and brief are required" },
        { status: 400 }
      );
    }

    const priority: RequestPriority = body.priority === "rush" ? "rush" : "standard";

    const created = await createRequest({
      clientId,
      title: body.title.trim(),
      serviceType: body.serviceType.trim(),
      brief: body.brief.trim(),
      priority,
      dueDate: body.dueDate?.trim() || undefined,
    });

    await addUpdate({
      requestId: created.id,
      author: "system",
      body: "Request received. Our team will review it and follow up here.",
    });

    return NextResponse.json({ id: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
