import Link from "next/link";
import { createApartment } from "@/lib/actions";

export default function NewApartmentPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-xl px-6 py-10">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Назад ко всем квартирам
        </Link>

        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Добавить квартиру
        </h1>

        <form
          action={createApartment}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6"
        >
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Название</label>
            <input
              name="name"
              required
              placeholder="Например: 1-комнатная квартира"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-600">Адрес</label>
            <input
              name="address"
              required
              placeholder="Например: ул. Ленина, 25"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-600">
              Ссылка на объявление Avito
            </label>
            <input
              name="avitoUrl"
              required
              placeholder="https://www.avito.ru/..."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-600">
              Ссылка на RealityCalendar
            </label>
            <input
              name="realityCalendarUrl"
              required
              placeholder="https://realitycalendar.ru/..."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Создать квартиру
          </button>
        </form>
      </div>
    </main>
  );
}