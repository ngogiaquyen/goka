import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/time";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const phone = (session.user as any)?.phone as string | undefined;
  if (!phone) {
    return NextResponse.json(
      { error: "Tài khoản chưa có số điện thoại." },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`share:${ip}`, { limit: 20, intervalMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh, thử lại sau." },
      { status: 429 },
    );
  }

  const today = startOfToday();
  const existing = await prisma.shareLog.findFirst({
    where: { phone, createdAt: { gte: today } },
  });

  if (existing) {
    return NextResponse.json({ ok: true, alreadyRecorded: true });
  }

  await prisma.shareLog.create({
    data: {
      userId: session.user.id as string,
      phone,
      ip,
    },
  });

  return NextResponse.json({ ok: true, bonusAvailable: true });
}
