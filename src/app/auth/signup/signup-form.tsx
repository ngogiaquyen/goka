"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
type Step = "email" | "verify" | "credentials";

export default function SignupForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phonePattern = /^(\+84|84|0)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$/;

  async function requestOtp() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Không thể gửi OTP.";
      setError(message);
      toast.error(message);
      return;
    }
    setMessage("Đã gửi mã OTP. Kiểm tra hộp thư của bạn.");
    toast.success("Đã gửi mã OTP. Kiểm tra hộp thư của bạn.");
    setStep("verify");
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "OTP không hợp lệ.";
      setError(message);
      toast.error(message);
      return;
    }
    setMessage("Xác thực thành công. Đặt mật khẩu và số điện thoại.");
    toast.success("Xác thực email thành công.");
    setStep("credentials");
  }

  async function completeSignup() {
    if (!phonePattern.test(phone)) {
      const message = "Số điện thoại không hợp lệ.";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/complete-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, phone, name }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Không thể hoàn tất đăng ký.";
      setError(message);
      toast.error(message);
      return;
    }

    setMessage("Đăng ký thành công, đang đăng nhập...");
    toast.success("Đăng ký thành công, đang đăng nhập...");
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/",
    });
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {step === "email" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="button"
            onClick={requestOtp}
            disabled={loading || !email}
            className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Nhập mã OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
              placeholder="6 số"
            />
          </div>
          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Đang kiểm tra..." : "Xác thực OTP"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-center text-xs font-medium text-orange-600"
          >
            Nhập lại email
          </button>
        </div>
      )}

      {step === "credentials" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Họ tên (tuỳ chọn)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
              placeholder="Tên hiển thị"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
              placeholder="0xxxxxxxxx"
            />
            <p className="text-xs text-slate-500">
              Mỗi số điện thoại chỉ có tối đa 1 lượt FREE/ngày + 1 BONUS sau chia sẻ.
            </p>
          </div>
          <button
            type="button"
            onClick={completeSignup}
            disabled={loading || !password || !phone}
            className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Đang hoàn tất..." : "Hoàn tất đăng ký"}
          </button>
        </div>
      )}
    </div>
  );
}
