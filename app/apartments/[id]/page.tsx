import Link from "next/link";
import { notFound } from "next/navigation";
import { getApartmentById } from "@/lib/queries";
import { addCompetitor, deleteCompetitor, updateApartmentPrice, updateCompetitorPrice } from "@/lib/actions";
export default async function ApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const apartment = await getApartmentById(id);

  if (!apartment) {
    notFound();
  }

  const prices = apartment.competitors.map((c) => c.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
      : 0;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Назад ко всем квартирам
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {apartment.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{apartment.address}</p>
        </header>

        {/* Наша квартира */}
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Наша цена</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {apartment.price > 0
                  ? `${apartment.price.toLocaleString("ru-RU")} ₽`
                  : "Нет данных"}
              </p>
            </div>

            <div className="text-right text-sm text-zinc-500">
              Обновлено: {apartment.updatedAt}
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            
              <a href={apartment.avitoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 underline hover:text-zinc-600"
            >
              Наше объявление на Avito
            </a>
            
              <a href={apartment.realityCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 underline hover:text-zinc-600"
            >
              RealityCalendar
            </a>
          </div>
           <details className="mt-4 border-t border-zinc-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Изменить цену вручную
            </summary>
            <form
              action={updateApartmentPrice.bind(null, apartment.id)}
              className="mt-3 flex gap-2"
            >
              <input
                type="number"
                name="price"
                placeholder="Новая цена, ₽"
                required
                min="1"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Сохранить
              </button>
            </form>
          </details>
        </section>

        {/* Аналитика */}
        <section className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Минимум</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {minPrice.toLocaleString("ru-RU")} ₽
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Средняя</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {avgPrice.toLocaleString("ru-RU")} ₽
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Максимум</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {maxPrice.toLocaleString("ru-RU")} ₽
            </p>
          </div>
        </section>

        {/* Конкуренты */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Конкуренты ({apartment.competitors.length})
          </h2>

          <div className="mb-4 divide-y divide-zinc-100">
            {apartment.competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {competitor.name}
                  </p>
                  
                    <a href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 underline hover:text-zinc-700"
                  >
                    Ссылка на объявление
                  </a>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-base font-semibold text-zinc-900">
                      {competitor.price > 0
                        ? `${competitor.price.toLocaleString("ru-RU")} ₽`
                        : "Нет данных"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {competitor.updatedAt}
                    </p>
                  </div>

                  <details>
                    <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900 list-none">
                      ✏️
                    </summary>
                    <form
                      action={updateCompetitorPrice.bind(null, apartment.id, competitor.id)}
                      className="mt-2 flex gap-1"
                    >
                      <input
                        type="number"
                        name="price"
                        placeholder="Цена, ₽"
                        required
                        min="1"
                        className="w-24 rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-400"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800"
                      >
                        ОК
                      </button>
                    </form>
                  </details>

                  <form
                    action={deleteCompetitor.bind(null, apartment.id, competitor.id)}
                  >
                    <button
                      type="submit"
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {apartment.competitors.length === 0 && (
              <p className="py-4 text-sm text-zinc-400">
                Пока нет добавленных конкурентов
              </p>
            )}
          </div>

          <form
            action={addCompetitor.bind(null, apartment.id)}
            className="flex gap-2 border-t border-zinc-100 pt-4"
          >
            <input
              name="name"
              placeholder="Название конкурента"
              required
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <input
              name="url"
              placeholder="Ссылка на объявление Avito"
              required
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 whitespace-nowrap"
            >
              + Добавить
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}