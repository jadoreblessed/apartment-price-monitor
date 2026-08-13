import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { PriceHistory } from "@/components/apartments/PriceHistory";
import { getApartmentPriceHistoryPage } from "@/lib/queries";
import { requireUser } from "@/lib/auth";

export default async function ApartmentHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  await requireUser();

  const { id } = await params;
  const query = await searchParams;
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const history = await getApartmentPriceHistoryPage(id, page, 5);

  if (!history.apartment) notFound();
  if (page > history.pageCount) redirect(`/apartments/${id}/history?page=${history.pageCount}`);

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href={`/apartments/${id}`} className="mb-6 inline-block text-sm font-medium text-zinc-700 hover:text-zinc-950">
          ← Назад к квартире
        </Link>
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{history.apartment.name}</h1>
          <p className="mt-2 text-sm text-zinc-700">Полная история изменения цены</p>
        </header>

        <PriceHistory history={history.items} total={history.total} showChart={false} />

        <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4" aria-label="Страницы истории цены">
          {page > 1 ? (
            <Link href={`/apartments/${id}/history?page=${page - 1}`} className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 px-2 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 sm:px-4">← Назад</Link>
          ) : <span />}
          <span className="text-center text-xs font-medium text-zinc-700 sm:text-sm">{page} из {history.pageCount}</span>
          {page < history.pageCount ? (
            <Link href={`/apartments/${id}/history?page=${page + 1}`} className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 px-2 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 sm:px-4">Дальше →</Link>
          ) : <span />}
        </nav>
      </div>
    </main>
  );
}
