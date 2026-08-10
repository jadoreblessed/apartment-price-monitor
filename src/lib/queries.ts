import { prisma } from "@/lib/db";
import type { Apartment as ApartmentType, Competitor as CompetitorType } from "@/types";

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

export async function getApartmentsForDashboard(): Promise<ApartmentType[]> {
  const apartments = await prisma.apartment.findMany({
    include: { competitors: true },
    orderBy: { createdAt: "asc" },
  });

  const result: ApartmentType[] = [];

  for (const apt of apartments) {
    const ourSnapshot = await getLatestKnownPrice(apt.id, undefined);

    const competitors: CompetitorType[] = [];
    for (const comp of apt.competitors) {
      const compSnapshot = await getLatestKnownPrice(undefined, comp.id);
      competitors.push({
        id: comp.id,
        name: comp.name,
        url: comp.url,
        price: compSnapshot?.price ?? 0,
        updatedAt: compSnapshot ? formatDate(compSnapshot.capturedAt) : "нет данных",
      });
    }

    result.push({
      id: apt.id,
      name: apt.name,
      address: apt.address,
      avitoUrl: apt.avitoUrl,
      realityCalendarUrl: apt.realityCalendarUrl,
      price: ourSnapshot?.price ?? 0,
      updatedAt: ourSnapshot ? formatDate(ourSnapshot.capturedAt) : "нет данных",
      competitors,
    });
  }

  return result;
}

export async function getApartmentById(id: string): Promise<ApartmentType | null> {
  const apt = await prisma.apartment.findUnique({
    where: { id },
    include: { competitors: true },
  });

  if (!apt) return null;

  const ourSnapshot = await getLatestKnownPrice(apt.id, undefined);

  const competitors: CompetitorType[] = [];
  for (const comp of apt.competitors) {
    const compSnapshot = await getLatestKnownPrice(undefined, comp.id);
    competitors.push({
      id: comp.id,
      name: comp.name,
      url: comp.url,
      price: compSnapshot?.price ?? 0,
      updatedAt: compSnapshot ? formatDate(compSnapshot.capturedAt) : "нет данных",
    });
  }

  return {
    id: apt.id,
    name: apt.name,
    address: apt.address,
    avitoUrl: apt.avitoUrl,
    realityCalendarUrl: apt.realityCalendarUrl,
    price: ourSnapshot?.price ?? 0,
    updatedAt: ourSnapshot ? formatDate(ourSnapshot.capturedAt) : "нет данных",
    competitors,
  };
}