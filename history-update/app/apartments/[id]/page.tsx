import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceHistory } from "@/components/apartments/PriceHistory";
import { addCompetitor, deleteCompetitor, updateApartmentPrice, updateCompetitorPrice } from "@/lib/actions";
import { getApartmentById } from "@/lib/queries";

export default async function ApartmentPage({ params }: { params: Promise<{ id: string }> }) {
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
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900">← Назад ко всем квартирам</Link>
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{apartment.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">{apartment.address}</p>
        </header>

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm text-zinc-500">Наша цена</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{apartment.price > 0 ? `${apartment.price.toLocaleString("ru-RU")} ₽` : "Нет данных"}</p>
            </div>
            <p className="text-right text-sm text-zinc-500">Обновлено: {apartment.updatedAt}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a href={apartment.avitoUrl} target="_blank" rel="noopener noreferrer" className="underline">Наше объявление на Avito</a>
            <a href={apartment.realityCalendarUrl} target="_blank" rel="noopener noreferrer" className="underline">RealityCalendar</a>
          </div>
          <details className="mt-4 border-t border-zinc-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">Добавить цену вручную</summary>
            <form action={updateApartmentPrice.bind(null, apartment.id)} className="mt-3 flex gap-2">
              <input type="number" name="price" placeholder="Новая цена, ₽" required min="1" className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
              <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Сохранить</button>
            </form>
          </details>
        </section>

        <PriceHistory history={apartment.priceHistory ?? []} />

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[['Минимум', minPrice], ['Средняя', avgPrice], ['Максимум', maxPrice]].map(([label, price]) => (
            <div key={String(label)} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">{Number(price) > 0 ? `${Number(price).toLocaleString("ru-RU")} ₽` : "—"}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Конкуренты ({apartment.competitors.length})</h2>
          <div className="mb-4 divide-y divide-zinc-100">
            {apartment.competitors.map((competitor) => (
              <div key={competitor.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-medium">{competitor.name}</p><a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 underline">Ссылка на объявление</a></div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right"><p className="font-semibold">{competitor.price > 0 ? `${competitor.price.toLocaleString("ru-RU")} ₽` : "Нет данных"}</p><p className="text-xs text-zinc-400">{competitor.updatedAt}</p></div>
                  <form action={updateCompetitorPrice.bind(null, apartment.id, competitor.id)} className="flex gap-1"><input type="number" name="price" min="1" required placeholder="Цена" className="w-24 rounded-lg border px-2 py-1 text-xs" /><button className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white">ОК</button></form>
                  <form action={deleteCompetitor.bind(null, apartment.id, competitor.id)}><button className="text-sm text-red-500">Удалить</button></form>
                </div>
              </div>
            ))}
            {apartment.competitors.length === 0 && <p className="py-4 text-sm text-zinc-400">Пока нет добавленных конкурентов</p>}
          </div>
          <form action={addCompetitor.bind(null, apartment.id)} className="flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row">
            <input name="name" placeholder="Название конкурента" required className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <input name="url" placeholder="Ссылка на объявление Avito" required className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">+ Добавить</button>
          </form>
        </section>
      </div>
    </main>
  );
}
