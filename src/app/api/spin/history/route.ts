import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

  const history = await prisma.spin.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      voucher: {
        select: { name: true, code: true },
      },
    },
  });

  return NextResponse.json({
    items: history.map((item: (typeof history)[number]) => ({
      id: item.id,
      result: item.result,
      type: item.type,
      voucherName: item.voucher?.name ?? item.result,
      voucherCode: item.voucher?.code ?? null,
      createdAt: item.createdAt,
    })),
  });
}
