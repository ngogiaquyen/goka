import { NextRequest, NextResponse } from "next/server";
import { auth } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/time";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

const MAX_FREE_PER_DAY = 1;
const MAX_BONUS_PER_DAY = 1;

function buildActiveVoucherWhere(now: Date) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startAt: null }, { startAt: { lte: now } }] },
      { OR: [{ endAt: null }, { endAt: { gte: now } }] },
    ],
  };
}

async function getAvailableVouchers(today: Date) {
  const now = new Date();
  const active = await prisma.voucher.findMany({
    where: buildActiveVoucherWhere(now),
    orderBy: { createdAt: "asc" },
  });

  const vouchersWithCounts = await Promise.all(
    active.map(async (voucher: (typeof active)[number]) => {
      const [dailyCount, totalCount] = await prisma.$transaction([
        prisma.spin.count({
          where: { voucherId: voucher.id, createdAt: { gte: today } },
        }),
        prisma.spin.count({ where: { voucherId: voucher.id } }),
      ]);

      const withinDaily =
        voucher.dailyLimit == null || dailyCount < voucher.dailyLimit;
      const withinTotal =
        voucher.totalLimit == null || totalCount < voucher.totalLimit;

      return { voucher, available: withinDaily && withinTotal };
    }),
  );

  return vouchersWithCounts.filter((v) => v.available).map((v) => v.voucher);
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const phone = (session?.user as any)?.phone as string | undefined;
  const today = startOfToday();
  const activeVouchers = await getAvailableVouchers(today);

  const counts =
    phone && session?.user?.id
      ? await prisma.$transaction([
          prisma.spin.count({
            where: { phone, type: "FREE", createdAt: { gte: today } },
          }),
          prisma.spin.count({
            where: { phone, type: "BONUS", createdAt: { gte: today } },
          }),
          prisma.shareLog.findFirst({
            where: { phone, createdAt: { gte: today } },
          }),
        ])
      : [0, 0, null];

  const [freeCount, bonusCount, shareLog] = counts as [
    number,
    number,
    unknown,
  ];

  return NextResponse.json({
    vouchers: activeVouchers.map((v) => ({
      id: v.id,
      name: v.name,
      code: v.code,
      description: v.description,
    })),
    remaining: {
      free: Math.max(0, MAX_FREE_PER_DAY - freeCount),
      bonus: Math.max(0, MAX_BONUS_PER_DAY - bonusCount),
    },
    shareRecordedToday: Boolean(shareLog),
    requiresLogin: !session?.user,
  });
}

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
  const rl = rateLimit(`spin:${ip}`, { limit: 30, intervalMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh, thử lại sau." },
      { status: 429 },
    );
  }

  const today = startOfToday();
  const [freeCount, bonusCount, shareLog] = await prisma.$transaction([
    prisma.spin.count({
      where: { phone, type: "FREE", createdAt: { gte: today } },
    }),
    prisma.spin.count({
      where: { phone, type: "BONUS", createdAt: { gte: today } },
    }),
    prisma.shareLog.findFirst({
      where: { phone, createdAt: { gte: today } },
    }),
  ]);

  let spinType: "FREE" | "BONUS" | null = null;
  if (freeCount < MAX_FREE_PER_DAY) {
    spinType = "FREE";
  } else if (shareLog && bonusCount < MAX_BONUS_PER_DAY) {
    spinType = "BONUS";
  }

  if (!spinType) {
    return NextResponse.json(
      { error: "Bạn đã dùng hết lượt quay hôm nay." },
      { status: 400 },
    );
  }

  const vouchers = await getAvailableVouchers(today);
  if (!vouchers.length) {
    return NextResponse.json(
      { error: "Hết phần thưởng khả dụng, thử lại sau." },
      { status: 400 },
    );
  }

  const selected = pickRandom(vouchers);

  const [spin] = await prisma.$transaction([
    prisma.spin.create({
      data: {
        userId: session.user.id as string,
        phone,
        voucherId: selected.id,
        result: selected.name,
        ip,
        type: spinType,
      },
    }),
    prisma.voucher.update({
      where: { id: selected.id },
      data: { usedCount: { increment: 1 } },
    }),
  ]);

  const remainingFree =
    spinType === "FREE"
      ? Math.max(0, MAX_FREE_PER_DAY - (freeCount + 1))
      : Math.max(0, MAX_FREE_PER_DAY - freeCount);

  const remainingBonus =
    spinType === "BONUS"
      ? Math.max(0, MAX_BONUS_PER_DAY - (bonusCount + 1))
      : Math.max(0, MAX_BONUS_PER_DAY - bonusCount);

  return NextResponse.json({
    ok: true,
    result: spin.result,
    voucherId: selected.id,
    voucherName: selected.name,
    voucherCode: selected.code,
    type: spin.type,
    remaining: {
      free: remainingFree,
      bonus: remainingBonus,
    },
  });
}
