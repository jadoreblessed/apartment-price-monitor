import Link from "next/link";
import type { Apartment } from "@/types";

interface ApartmentCardProps {
  apartment: Apartment;
}

export function ApartmentCard({ apartment }: ApartmentCardProps) {
  const competitorPrices = apartment.competitors
    .map((competitor) => competitor.price)
    .filter((price) => price > 0);
  const averagePrice = competitorPrices.length
    ? Math.round(
        competitorPrices.reduce((sum, price) => sum + price, 0) /
          competitorPrices.length
      )
    : 0;
  const minPrice = competitorPrices.length ? Math.min(...competitorPrices) : 0;
  const maxPrice = competitorPrices.length ? Math.max(...competitorPrices) : 0;
  const formatPrice = (value: number) =>
    value > 0 ? `${value.toLocaleString("ru-RU")} ₽` : "Нет данных";

  return (
    <Link
      href={`/apartments/${apartment.id}`}
      className="soft-card group block rounded-[1.5rem] p-5 transition active:bg-slate-50 sm:p-6 sm:hover:-translate-y-0.5 sm:hover:border-slate-300 sm:hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${apartment.isFresh ? "bg-emerald-500" : "bg-amber-400"}`} /><span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">{apartment.isFresh ? "Актуально" : "Нужна проверка"}</span></div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{apartment.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{apartment.address || "Адрес не указан"}</p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
          {apartment.competitors.length} конкурентов
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-4 sm:gap-4">
        {[
          ["Наша цена", apartment.price],
          ["Средняя", averagePrice],
          ["Минимум", minPrice],
          ["Максимум", maxPrice],
        ].map(([label, price]) => (
          <div key={String(label)}>
            <p className="text-xs font-medium text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              {formatPrice(Number(price))}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className={apartment.isFresh ? "text-xs font-medium text-emerald-700" : "text-xs font-medium text-amber-700"}>
          {apartment.isFresh
            ? `Актуально · проверено ${apartment.lastCheckAt}`
            : `Требует проверки · последняя цена от ${apartment.updatedAt}`}
        </p>
        <span className="text-sm font-semibold text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900">→</span>
      </div>
    </Link>
  );
}
