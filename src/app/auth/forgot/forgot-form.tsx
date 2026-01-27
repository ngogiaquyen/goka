"use client";

import { useState } from "react";
import { toast } from "sonner";

type Step = "email" | "reset";

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestReset() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error || "Không thể gửi OTP đặt lại mật khẩu.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setMessage(
      "Nếu email tồn tại và đã được xác thực, mã OTP đặt lại mật khẩu đã được gửi.",
    );
    toast.success("Đã gửi yêu cầu đặt lại mật khẩu (nếu email hợp lệ).");
    setStep("reset");
  }

  async function resetPassword() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error || "Không thể đặt lại mật khẩu.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setMessage("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.");
    toast.success("Đặt lại mật khẩu thành công.");
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
            onClick={requestReset}
            disabled={loading || !email}
            className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP đặt lại mật khẩu"}
          </button>
        </div>
      )}

      {step === "reset" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Mã OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
              placeholder="6 số được gửi tới email"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          <button
            type="button"
            onClick={resetPassword}
            disabled={loading || otp.length !== 6 || password.length < 6}
            className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
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
    </div>
  );
}

