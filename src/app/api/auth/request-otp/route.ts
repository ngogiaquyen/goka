import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/send-otp-email";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { isPrismaConnectionError } from "@/lib/prisma-error";

const OTP_TTL_MS = 10 * 60 * 1000;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Thiếu email" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`otp:${ip}`, { limit: 5, intervalMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh, thử lại sau." },
      { status: 429 },
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.emailVerified) {
      return NextResponse.json(
        { error: "Email đã được đăng ký và xác thực." },
        { status: 400 },
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const codeHash = await bcrypt.hash(code, 10);

    await prisma.emailOTP.deleteMany({ where: { email } });
    await prisma.emailOTP.create({
      data: { email, codeHash, expiresAt, consumed: false },
    });

    await sendOtpEmail({ email, code });

    return NextResponse.json({
      ok: true,
      expiresAt,
    });
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
