"use client";

import { useMemo, useState } from "react";

type ManualPriceEntryProps = {
  title: string;
  subtitle: string;
  url: string;
  currentPrice: number;
  checkInDate: string;
  nights: number;
  action: (formData: FormData) => Promise<void>;
};

export function ManualPriceEntry({
  title,
  subtitle,
  url,
  currentPrice,
  checkInDate,
  nights,
  action,
}: ManualPriceEntryProps) {
  const [totalPrice, setTotalPrice] = useState("");
  const [opened, setOpened] = useState(false);
  const nightlyPrice = useMemo(() => {
    const total = Number(totalPrice);
    return Number.isFinite(total) && total > 0 ? Math.round(total / nights) : 0;
  }, [totalPrice, nights]);

  function openListing() {
    setOpened(true);
    const popup = window.open(
      url,
      `avito-${title.replace(/\W/g, "-")}`,
      "popup=yes,width=1240,height=860,resizable=yes,scrollbars=yes"
    );
    if (!popup) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <article className="soft-card group rounded-[1.4rem] p-4 transition sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_16px_44px_rgba(15,23,42,0.075)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${opened ? "bg-emerald-500" : "bg-slate-300"}`} />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{subtitle}</p>
            {opened && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Открыто</span>}
          </div>
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Сейчас: {currentPrice > 0 ? `${currentPrice.toLocaleString("ru-RU")} ₽/сутки` : "цены ещё нет"}
          </p>
        </div>
        <button
          type="button"
          onClick={openListing}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Открыть объявление <span aria-hidden="true">↗</span>
        </button>
      </div>

      <form action={action} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <input type="hidden" name="checkInDate" value={checkInDate} />
        <input type="hidden" name="nights" value={nights} />
        <label className="text-sm font-medium text-slate-700">
          Общая стоимость за {nights} {nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"}
          <div className="relative mt-1.5">
            <input
              name="totalPrice"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={totalPrice}
              onChange={(event) => setTotalPrice(event.target.value)}
              placeholder="Например, 15 000"
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 pr-10 text-base font-medium text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₽</span>
          </div>
        </label>
        <div className="min-w-40 rounded-xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-100">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">За сутки</p>
          <p className="mt-0.5 text-base font-semibold text-slate-950">
            {nightlyPrice > 0 ? `${nightlyPrice.toLocaleString("ru-RU")} ₽` : "—"}
          </p>
        </div>
        <button className="min-h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200">
          Сохранить
        </button>
      </form>
    </article>
  );
}
