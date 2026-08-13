import Link from "next/link";
import type { PriceHistoryPoint } from "@/types";

const statusLabels: Record<string, string> = {
  ok: "Получена",
  manual: "Вручную",
  blocked: "Заблокировано",
  not_found: "Не найдена",
};

function formatPrice(price: number | null): string {
  return price === null ? "—" : `${price.toLocaleString("ru-RU")} ₽`;
}

function PriceChart({ history }: { history: PriceHistoryPoint[] }) {
  const points = history
    .filter((item): item is PriceHistoryPoint & { price: number } => item.price !== null)
    .slice()
    .reverse();

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-400">
        Добавьте ещё один замер, чтобы появился график
      </div>
    );
  }

  const prices = points.map((item) => item.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);
  const coordinates = points
    .map((item, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 92 - ((item.price - min) / range) * 76;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <svg viewBox="0 0 100 108" className="h-40 w-full" preserveAspectRatio="none" aria-label="График изменения цены">
        <line x1="0" y1="92" x2="100" y2="92" stroke="#e4e4e7" strokeWidth="0.8" />
        <polyline points={coordinates} fill="none" stroke="#18181b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {coordinates.split(" ").map((coordinate, index) => {
          const [cx, cy] = coordinate.split(",");
          return <circle key={points[index].id} cx={cx} cy={cy} r="1.8" fill="#18181b" />;
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>{points[0].capturedAtLabel}</span>
        <span>{points.at(-1)?.capturedAtLabel}</span>
      </div>
    </div>
  );
}

export function PriceHistory({
  history,
  apartmentId,
  total = history.length,
  showChart = true,
}: {
  history: PriceHistoryPoint[];
  apartmentId?: string;
  total?: number;
  showChart?: boolean;
}) {
  const knownPrices = history.filter(
    (item): item is PriceHistoryPoint & { price: number } => item.price !== null
  );
  const latest = knownPrices[0]?.price ?? null;
  const previous = knownPrices[1]?.price ?? null;
  const difference = latest !== null && previous !== null ? latest - previous : null;

  return (
    <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">История цены</h2>
          <p className="mt-1 text-sm text-zinc-700">
            {total > history.length ? `Последние ${history.length} из ${total} замеров` : `${total} замеров`}
          </p>
        </div>
        {difference !== null && (
          <div className={`rounded-full px-3 py-1 text-sm font-medium ${difference > 0 ? "bg-red-50 text-red-700" : difference < 0 ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
            {difference > 0 ? "+" : ""}{difference.toLocaleString("ru-RU")} ₽
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 p-6 text-center text-sm text-zinc-400">История пока пуста</p>
      ) : (
        <>
          {showChart && <PriceChart history={history} />}
          <div className="mt-5 hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-700">
                <tr><th className="pb-3 font-medium">Проверка</th><th className="pb-3 font-medium">Цена за сутки</th><th className="pb-3 text-right font-medium">Статус</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-zinc-700"><span className="block">{item.capturedAtLabel}</span>{item.checkInDateLabel && <span className="mt-1 block text-xs text-zinc-400">заезд {item.checkInDateLabel}, {item.nights} н.</span>}{item.recordedBy && <span className="mt-1 block text-xs text-zinc-400">внёс: {item.recordedBy}</span>}</td>
                    <td className="py-3 font-medium text-zinc-900">{formatPrice(item.price)}</td>
                    <td className="py-3 text-right font-medium text-zinc-700">{statusLabels[item.status] ?? item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 divide-y divide-zinc-100 sm:hidden">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium text-zinc-900">{formatPrice(item.price)}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.capturedAtLabel}</p>
                  {item.checkInDateLabel && <p className="mt-1 text-xs text-zinc-400">Заезд {item.checkInDateLabel}, {item.nights} н.</p>}
                  {item.recordedBy && <p className="mt-1 text-xs text-zinc-400">Внёс: {item.recordedBy}</p>}
                </div>
                <span className="text-right text-xs font-medium text-zinc-700">
                  {statusLabels[item.status] ?? item.status}
                </span>
              </div>
            ))}
          </div>
          {apartmentId && total > history.length && (
            <div className="mt-4 flex border-t border-zinc-100 pt-4 sm:justify-end">
              <Link
                href={`/apartments/${apartmentId}/history`}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 sm:w-auto"
              >
                Вся история <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
