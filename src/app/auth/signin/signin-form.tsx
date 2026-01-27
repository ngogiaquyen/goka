"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (!errorParam) return;

    let message: string | null = null;
    if (errorParam === "OAuthAccountNotLinked") {
      message =
        "Email này đã được đăng ký bằng phương thức khác. Vui lòng đăng nhập bằng Email/Mật khẩu hoặc liên hệ hỗ trợ để liên kết tài khoản.";
    }

    if (message) {
      setError(message);
      toast.error(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Đăng nhập thành công!");
    window.location.href = "/";
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            window.location.href = "/auth/forgot";
          }}
          className="text-xs font-medium text-orange-600 hover:text-orange-700"
        >
          Quên mật khẩu?
        </button>
        <button
          type="submit"
          disabled={loading}
        className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>Hoặc</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => signIn("facebook")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-medium text-white shadow hover:bg-[#1459b8]"
        >
          Đăng nhập với Facebook
        </button>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow border border-slate-200 hover:bg-slate-50"
        >
          Đăng nhập với Google
        </button>
      </div>
    </div>
  );
}

