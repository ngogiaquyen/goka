import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function toggleVoucherActive(formData: FormData) {
  "use server";

  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return;

  const id = formData.get("id") as string | null;
  const isActive = formData.get("isActive") === "true";

  if (!id) return;

  await prisma.voucher.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin");
}

async function createVoucher(formData: FormData) {
  "use server";

  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return;

  const name = (formData.get("name") as string | null)?.trim();
  const code = (formData.get("code") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const dailyLimitStr = (formData.get("dailyLimit") as string | null)?.trim();
  const totalLimitStr = (formData.get("totalLimit") as string | null)?.trim();
  const startAtStr = (formData.get("startAt") as string | null)?.trim();
  const endAtStr = (formData.get("endAt") as string | null)?.trim();

  if (!name || !code) return;

  const dailyLimit =
    dailyLimitStr && !Number.isNaN(Number(dailyLimitStr))
      ? Number(dailyLimitStr)
      : null;
  const totalLimit =
    totalLimitStr && !Number.isNaN(Number(totalLimitStr))
      ? Number(totalLimitStr)
      : null;

  const startAt = startAtStr ? new Date(startAtStr) : null;
  const endAt = endAtStr ? new Date(endAtStr) : null;

  await prisma.voucher.create({
    data: {
      name,
      code,
      description: description || null,
      dailyLimit,
      totalLimit,
      startAt,
      endAt,
      isActive: true,
    },
  });

  revalidatePath("/admin");
}

async function updateVoucher(formData: FormData) {
  "use server";

  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return;

  const id = formData.get("id") as string | null;
  if (!id) return;

  const name = (formData.get("name") as string | null)?.trim();
  const code = (formData.get("code") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const dailyLimitStr = (formData.get("dailyLimit") as string | null)?.trim();
  const totalLimitStr = (formData.get("totalLimit") as string | null)?.trim();
  const startAtStr = (formData.get("startAt") as string | null)?.trim();
  const endAtStr = (formData.get("endAt") as string | null)?.trim();

  const dailyLimit =
    dailyLimitStr && !Number.isNaN(Number(dailyLimitStr))
      ? Number(dailyLimitStr)
      : null;
  const totalLimit =
    totalLimitStr && !Number.isNaN(Number(totalLimitStr))
      ? Number(totalLimitStr)
      : null;

  const startAt = startAtStr ? new Date(startAtStr) : null;
  const endAt = endAtStr ? new Date(endAtStr) : null;

  await prisma.voucher.update({
    where: { id },
    data: {
      name: name || undefined,
      code: code || undefined,
      description: description || null,
      dailyLimit,
      totalLimit,
      startAt,
      endAt,
    },
  });

  revalidatePath("/admin");
}

async function deleteVoucher(formData: FormData) {
  "use server";

  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return;

  const id = formData.get("id") as string | null;
  if (!id) return;

  await prisma.voucher.delete({
    where: { id },
  });

  revalidatePath("/admin");
}

async function updateShareLink(formData: FormData) {
  "use server";

  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return;

  const url = (formData.get("shareUrl") as string | null)?.trim();
  if (!url) return;

  const existing = await prisma.shareConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.shareConfig.update({
      where: { id: existing.id },
      data: { url },
    });
  } else {
    await prisma.shareConfig.create({
      data: { url },
    });
  }

  revalidatePath("/admin");
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if ((session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const [users, vouchers, shareConfig] = await Promise.all([
    prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
    }),
    prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.shareConfig.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">
            Admin – Quản trị hệ thống
          </h1>
          <p className="mb-2 text-sm text-slate-500">
            Chỉ tài khoản có quyền ADMIN mới truy cập được trang này.
          </p>
          <p className="text-xs text-slate-400">
            Tại đây bạn có thể xem danh sách người dùng, cấu hình voucher, giới hạn theo
            ngày/giờ.
          </p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Người dùng
          </h2>
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Email
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Tên
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Số điện thoại
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Role
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Đã xác thực email
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                    {u.email ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {u.name ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {u.phone ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {u.emailVerified ? "Có" : "Chưa"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                    {u.createdAt.toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Cấu hình link bài viết chia sẻ Facebook
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Link này sẽ được dùng khi người dùng bấm nút &quot;Chia sẻ bài viết Goka trên Facebook&quot;
            trên trang vòng quay.
          </p>
          <form action={updateShareLink} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                URL bài viết Facebook hoặc landing page *
              </label>
              <input
                name="shareUrl"
                defaultValue={shareConfig?.url ?? ""}
                placeholder="https://www.facebook.com/ten-page/posts/1234567890"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-700 md:mt-0"
            >
              Lưu link chia sẻ
            </button>
          </form>
          {shareConfig?.url && (
            <p className="mt-2 text-xs text-slate-500">
              Link hiện tại:&nbsp;
              <a
                href={shareConfig.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-600 underline"
              >
                {shareConfig.url}
              </a>
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Voucher & lịch theo ngày/giờ
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Mỗi voucher có thể giới hạn theo ngày (dailyLimit), tổng lượt (totalLimit) và
            thời gian hiệu lực (startAt / endAt). Vòng quay chỉ chọn trong các voucher đang
            hoạt động (isActive=true và trong khoảng thời gian).
          </p>

          <div className="mb-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Thêm voucher mới
            </h3>
            <form action={createVoucher} className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700">
                  Tên voucher *
                </label>
                <input
                  name="name"
                  required
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Ví dụ: Giảm 10% đơn hàng"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700">
                  Mã voucher *
                </label>
                <input
                  name="code"
                  required
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="GOKA10"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Mô tả điều kiện sử dụng, nội dung khuyến mại..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700">
                  Giới hạn/ngày
                </label>
                <input
                  name="dailyLimit"
                  type="number"
                  min={0}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Không nhập = không giới hạn"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700">
                  Giới hạn tổng
                </label>
                <input
                  name="totalLimit"
                  type="number"
                  min={0}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Không nhập = không giới hạn"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700">
                  Bắt đầu từ
                </label>
                <input
                  name="startAt"
                  type="datetime-local"
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700">
                  Kết thúc lúc
                </label>
                <input
                  name="endAt"
                  type="datetime-local"
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="mt-1 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-orange-600"
                >
                  Tạo voucher
                </button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Tên
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Mã voucher
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Thời gian hiệu lực
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Giới hạn/ngày
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Giới hạn tổng
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Đã dùng
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Sửa / Xóa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                      {v.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-700">
                      {v.code}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                      <div>
                        {v.startAt
                          ? new Date(v.startAt).toLocaleString("vi-VN")
                          : "Từ lúc tạo"}
                      </div>
                      <div>
                        {v.endAt
                          ? new Date(v.endAt).toLocaleString("vi-VN")
                          : "Không giới hạn"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {v.dailyLimit ?? "∞"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {v.totalLimit ?? "∞"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {v.usedCount}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <form action={toggleVoucherActive} className="inline-flex items-center gap-2">
                        <input type="hidden" name="id" value={v.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={v.isActive ? "false" : "true"}
                        />
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {v.isActive ? "Đang bật" : "Đang tắt"}
                        </span>
                        <button
                          type="submit"
                          className="text-xs font-medium text-orange-600 hover:text-orange-700"
                        >
                          {v.isActive ? "Tắt" : "Bật"}
                        </button>
                      </form>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700">
                      <form action={updateVoucher} className="mb-1 flex flex-col gap-1">
                        <input type="hidden" name="id" value={v.id} />
                        <input
                          name="name"
                          defaultValue={v.name}
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          placeholder="Tên"
                        />
                        <input
                          name="code"
                          defaultValue={v.code}
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          placeholder="Mã"
                        />
                        <textarea
                          name="description"
                          defaultValue={v.description ?? ""}
                          rows={2}
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          placeholder="Mô tả"
                        />
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            name="dailyLimit"
                            type="number"
                            min={0}
                            defaultValue={v.dailyLimit ?? ""}
                            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="Limit/ngày"
                          />
                          <input
                            name="totalLimit"
                            type="number"
                            min={0}
                            defaultValue={v.totalLimit ?? ""}
                            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="Limit tổng"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            name="startAt"
                            type="datetime-local"
                            defaultValue={
                              v.startAt
                                ? new Date(v.startAt).toISOString().slice(0, 16)
                                : ""
                            }
                            className="rounded-md border border-slate-200 px-2 py-0.5 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                          <input
                            name="endAt"
                            type="datetime-local"
                            defaultValue={
                              v.endAt
                                ? new Date(v.endAt).toISOString().slice(0, 16)
                                : ""
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="mt-1 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          Lưu
                        </button>
                      </form>
                      <form action={deleteVoucher}>
                        <input type="hidden" name="id" value={v.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-red-50 px-3 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                        >
                          Xóa
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

