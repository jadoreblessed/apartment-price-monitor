import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { getApartmentsForDashboard, getTodayCheckStatus } from "@/lib/queries";

export default async function CheckHubPage() {
  await connection();
  await requireUser();
  const [apartments, periods] = await Promise.all([
    getApartmentsForDashboard(),
    getTodayCheckStatus(),
  ]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <span aria-hidden="true">←</span> На главную
        </Link>
        <header className="glass-panel mt-7 rounded-[1.6rem] p-5 sm:p-7">
          <span className="quiet-label">Ручная проверка</span>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Актуализируйте цены без скрейпера</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Откройте объявления в обычном браузере, перенесите итоговую стоимость — система сама рассчитает цену за сутки и сохранит историю.
          </p>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          {periods.map((period) => {
            const done = period.total > 0 && period.completed >= period.total;
            return (
              <div key={period.id} className={`rounded-2xl border p-4 ${done ? "border-emerald-200 bg-emerald-50" : "soft-card"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-950">{period.label}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${done ? "bg-emerald-500" : "bg-slate-200"}`} />
                </div>
                <p className="mt-1 text-xs text-slate-500">Ориентир {period.time}</p>
                <p className="mt-3 text-sm font-medium text-slate-700">{period.completed} из {period.total} квартир</p>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-3">
          {apartments.map((apartment, index) => (
            <Link
              key={apartment.id}
              href={`/apartments/${apartment.id}/check`}
              className="soft-card group flex flex-col gap-4 rounded-[1.4rem] p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="font-semibold text-slate-950">{apartment.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{apartment.address || "Адрес не указан"}</p>
                  <p className="mt-2 text-xs text-slate-400">1 своё объявление · {apartment.competitors.length} конкурентов</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-emerald-700">Начать проверку →</span>
            </Link>
          ))}
          {apartments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Сначала добавьте квартиру.</div>
          )}
        </section>
      </div>
    </main>
  );
}
