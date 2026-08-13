import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PriceHistory } from "@/components/apartments/PriceHistory";
import {
  addCompetitor,
  deleteApartment,
  deleteCompetitor,
  updateApartment,
  updateApartmentPrice,
  updateCompetitorPrice,
} from "@/lib/actions";
import { getApartmentById } from "@/lib/queries";
import { requireUser } from "@/lib/auth";

export default async function ApartmentPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireUser();

  const { id } = await params;
  const apartment = await getApartmentById(id);
  if (!apartment) notFound();

  const competitorPrices = apartment.competitors.map((item) => item.price).filter((price) => price > 0);
  const minPrice = competitorPrices.length ? Math.min(...competitorPrices) : 0;
  const maxPrice = competitorPrices.length ? Math.max(...competitorPrices) : 0;
  const avgPrice = competitorPrices.length
    ? Math.round(competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length)
    : 0;

  return (
    <main className="min-h-screen bg-[#f5f7f4]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/" className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900">← Назад ко всем квартирам</Link>
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">{apartment.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">{apartment.address}</p>
        </header>

        <section className="mb-6 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">Актуализация</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Проверить цены вручную</h2>
              <p className="mt-2 text-sm text-slate-400">
                Цена за сутки на {new Date(`${apartment.monitoringDate}T00:00:00Z`).toLocaleDateString("ru-RU")} · {apartment.stayNights} {apartment.stayNights === 1 ? "ночь" : apartment.stayNights < 5 ? "ночи" : "ночей"}.
              </p>
              <p className="mt-1 text-xs text-slate-500">Объявления откроются в обычном браузере — без Playwright и автоматических запросов.</p>
            </div>
            <Link href={`/apartments/${apartment.id}/check`} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 sm:w-auto">Начать проверку →</Link>
          </div>
        </section>

        <details className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <summary className="cursor-pointer text-sm font-medium text-zinc-700">
            Настройки квартиры
          </summary>
          <form
            action={updateApartment.bind(null, apartment.id)}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="text-sm text-zinc-600">
              Название
              <input name="name" defaultValue={apartment.name} required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="text-sm text-zinc-600">
              Адрес
              <input name="address" defaultValue={apartment.address} required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="text-sm text-zinc-600 sm:col-span-2">
              Ссылка на Avito
              <input name="avitoUrl" type="url" inputMode="url" defaultValue={apartment.avitoUrl} required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="text-sm text-zinc-600 sm:col-span-2">
              Ссылка на RealityCalendar
              <input name="realityCalendarUrl" type="url" inputMode="url" defaultValue={apartment.realityCalendarUrl} required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="text-sm text-zinc-600">
              Дата проверки цены
              <input name="monitoringDate" type="date" defaultValue={apartment.monitoringDate} required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="text-sm text-zinc-600">
              Количество ночей
              <input name="stayNights" type="number" inputMode="numeric" min="1" max="30" defaultValue={apartment.stayNights} required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <p className="text-xs leading-5 text-zinc-500 sm:col-span-2">
              При бронировании на несколько ночей система сохраняет общую стоимость и делит её на число ночей, чтобы сравнивать цену за сутки.
            </p>
            <button className="min-h-11 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white sm:w-fit">
              Сохранить изменения
            </button>
          </form>
          {user.role === "ADMIN" && <div className="mt-6 border-t border-zinc-100 pt-5">
            <p className="mb-3 text-xs text-zinc-500">
              Удаление квартиры также удалит её конкурентов и историю цен.
            </p>
            <form action={deleteApartment.bind(null, apartment.id)}>
              <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                Удалить квартиру
              </button>
            </form>
          </div>}
        </details>

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div>
              <p className="text-sm text-zinc-500">Наша цена</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{apartment.price > 0 ? `${apartment.price.toLocaleString("ru-RU")} ₽` : "Нет данных"}</p>
            </div>
            <div className="text-left text-sm sm:text-right">
              <p className={apartment.isFresh ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
                {apartment.isFresh ? "Цена актуальна" : "Цена требует проверки"}
              </p>
              <p className="mt-1 text-zinc-600">Последняя проверка: {apartment.lastCheckAt}</p>
              {!apartment.isFresh && apartment.price > 0 && <p className="mt-1 text-xs text-zinc-500">Показана последняя известная цена от {apartment.updatedAt}</p>}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
            <a href={apartment.avitoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline decoration-blue-400 underline-offset-4 hover:text-blue-900">Наше объявление на Avito</a>
            <a href={apartment.realityCalendarUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline decoration-blue-400 underline-offset-4 hover:text-blue-900">RealityCalendar</a>
          </div>
          <details className="mt-4 border-t border-zinc-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">Добавить цену вручную</summary>
            <form action={updateApartmentPrice.bind(null, apartment.id)} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input type="number" inputMode="numeric" name="price" placeholder="Новая цена, ₽" required min="1" className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
              <button className="min-h-11 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Сохранить</button>
            </form>
          </details>
        </section>

        <PriceHistory
          history={apartment.priceHistory ?? []}
          apartmentId={apartment.id}
          total={apartment.priceHistoryTotal}
        />

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[['Минимум', minPrice], ['Средняя', avgPrice], ['Максимум', maxPrice]].map(([label, price]) => (
            <div key={String(label)} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">{Number(price) > 0 ? `${Number(price).toLocaleString("ru-RU")} ₽` : "—"}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Конкуренты ({apartment.competitors.length})</h2>
          <div className="mb-4 divide-y divide-zinc-100">
            {apartment.competitors.map((competitor) => (
              <div key={competitor.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="text-sm font-medium">{competitor.name}</p><a href={competitor.url} target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 break-all py-2 text-sm text-zinc-500 underline">Ссылка на объявление</a></div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="text-left sm:text-right"><p className="font-semibold">{competitor.price > 0 ? `${competitor.price.toLocaleString("ru-RU")} ₽` : "Нет данных"}</p><p className={competitor.isFresh ? "text-xs text-emerald-700" : "text-xs text-amber-700"}>{competitor.isFresh ? `Актуально: ${competitor.lastCheckAt}` : `Не обновлено: ${competitor.lastCheckAt}`}</p></div>
                  <form action={updateCompetitorPrice.bind(null, apartment.id, competitor.id)} className="flex gap-2"><input type="number" inputMode="numeric" name="price" min="1" required placeholder="Цена" className="min-h-11 min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm sm:w-28 sm:flex-none" /><button className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">ОК</button></form>
                  <form action={deleteCompetitor.bind(null, apartment.id, competitor.id)}><button className="min-h-11 text-sm text-red-600">Удалить</button></form>
                </div>
              </div>
            ))}
            {apartment.competitors.length === 0 && <p className="py-4 text-sm text-zinc-400">Пока нет добавленных конкурентов</p>}
          </div>
          <form action={addCompetitor.bind(null, apartment.id)} className="flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row">
            <input name="name" placeholder="Название конкурента" required className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <input name="url" type="url" inputMode="url" placeholder="Ссылка на объявление Avito" required className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <button className="min-h-11 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">+ Добавить</button>
          </form>
        </section>
      </div>
    </main>
  );
}
