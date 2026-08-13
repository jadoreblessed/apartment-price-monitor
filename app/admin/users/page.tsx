import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateUserAccess } from "@/lib/auth-actions";
import { prisma } from "@/lib/db";

export default async function UsersPage() {
  await connection();
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return <main className="min-h-screen bg-zinc-50"><div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
    <Link href="/" className="text-sm font-medium text-zinc-700">← На главную</Link>
    <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">Команда</h1><p className="mt-2 text-sm text-zinc-500">Роли и доступ пользователей</p>
    <div className="mt-6 grid gap-3">{users.map((user) => <form key={user.id} action={updateUserAccess.bind(null, user.id)} className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-4"><p className="font-semibold">{user.name}{user.id === admin.id ? " (вы)" : ""}</p><p className="break-all text-sm text-zinc-500">{user.email}</p></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="text-sm">Роль<select name="role" defaultValue={user.role} disabled={user.id === admin.id} className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3"><option value="MANAGER">Менеджер</option><option value="ADMIN">Администратор</option></select></label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={user.isActive} disabled={user.id === admin.id} className="h-5 w-5" /> Активен</label>
        <button disabled={user.id === admin.id} className="min-h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-300">Сохранить</button>
      </div>
    </form>)}</div>
  </div></main>;
}
