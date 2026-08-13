"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateApartmentPrice(apartmentId: string, formData: FormData) {
  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price <= 0) return;

  await prisma.priceSnapshot.create({
    data: { apartmentId, price: Math.round(price), status: "manual" },
  });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/");
}

export async function addCompetitor(apartmentId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!name || !url) return;

  await prisma.competitor.create({ data: { name, url, apartmentId } });
  revalidatePath(`/apartments/${apartmentId}`);
}

export async function deleteCompetitor(apartmentId: string, competitorId: string) {
  await prisma.competitor.delete({ where: { id: competitorId } });
  revalidatePath(`/apartments/${apartmentId}`);
}

export async function updateCompetitorPrice(apartmentId: string, competitorId: string, formData: FormData) {
  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price <= 0) return;

  await prisma.priceSnapshot.create({
    data: { competitorId, price: Math.round(price), status: "manual" },
  });
  revalidatePath(`/apartments/${apartmentId}`);
}
