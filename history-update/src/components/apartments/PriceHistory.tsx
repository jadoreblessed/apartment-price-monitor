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

export function PriceHistory({ history }: { history: PriceHistoryPoint[] }) {
  const knownPrices = history.filter(
    (item): item is PriceHistoryPoint & { price: number } => item.price !== null
  );
  const latest = knownPrices[0]?.price ?? null;
  const previous = knownPrices[1]?.price ?? null;
  const difference = latest !== null && previous !== null ? latest - previous : null;

  return (
    <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">История цены</h2>
          <p className="mt-1 text-sm text-zinc-500">Последние {history.length} замеров</p>
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
          <PriceChart history={history} />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <tr><th className="pb-3 font-medium">Дата</th><th className="pb-3 font-medium">Цена</th><th className="pb-3 text-right font-medium">Статус</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-zinc-500">{item.capturedAtLabel}</td>
                    <td className="py-3 font-medium text-zinc-900">{formatPrice(item.price)}</td>
                    <td className="py-3 text-right text-zinc-500">{statusLabels[item.status] ?? item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
