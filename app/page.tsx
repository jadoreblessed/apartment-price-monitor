import Link from "next/link";
import { connection } from "next/server";
import { ApartmentCard } from "@/components/apartments/ApartmentCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getApartmentsForDashboard, getDashboardMonitoringSummary, getDashboardNotifications, getTodayCheckStatus } from "@/lib/queries";

export default async function Home() {
  await connection();
  const user = await requireUser();
  const [apartments, monitoring, notifications, periods] = await Promise.all([
    getApartmentsForDashboard(), getDashboardMonitoringSummary(), getDashboardNotifications(), getTodayCheckStatus(),
  ]);
  const completedToday = periods.reduce((sum, period) => sum + period.completed, 0);
  const expectedToday = periods.reduce((sum, period) => sum + period.total, 0);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
        <AuthHeader user={user} />
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link href="/check" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">Начать проверку</Link>
            <Link href="/apartments/new" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Добавить квартиру</Link>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <a href="/api/reports/export" className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-950">Экспорт Excel</a>
            {user.role === "ADMIN" && <a href="/api/backup" className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-950">Скачать backup</a>}
          </div>
        </section>

        <section className="mt-5 grid gap-2 sm:grid-cols-3">
          {periods.map((period) => {
            const done = period.total > 0 && period.completed >= period.total;
            return <div key={period.id} className="soft-card flex items-center justify-between rounded-xl px-4 py-3"><div><p className="text-sm font-semibold text-slate-900">{period.label}</p><p className="mt-0.5 text-xs text-slate-400">{period.time}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{period.completed}/{period.total}</span></div>;
          })}
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Квартир", apartments.length], ["Проверено сегодня", `${completedToday}/${expectedToday}`], ["Сохранено цен", monitoring.successCount], ["Непрочитано", notifications.unreadCount]].map(([label, value]) => (
            <div key={String(label)} className="soft-card rounded-2xl p-4 sm:p-5"><p className="text-xs font-medium text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></div>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="quiet-label">Портфель</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Квартиры</h2></div>
          </div>
          <div className="grid gap-4">{apartments.map((apartment) => <ApartmentCard key={apartment.id} apartment={apartment} />)}{apartments.length === 0 && <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-12 text-center"><p className="font-semibold text-slate-800">Пока нет квартир</p><p className="mt-1 text-sm text-slate-500">Добавьте первый объект, чтобы начать сравнение цен.</p></div>}</div>
        </section>

        <section className="soft-card mt-8 rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="quiet-label">События</p><h2 className="mt-1 text-lg font-semibold text-slate-950">Изменения цен</h2></div>{notifications.unreadCount > 0 && <form action={markAllNotificationsRead}><button className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Прочитать все</button></form>}</div>
          <div className="mt-4 divide-y divide-slate-100">
            {notifications.items.map((notification) => <div key={notification.id} className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${notification.isRead ? "opacity-55" : ""}`}><div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-emerald-500"}`} /><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{notification.title}</p><span className="text-xs text-slate-400">{notification.createdAtLabel}</span></div><p className="mt-1 text-sm text-slate-600">{notification.message}</p><Link href={`/apartments/${notification.apartmentId}`} className="mt-1 inline-block text-xs font-medium text-slate-500 hover:text-slate-900">{notification.apartmentName} →</Link></div></div>{!notification.isRead && <form action={markNotificationRead.bind(null, notification.id)}><button className="min-h-10 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Прочитано</button></form>}</div>)}
            {notifications.items.length === 0 && <p className="py-7 text-center text-sm text-slate-400">Событий пока нет</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
