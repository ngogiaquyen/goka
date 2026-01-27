import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../auth/[...nextauth]/route";

export async function GET() {
  const config = await prisma.shareConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    url: config?.url ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json(
      { error: "Thiếu hoặc sai định dạng URL." },
      { status: 400 },
    );
  }

  const existing = await prisma.shareConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const config = existing
    ? await prisma.shareConfig.update({
        where: { id: existing.id },
        data: { url },
      })
    : await prisma.shareConfig.create({
        data: { url },
      });

  return NextResponse.json({ ok: true, url: config.url });
}

