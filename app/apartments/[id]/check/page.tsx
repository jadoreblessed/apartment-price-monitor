import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ManualPriceEntry } from "@/components/checks/ManualPriceEntry";
import {
  completeManualCheck,
  recordApartmentManualPrice,
  recordCompetitorManualPrice,
} from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getApartmentById } from "@/lib/queries";

function currentPeriod() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Moscow", hour: "2-digit", hour12: false }).format(new Date()));
  return hour < 12 ? "morning" : hour < 18 ? "day" : "evening";
}

export default async function ApartmentCheckPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireUser();
  const { id } = await params;
  const apartment = await getApartmentById(id);
  if (!apartment) notFound();
  const period = currentPeriod();
  const dateLabel = new Date(`${apartment.monitoringDate}T00:00:00.000Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/check" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">← Ко всем проверкам</Link>
          <Link href={`/apartments/${id}`} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Карточка квартиры</Link>
        </div>

        <header className="mt-7 rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Проверка цены</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{apartment.name}</h1>
          <p className="mt-2 text-sm text-slate-400">Заезд {dateLabel} · {apartment.stayNights} {apartment.stayNights === 1 ? "ночь" : apartment.stayNights < 5 ? "ночи" : "ночей"}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-white/7 p-3 ring-1 ring-white/10"><span className="text-slate-400">1.</span> Откройте Avito</div>
            <div className="rounded-xl bg-white/7 p-3 ring-1 ring-white/10"><span className="text-slate-400">2.</span> Укажите общую сумму</div>
            <div className="rounded-xl bg-white/7 p-3 ring-1 ring-white/10"><span className="text-slate-400">3.</span> Сохраните результат</div>
          </div>
        </header>

        <div className="mt-5 grid gap-4">
          <ManualPriceEntry
            title={apartment.name}
            subtitle="Наша квартира"
            url={apartment.avitoUrl}
            currentPrice={apartment.price}
            checkInDate={apartment.monitoringDate}
            nights={apartment.stayNights}
            action={recordApartmentManualPrice.bind(null, apartment.id)}
          />
          {apartment.competitors.map((competitor, index) => (
            <ManualPriceEntry
              key={competitor.id}
              title={competitor.name}
              subtitle={`Конкурент ${index + 1}`}
              url={competitor.url}
              currentPrice={competitor.price}
              checkInDate={apartment.monitoringDate}
              nights={apartment.stayNights}
              action={recordCompetitorManualPrice.bind(null, apartment.id, competitor.id)}
            />
          ))}
        </div>

        <section className="mt-6 flex flex-col gap-4 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-emerald-950">Все цены перенесены?</h2>
            <p className="mt-1 text-sm text-emerald-800/75">Завершение отметит квартиру проверенной в текущем периоде.</p>
          </div>
          <form action={completeManualCheck.bind(null, apartment.id, period)}>
            <button className="min-h-12 w-full rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 sm:w-auto">Завершить проверку</button>
          </form>
        </section>
      </div>
    </main>
  );
}
