import { ApartmentCard } from "@/components/apartments/ApartmentCard";
import { getApartmentsForDashboard } from "@/lib/queries";
import Link from "next/link";

export default async function Home() {
  const apartments = await getApartmentsForDashboard();

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                Мониторинг квартир
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Сравнение цен наших квартир и конкурентов
              </p>
            </div>

            <Link
              href="/apartments/new"
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              + Добавить квартиру
            </Link>
          </div>
        </header>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Всего квартир
            </p>

            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {apartments.length}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-zinc-500">
              Последнее обновление
            </p>

            <p className="mt-1 text-sm font-medium text-zinc-900">
              Сегодня, 09:06
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
            />
          ))}
        </div>
      </div>
    </main>
  );
}