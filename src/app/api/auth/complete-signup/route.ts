import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { isPrismaConnectionError } from "@/lib/prisma-error";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const password = body?.password as string | undefined;
  const phone = (body?.phone as string | undefined)?.trim();
  const name = (body?.name as string | undefined)?.trim() || null;

  if (!email || !password || !phone) {
    return NextResponse.json(
      { error: "Thiếu email, mật khẩu hoặc số điện thoại." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Mật khẩu cần ít nhất 6 ký tự." },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`complete:${ip}`, { limit: 10, intervalMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh, thử lại sau." },
      { status: 429 },
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified) {
      return NextResponse.json(
        { error: "Email chưa được xác thực bằng OTP." },
        { status: 400 },
      );
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { error: "Tài khoản đã được thiết lập mật khẩu." },
        { status: 400 },
      );
    }

    const phoneTaken = await prisma.user.findFirst({
      where: { phone, NOT: { email: email } },
    });

    if (phoneTaken) {
      return NextResponse.json(
        { error: "Số điện thoại đã được sử dụng." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash, phone, name },
    });

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
