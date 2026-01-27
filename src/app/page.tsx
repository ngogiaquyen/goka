import Link from "next/link";
import { redirect } from "next/navigation";
import WheelSection from "@/components/spin/wheel-section";
import { auth } from "./api/auth/[...nextauth]/route";
import { UserMenu } from "@/components/auth/user-menu";

export default async function Home() {
  const session = await auth();
  const user = session?.user as { name?: string | null; phone?: string | null } | undefined;

  if (user && !user.phone) {
    redirect("/auth/phone");
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 to-amber-100 px-4 py-6">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
            Goka Wheel
          </span>
          <span className="text-sm font-medium text-slate-700">
            Quay mỗi ngày – Nhận quà liền tay
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-orange-600"
            >
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto mt-6 flex w-full max-w-4xl flex-1 flex-col gap-6">
        <WheelSection isAuthenticated={Boolean(user)} />

        <aside className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Cách tham gia
          </h2>
          <ol className="space-y-2 text-xs text-slate-600">
            <li>1. Đăng nhập bằng Email, Facebook hoặc Google.</li>
            <li>2. Xác thực email (với tài khoản Email/Mật khẩu).</li>
            <li>3. Nhập số điện thoại để bắt đầu quay.</li>
            <li>4. Quay 1 lần miễn phí mỗi ngày.</li>
            <li>5. Hết lượt? Chia sẻ bài viết Goka để quay thêm 1 lần.</li>
          </ol>
          <p className="mt-4 rounded-lg bg-orange-50 p-3 text-xs text-orange-700">
            Mọi kết quả quay sẽ được lưu lại theo số điện thoại và IP để tránh gian lận.
          </p>
        </aside>
      </section>
    </main>
  );
}
