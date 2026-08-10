import Link from "next/link";
import { Apartment } from "@/types";

interface ApartmentCardProps {
  apartment: Apartment;
}

export function ApartmentCard({ apartment }: ApartmentCardProps) {
  const competitorPrices = apartment.competitors
    .map((competitor) => competitor.price)
    .filter((price) => price > 0);

  const hasCompetitorPrices = competitorPrices.length > 0;

  const averagePrice = hasCompetitorPrices
    ? Math.round(
        competitorPrices.reduce((sum, price) => sum + price, 0) /
          competitorPrices.length
      )
    : 0;

  const minPrice = hasCompetitorPrices ? Math.min(...competitorPrices) : 0;
  const maxPrice = hasCompetitorPrices ? Math.max(...competitorPrices) : 0;

  const formatPrice = (value: number) =>
    value > 0 ? `${value.toLocaleString("ru-RU")} ₽` : "Нет данных";

  return (
    <Link
      href={`/apartments/${apartment.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {apartment.name}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">{apartment.address}</p>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
          {apartment.competitors.length} конкурента
        </span>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-zinc-500">Наша цена</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatPrice(apartment.price)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Средняя</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatPrice(averagePrice)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Минимум</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatPrice(minPrice)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Максимум</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatPrice(maxPrice)}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <p className="text-xs text-zinc-400">
          Обновлено: {apartment.updatedAt}
        </p>
      </div>
    </Link>
  );
}