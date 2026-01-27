"use client";

import { useState } from "react";
import { toast } from "sonner";
export default function PhoneForm() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const phonePattern = /^(\+84|84|0)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!phonePattern.test(phone)) {
      const message = "Số điện thoại không hợp lệ.";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/set-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Không thể lưu số điện thoại.";
      setError(message);
      toast.error(message);
      return;
    }

    setMessage("Đã lưu số điện thoại. Đang chuyển hướng...");
    toast.success("Đã lưu số điện thoại. Đang chuyển hướng...");
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      )}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          Số điện thoại
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:border-sky-400 focus:ring-2"
          placeholder="0xxxxxxxxx"
        />
        <p className="text-xs text-slate-500">
          Mỗi số điện thoại là 1 lượt FREE/ngày và thêm 1 BONUS khi chia sẻ Facebook.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? "Đang lưu..." : "Lưu số điện thoại"}
      </button>
    </form>
  );
}
