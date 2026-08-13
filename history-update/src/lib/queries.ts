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

async function getLatestKnownPrice(apartmentId?: string, competitorId?: string) {
  return prisma.priceSnapshot.findFirst({
    where: {
      apartmentId: apartmentId ?? undefined,
      competitorId: competitorId ?? undefined,
      price: { not: null },
    },
    orderBy: { capturedAt: "desc" },
  });
}

async function getCompetitors(
  competitors: Array<{ id: string; name: string; url: string }>
): Promise<CompetitorType[]> {
  return Promise.all(
    competitors.map(async (competitor) => {
      const snapshot = await getLatestKnownPrice(undefined, competitor.id);

      return {
        id: competitor.id,
        name: competitor.name,
        url: competitor.url,
        price: snapshot?.price ?? 0,
        updatedAt: snapshot ? formatDate(snapshot.capturedAt) : "нет данных",
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
  }));
}

export async function getApartmentsForDashboard(): Promise<ApartmentType[]> {
  const apartments = await prisma.apartment.findMany({
    include: { competitors: true },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    apartments.map(async (apartment) => {
      const [snapshot, competitors] = await Promise.all([
        getLatestKnownPrice(apartment.id),
        getCompetitors(apartment.competitors),
      ]);

      return {
        id: apartment.id,
        name: apartment.name,
        address: apartment.address,
        avitoUrl: apartment.avitoUrl,
        realityCalendarUrl: apartment.realityCalendarUrl,
        price: snapshot?.price ?? 0,
        updatedAt: snapshot ? formatDate(snapshot.capturedAt) : "нет данных",
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

  const [snapshot, competitors, priceHistory] = await Promise.all([
    getLatestKnownPrice(apartment.id),
    getCompetitors(apartment.competitors),
    getApartmentPriceHistory(apartment.id),
  ]);

  return {
    id: apartment.id,
    name: apartment.name,
    address: apartment.address,
    avitoUrl: apartment.avitoUrl,
    realityCalendarUrl: apartment.realityCalendarUrl,
    price: snapshot?.price ?? 0,
    updatedAt: snapshot ? formatDate(snapshot.capturedAt) : "нет данных",
    competitors,
    priceHistory,
  };
}
