"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
const Wheel = dynamic(
  () => import("react-custom-roulette").then((m) => m.Wheel),
  { ssr: false },
);

type VoucherSegment = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
};

type HistoryItem = {
  id: string;
  result: string | null;
  voucherName: string | null;
  voucherCode: string | null;
  type: string;
  createdAt: string;
};

interface WheelSectionProps {
  isAuthenticated: boolean;
}

export default function WheelSection({ isAuthenticated }: WheelSectionProps) {
  const [segments, setSegments] = useState<VoucherSegment[]>([]);
  const [mustStartSpinning, setMustStartSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loadingSpin, setLoadingSpin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState({ free: 0, bonus: 0 });
  const [shareRecorded, setShareRecorded] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const totalRemaining = remaining.free + remaining.bonus;

  const wheelData = useMemo(() => {
    if (!segments.length) {
      return [{ option: "Đăng nhập để quay" }];
    }
    return segments.map((item) => ({ option: item.name || "Voucher" }));
  }, [segments]);

  const disableSpin =
    !isAuthenticated || loadingSpin || segments.length === 0 || (!remaining.free && !remaining.bonus);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadStatus();
    void loadHistory();
    void loadShareConfig();
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.getElementById("facebook-jssdk");
    if (existing) return;

    (window as any).fbAsyncInit = function fbAsyncInit() {
      const appId =
        process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ??
        process.env.NEXT_PUBLIC_FACEBOOK_APPID;
      if (!appId) {
        return;
      }
      (window as any).FB.init({
        appId,
        xfbml: false,
        version: "v19.0",
      });
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/vi_VN/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  async function loadStatus() {
    setError(null);
    const res = await fetch("/api/spin", { cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Không thể tải dữ liệu vòng quay.";
      setError(message);
      toast.error(message);
      return;
    }
    const data = await res.json();
    setSegments(data.vouchers ?? []);
    setRemaining(data.remaining ?? { free: 0, bonus: 0 });
    setShareRecorded(Boolean(data.shareRecordedToday));
  }

  async function loadShareConfig() {
    try {
      const res = await fetch("/api/share-config", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.url && typeof data.url === "string") {
        setShareUrl(data.url);
      }
    } catch {
      // ignore – sẽ fallback sang NEXT_PUBLIC_SHARE_URL
    }
  }

  async function loadHistory() {
    const res = await fetch("/api/spin/history", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setHistory(data.items ?? []);
  }

  async function handleSpin() {
    if (disableSpin) return;
    setError(null);
    setResult(null);
    setCode(null);
    setLoadingSpin(true);

    const res = await fetch("/api/spin", { method: "POST" });
    setLoadingSpin(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Không thể quay lúc này.";
      setError(message);
      toast.error(message);
      return;
    }

    const data = await res.json();
    const idx = segments.findIndex((s) => s.id === data.voucherId);
    setPrizeNumber(Math.max(0, idx));
    setResult(data.voucherName ?? data.result ?? null);
    setCode(data.voucherCode ?? null);
    setRemaining(data.remaining ?? { free: 0, bonus: 0 });
    setMustStartSpinning(true);
    void loadHistory();
  }

  async function handleShareSuccess() {
    setError(null);
    const res = await fetch("/api/spin/share-callback", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Không ghi nhận được chia sẻ.";
      setError(message);
      toast.error(message);
      return;
    }
    setShareRecorded(true);
    toast.success("Đã ghi nhận chia sẻ. Bạn đã mở khoá 1 lượt BONUS hôm nay.");
    await loadStatus();
  }

  function handleFbUiResponse(response: unknown) {
    // Bọc async logic để không truyền async function trực tiếp vào FB.ui
    void (async () => {
      setSharing(false);

      const r = response as { error_code?: unknown } | null;
      if (!r || (r as any).error_code) {
        toast.error("Chia sẻ không thành công hoặc đã bị huỷ.");
        return;
      }

      await handleShareSuccess();
    })();
  }

  async function handleShareClick() {
    setError(null);

    if (typeof window === "undefined") return;

    const urlToShare =
      shareUrl ?? process.env.NEXT_PUBLIC_SHARE_URL ?? window.location.origin;

    setSharing(true);
    const FB = (window as any).FB;

    if (FB && typeof FB.ui === "function") {
      FB.ui(
        {
          method: "share",
          href: urlToShare,
        },
        handleFbUiResponse,
      );
    } else {
      // Fallback: mở sharer URL trong tab mới, sau đó vẫn ghi nhận chia sẻ
      try {
        const sharer = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          urlToShare,
        )}`;
        window.open(sharer, "_blank", "noopener,noreferrer");
      } catch {
        // ignore
      } finally {
        setSharing(false);
        await handleShareSuccess();
      }
    }
  }

  function handleStop() {
    setMustStartSpinning(false);

    if (result) {
      toast.success(
        code
          ? `Bạn trúng: ${result} – Mã: ${code}`
          : `Bạn trúng: ${result}`,
      );
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Vòng quay may mắn</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tổng lượt còn lại: {totalRemaining}</span>
          </div>
        </div>
        {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-col items-center gap-4 md:flex-row">
          <div className="flex flex-1 flex-col items-center gap-4">
            <div className="w-full max-w-[360px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <Wheel
                mustStartSpinning={mustStartSpinning}
                prizeNumber={prizeNumber}
                data={wheelData}
                onStopSpinning={handleStop}
                backgroundColors={["#0ea5e9", "#22d3ee", "#fbbf24", "#f472b6", "#a78bfa", "#38bdf8"]}
                textColors={["#ffffff"]}
                fontSize={14}
              />
            </div>
            <button
              onClick={handleSpin}
              disabled={disableSpin}
              className="w-full max-w-xs rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loadingSpin ? "Đang quay..." : "Quay ngay"}
            </button>
            {isAuthenticated && !shareRecorded && (
              <button
                type="button"
                onClick={handleShareClick}
                disabled={sharing}
                className="text-xs font-medium text-emerald-600 underline"
              >
                Chia sẻ bài viết Goka trên Facebook để nhận 1 lượt BONUS
              </button>
            )}
            {result && (
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <p className="text-sm text-slate-500">Kết quả</p>
                <p className="text-lg font-semibold text-slate-900">{result}</p>
                {code && (
                  <p className="mt-1 text-sm font-mono text-emerald-600">
                    Mã voucher: <span className="font-semibold">{code}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Lịch sử quay</h3>
        {!history.length ? (
          <p className="mt-2 text-sm text-slate-500">Chưa có lượt quay nào.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{item.type}</span>
                  <span>{new Date(item.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {item.voucherName || item.result}
                </div>
                {item.voucherCode && (
                  <div className="text-xs font-mono text-emerald-600">Mã: {item.voucherCode}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
