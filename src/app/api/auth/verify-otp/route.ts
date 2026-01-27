import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { isPrismaConnectionError } from "@/lib/prisma-error";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const code = (body?.code as string | undefined)?.trim();

  if (!email || !code) {
    return NextResponse.json(
      { error: "Thiếu email hoặc mã OTP." },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`verify-otp:${ip}`, { limit: 10, intervalMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh, thử lại sau." },
      { status: 429 },
    );
  }

  try {
    const now = new Date();
    const otp = await prisma.emailOTP.findFirst({
      where: {
        email,
        consumed: false,
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Mã OTP không hợp lệ hoặc đã hết hạn." },
        { status: 400 },
      );
    }

    const match = await bcrypt.compare(code, otp.codeHash);
    if (!match) {
      return NextResponse.json({ error: "Mã OTP không đúng." }, { status: 400 });
    }

    const verifiedAt = new Date();

    await prisma.$transaction([
      prisma.emailOTP.update({
        where: { id: otp.id },
        data: { consumed: true },
      }),
      prisma.user.upsert({
        where: { email },
        update: { emailVerified: verifiedAt },
        create: { email, emailVerified: verifiedAt },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isPrismaConnectionError(err)) {
      return NextResponse.json(
        {
          error:
            "Không thể kết nối cơ sở dữ liệu. Vui lòng kiểm tra DATABASE_URL trong file .env.",
        },
        { status: 503 },
      );
    }

    throw err;
  }
}
