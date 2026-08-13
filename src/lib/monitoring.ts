import { prisma } from "@/lib/db";
import { scrapeMultiple, type ScrapeResult } from "@/lib/scraper";

export interface MonitoringSummary {
  apartmentCount: number;
  checkedCount: number;
  successCount: number;
  blockedCount: number;
  failedCount: number;
}

interface NotificationInput {
  apartmentId: string;
  targetName: string;
  previousPrice: number | null;
  price: number | null;
  status: string;
}

export function buildNotification(input: NotificationInput) {
  if (input.status === "blocked" || input.status === "not_found") {
    return {
      apartmentId: input.apartmentId,
      type: input.status,
      title: input.status === "blocked" ? "Доступ заблокирован" : "Цена не найдена",
      message: `${input.targetName}: ${
        input.status === "blocked"
          ? "Avito ограничил доступ"
          : "объявление или цена не найдены"
      }`,
    };
  }

  if (
    input.previousPrice === null ||
    input.price === null ||
    input.previousPrice === input.price
  ) {
    return null;
  }

  const difference = input.price - input.previousPrice;
  const direction = difference > 0 ? "выросла" : "снизилась";

  return {
    apartmentId: input.apartmentId,
    type: "price_change",
    title: `Цена ${direction}`,
    message: `${input.targetName}: ${input.previousPrice.toLocaleString("ru-RU")} ₽ → ${input.price.toLocaleString("ru-RU")} ₽ (${difference > 0 ? "+" : ""}${difference.toLocaleString("ru-RU")} ₽)`,
  };
}

export async function runRealMonitoringForApartment(
  apartmentId: string,
  options: { headless?: boolean } = {}
): Promise<MonitoringSummary | null> {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: { competitors: true },
  });
  if (!apartment) return null;

  const targets = [
    { apartmentId: apartment.id, competitorId: null, name: apartment.name, url: apartment.avitoUrl },
    ...apartment.competitors.map((item) => ({
      apartmentId: null,
      competitorId: item.id,
      name: item.name,
      url: item.url,
    })),
  ];
  const previous = await Promise.all(
    targets.map((target) =>
      prisma.priceSnapshot.findFirst({
        where: {
          apartmentId: target.apartmentId ?? undefined,
          competitorId: target.competitorId ?? undefined,
          price: { not: null },
        },
        orderBy: { capturedAt: "desc" },
      })
    )
  );
  const results = await scrapeMultiple(
    targets.map((target) => target.url),
    undefined,
    {
      headless: options.headless ?? true,
      allowManualCheck: false,
      checkInDate: apartment.monitoringDate ?? undefined,
      nights: apartment.stayNights,
    }
  );

  const operations = results.flatMap((result: ScrapeResult, index: number) => {
    const target = targets[index];
    const notification = buildNotification({
      apartmentId: apartment.id,
      targetName: target.name,
      previousPrice: previous[index]?.price ?? null,
      price: result.price,
      status: result.status,
    });
    return [
      prisma.priceSnapshot.create({
        data: {
          apartmentId: target.apartmentId,
          competitorId: target.competitorId,
          price: result.price,
          totalPrice: result.totalPrice,
          nights: result.nights,
          checkInDate: apartment.monitoringDate,
          status: result.status,
        },
      }),
      ...(notification ? [prisma.notification.create({ data: notification })] : []),
    ];
  });
  const successCount = results.filter((item) => item.status === "ok").length;
  const blockedCount = results.filter((item) => item.status === "blocked").length;
  const failedCount = results.filter((item) => item.status === "not_found").length;
  await prisma.$transaction([
    ...operations,
    prisma.monitoringRun.create({
      data: {
        apartmentId,
        mode: "real",
        status: blockedCount + failedCount === 0 ? "completed" : "completed_with_errors",
        checkedCount: results.length,
        successCount,
        blockedCount,
        failedCount,
      },
    }),
  ]);
  return { apartmentCount: 1, checkedCount: results.length, successCount, blockedCount, failedCount };
}

export async function runAllRealMonitoring(
  options: { headless?: boolean } = {}
): Promise<MonitoringSummary> {
  const apartments = await prisma.apartment.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });
  const summary: MonitoringSummary = { apartmentCount: 0, checkedCount: 0, successCount: 0, blockedCount: 0, failedCount: 0 };
  for (const apartment of apartments) {
    const result = await runRealMonitoringForApartment(apartment.id, options);
    if (!result) continue;
    summary.apartmentCount += result.apartmentCount;
    summary.checkedCount += result.checkedCount;
    summary.successCount += result.successCount;
    summary.blockedCount += result.blockedCount;
    summary.failedCount += result.failedCount;
    if (result.blockedCount > 0) {
      console.error(
        "Avito ограничил доступ. Общий запуск остановлен; обновите сессию командой npm run avito:session."
      );
      break;
    }
  }
  return summary;
}
