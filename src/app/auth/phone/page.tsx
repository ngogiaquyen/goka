import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import PhoneForm from "./phone-form";

export default async function PhonePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if ((session.user as any).phone) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-amber-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">
          Thêm số điện thoại
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Bạn cần bổ sung số điện thoại để kiểm soát lượt quay mỗi ngày.
        </p>
        <PhoneForm />
      </div>
    </main>
  );
}
