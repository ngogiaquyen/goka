"use client";

import { signOut } from "next-auth/react";

type UserMenuProps = {
  user: {
    name?: string | null;
    phone?: string | null;
  };
};

export function UserMenu({ user }: UserMenuProps) {
  return (
    <>
      <div className="text-right text-xs text-slate-500">
        <div className="font-semibold text-slate-700">
          {user.name ?? "Người dùng Goka"}
        </div>
        {user.phone && <div>SĐT: {user.phone}</div>}
      </div>
      <button
        type="button"
        onClick={() =>
          signOut({
            callbackUrl: "/auth/signin",
          })
        }
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Đăng xuất
      </button>
    </>
  );
}

