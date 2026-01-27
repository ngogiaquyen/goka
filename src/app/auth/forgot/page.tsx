import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import ForgotPasswordForm from "./forgot-form";

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-amber-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">
          Quên mật khẩu
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Nhập email để nhận mã OTP, sau đó dùng mã để đặt lại mật khẩu mới.
        </p>

        <ForgotPasswordForm />

        <p className="mt-4 text-center text-sm text-slate-500">
          Nhớ mật khẩu rồi?{" "}
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

