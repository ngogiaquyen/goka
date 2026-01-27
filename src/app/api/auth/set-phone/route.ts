import { NextRequest, NextResponse } from "next/server";
import { auth } from "../[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { isPrismaConnectionError } from "@/lib/prisma-error";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const phone = (body?.phone as string | undefined)?.trim();

  if (!phone) {
    return NextResponse.json({ error: "Thiếu số điện thoại." }, { status: 400 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`set-phone:${ip}`, { limit: 15, intervalMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh, thử lại sau." },
      { status: 429 },
    );
  }

  try {
    const phoneTaken = await prisma.user.findFirst({
      where: { phone, NOT: { id: session.user.id as string } },
    });

    if (phoneTaken) {
      return NextResponse.json(
        { error: "Số điện thoại đã được sử dụng." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { phone },
    });

    return NextResponse.json({ ok: true, phone });
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
