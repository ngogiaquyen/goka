import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import SignupForm from "./signup-form";

export default async function SignUpPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-amber-100 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">
          Đăng ký Goka Wheel
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Nhập email để nhận mã OTP, xác thực rồi đặt mật khẩu + số điện thoại.
        </p>

        <SignupForm />

        <p className="mt-4 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
