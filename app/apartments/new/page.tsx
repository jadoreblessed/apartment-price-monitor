import Link from "next/link";
import { createApartment } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function NewApartmentPage() {
  await requireUser();
  const suggestedDate = new Date();
  suggestedDate.setDate(suggestedDate.getDate() + 30);
  const suggestedDateValue = suggestedDate.toISOString().slice(0, 10);
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/" className="mb-6 inline-block text-sm font-medium text-zinc-700 hover:text-zinc-950">
          ← Назад ко всем квартирам
        </Link>

        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-zinc-950 sm:mb-6">Добавить квартиру</h1>

        <form action={createApartment} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <label className="text-sm font-medium text-zinc-700">
            Название
            <input name="name" required placeholder="Например: 1-комнатная квартира" className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500" />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Адрес
            <input name="address" required placeholder="Например: ул. Ленина, 25" className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500" />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Ссылка на объявление Avito
            <input name="avitoUrl" type="url" inputMode="url" required placeholder="https://www.avito.ru/..." className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500" />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Ссылка на RealityCalendar
            <input name="realityCalendarUrl" type="url" inputMode="url" required placeholder="https://realitycalendar.ru/..." className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-zinc-700">
              Дата проверки цены
              <input name="monitoringDate" type="date" defaultValue={suggestedDateValue} required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500" />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Количество ночей
              <input name="stayNights" type="number" inputMode="numeric" min="1" max="30" defaultValue="1" required className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500" />
            </label>
          </div>
          <p className="text-xs leading-5 text-zinc-500">
            Если объект сдаётся минимум на 2–3 ночи, укажите этот срок. Общая стоимость будет автоматически разделена на количество ночей.
          </p>
          <button type="submit" className="mt-2 min-h-12 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Создать квартиру
          </button>
        </form>
      </div>
    </main>
  );
}
