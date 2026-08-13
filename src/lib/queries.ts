import { prisma } from "@/lib/db";
import type {
  Apartment as ApartmentType,
  Competitor as CompetitorType,
  PriceHistoryPoint,
} from "@/types";

function formatDate(date: Date): string {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInputDate(date: Date | null): string {
  const value = date ?? new Date("2026-09-15T00:00:00.000Z");
  return value.toISOString().slice(0, 10);
}

export async function getDashboardMonitoringSummary() {
  const [latestRun, totals] = await Promise.all([
    prisma.monitoringRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.monitoringRun.aggregate({
      _count: { id: true },
      _sum: {
        checkedCount: true,
        successCount: true,
        blockedCount: true,
        failedCount: true,
      },
    }),
  ]);

  return {
    latestRunAt: latestRun ? formatDate(latestRun.startedAt) : "запусков пока нет",
    runCount: totals._count.id,
    checkedCount: totals._sum.checkedCount ?? 0,
    successCount: totals._sum.successCount ?? 0,
    problemCount:
      (totals._sum.blockedCount ?? 0) + (totals._sum.failedCount ?? 0),
  };
}

export async function getDashboardNotifications(limit = 10) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      include: { apartment: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  return {
    unreadCount,
    items: notifications.map((notification) => ({
      id: notification.id,
      apartmentId: notification.apartmentId,
      apartmentName: notification.apartment.name,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAtLabel: formatDate(notification.createdAt),
    })),
  };
}

async function getPriceState(apartmentId?: string, competitorId?: string) {
  const where = {
    apartmentId: apartmentId ?? undefined,
    competitorId: competitorId ?? undefined,
  };
  const [knownPrice, lastAttempt] = await Promise.all([
    prisma.priceSnapshot.findFirst({
      where: { ...where, price: { not: null } },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.priceSnapshot.findFirst({ where, orderBy: { capturedAt: "desc" } }),
  ]);
  const ageMs = lastAttempt ? Date.now() - lastAttempt.capturedAt.getTime() : Infinity;
  return {
    price: knownPrice?.price ?? 0,
    updatedAt: knownPrice ? formatDate(knownPrice.capturedAt) : "нет данных",
    checkStatus: lastAttempt?.status ?? "never",
    lastCheckAt: lastAttempt ? formatDate(lastAttempt.capturedAt) : "ещё не проверялось",
    isFresh:
      (lastAttempt?.status === "ok" || lastAttempt?.status === "manual") &&
      ageMs <= 13 * 60 * 60 * 1000,
  };
}

async function getCompetitors(
  competitors: Array<{ id: string; name: string; url: string }>
): Promise<CompetitorType[]> {
  return Promise.all(
    competitors.map(async (competitor) => {
      const state = await getPriceState(undefined, competitor.id);

      return {
        id: competitor.id,
        name: competitor.name,
        url: competitor.url,
        ...state,
      };
    })
  );
}

export async function getApartmentPriceHistory(
  apartmentId: string,
  limit = 30
): Promise<PriceHistoryPoint[]> {
  const snapshots = await prisma.priceSnapshot.findMany({
    where: { apartmentId },
    orderBy: { capturedAt: "desc" },
    take: limit,
  });

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    price: snapshot.price,
    status: snapshot.status,
    capturedAt: snapshot.capturedAt.toISOString(),
    capturedAtLabel: formatDate(snapshot.capturedAt),
    checkInDateLabel: snapshot.checkInDate?.toLocaleDateString("ru-RU"),
    nights: snapshot.nights,
    totalPrice: snapshot.totalPrice,
    recordedBy: snapshot.recordedBy,
  }));
}

export async function getApartmentPriceHistoryPage(
  apartmentId: string,
  page: number,
  pageSize = 5
) {
  const safePage = Math.max(1, page);
  const [apartment, snapshots, total] = await Promise.all([
    prisma.apartment.findUnique({
      where: { id: apartmentId },
      select: { id: true, name: true },
    }),
    prisma.priceSnapshot.findMany({
      where: { apartmentId },
      orderBy: { capturedAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.priceSnapshot.count({ where: { apartmentId } }),
  ]);

  return {
    apartment,
    items: snapshots.map((snapshot) => ({
      id: snapshot.id,
      price: snapshot.price,
      status: snapshot.status,
      capturedAt: snapshot.capturedAt.toISOString(),
      capturedAtLabel: formatDate(snapshot.capturedAt),
      checkInDateLabel: snapshot.checkInDate?.toLocaleDateString("ru-RU"),
      nights: snapshot.nights,
      totalPrice: snapshot.totalPrice,
      recordedBy: snapshot.recordedBy,
    })),
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    total,
  };
}

export async function getTodayCheckStatus() {
  const apartmentCount = await prisma.apartment.count();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const runs = await prisma.monitoringRun.findMany({
    where: {
      startedAt: { gte: dayStart },
      mode: { in: ["manual_morning", "manual_day", "manual_evening"] },
    },
    select: { mode: true, apartmentId: true },
  });

  const countFor = (mode: string) =>
    new Set(runs.filter((run) => run.mode === mode).map((run) => run.apartmentId)).size;

  return [
    { id: "morning", label: "Утро", time: "08:00", completed: countFor("manual_morning"), total: apartmentCount },
    { id: "day", label: "День", time: "14:00", completed: countFor("manual_day"), total: apartmentCount },
    { id: "evening", label: "Вечер", time: "20:00", completed: countFor("manual_evening"), total: apartmentCount },
  ];
}

export async function getApartmentsForDashboard(): Promise<ApartmentType[]> {
  const apartments = await prisma.apartment.findMany({
    include: { competitors: true },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    apartments.map(async (apartment) => {
      const [state, competitors] = await Promise.all([
        getPriceState(apartment.id),
        getCompetitors(apartment.competitors),
      ]);

      return {
        id: apartment.id,
        name: apartment.name,
        address: apartment.address,
        avitoUrl: apartment.avitoUrl,
        realityCalendarUrl: apartment.realityCalendarUrl,
        monitoringDate: formatInputDate(apartment.monitoringDate),
        stayNights: apartment.stayNights,
        ...state,
        competitors,
      };
    })
  );
}

export async function getApartmentById(
  id: string
): Promise<ApartmentType | null> {
  const apartment = await prisma.apartment.findUnique({
    where: { id },
    include: { competitors: true },
  });

  if (!apartment) return null;

  const [state, competitors, priceHistory, priceHistoryTotal] = await Promise.all([
    getPriceState(apartment.id),
    getCompetitors(apartment.competitors),
    getApartmentPriceHistory(apartment.id, 5),
    prisma.priceSnapshot.count({ where: { apartmentId: apartment.id } }),
  ]);

  return {
    id: apartment.id,
    name: apartment.name,
    address: apartment.address,
    avitoUrl: apartment.avitoUrl,
    realityCalendarUrl: apartment.realityCalendarUrl,
    monitoringDate: formatInputDate(apartment.monitoringDate),
    stayNights: apartment.stayNights,
    ...state,
    competitors,
    priceHistory,
    priceHistoryTotal,
  };
}
