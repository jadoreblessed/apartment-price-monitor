import Link from "next/link";
import { logout } from "@/lib/auth-actions";
import type { CurrentUser } from "@/lib/auth";

export function AuthHeader({ user }: { user: CurrentUser }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold tracking-tight text-white">PM</span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-slate-950">Price Monitor</p>
          <p className="text-xs text-slate-500">Посуточная аренда</p>
        </div>
      </Link>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-3 shadow-sm">
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-[11px] text-slate-500">{user.role === "ADMIN" ? "Администратор" : "Менеджер"}</p>
        </div>
        {user.role === "ADMIN" && <Link href="/admin/users" className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Команда</Link>}
        <form action={logout}>
          <button className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700">Выйти</button>
        </form>
      </div>
    </div>
  );
}
