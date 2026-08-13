import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  return <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10"><div className="w-full max-w-md">
    <h1 className="text-3xl font-semibold tracking-tight">Регистрация</h1><p className="mt-2 text-sm text-zinc-500">Первый аккаунт получит роль администратора</p>
    <form action={register} className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="text-sm font-medium">Имя<input name="name" autoComplete="name" minLength={2} required className="mt-1 min-h-12 w-full rounded-xl border border-zinc-300 px-3" /></label>
      <label className="text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className="mt-1 min-h-12 w-full rounded-xl border border-zinc-300 px-3" /></label>
      <label className="text-sm font-medium">Пароль<input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-1 min-h-12 w-full rounded-xl border border-zinc-300 px-3" /><span className="mt-1 block text-xs font-normal text-zinc-500">Минимум 8 символов, буквы и цифры</span></label>
      <button className="min-h-12 rounded-xl bg-zinc-900 font-medium text-white">Создать аккаунт</button>
    </form>
    <p className="mt-5 text-center text-sm text-zinc-600">Уже зарегистрированы? <Link href="/login" className="font-semibold text-zinc-900 underline">Войти</Link></p>
  </div></main>;
}
