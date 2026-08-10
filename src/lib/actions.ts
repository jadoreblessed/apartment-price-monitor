"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addCompetitor(apartmentId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;

  if (!name?.trim() || !url?.trim()) return;

  await prisma.competitor.create({
    data: {
      name: name.trim(),
      url: url.trim(),
      apartmentId,
    },
  });

  revalidatePath(`/apartments/${apartmentId}`);
}

export async function deleteCompetitor(apartmentId: string, competitorId: string) {
  await prisma.competitor.delete({
    where: { id: competitorId },
  });

  revalidatePath(`/apartments/${apartmentId}`);
}
export async function updateApartmentPrice(apartmentId: string, formData: FormData) {
  const price = Number(formData.get("price"));
  if (!price || price <= 0) return;

  await prisma.priceSnapshot.create({
    data: {
      apartmentId,
      price,
      status: "manual",
    },
  });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/");
}

export async function updateCompetitorPrice(
  apartmentId: string,
  competitorId: string,
  formData: FormData
) {
  const price = Number(formData.get("price"));
  if (!price || price <= 0) return;

  await prisma.priceSnapshot.create({
    data: {
      competitorId,
      price,
      status: "manual",
    },
  });

  revalidatePath(`/apartments/${apartmentId}`);
}
export async function createApartment(formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const avitoUrl = formData.get("avitoUrl") as string;
  const realityCalendarUrl = formData.get("realityCalendarUrl") as string;

  if (!name?.trim() || !address?.trim() || !avitoUrl?.trim() || !realityCalendarUrl?.trim()) {
    return;
  }

  const apartment = await prisma.apartment.create({
    data: {
      name: name.trim(),
      address: address.trim(),
      avitoUrl: avitoUrl.trim(),
      realityCalendarUrl: realityCalendarUrl.trim(),
    },
  });

  revalidatePath("/");
  redirect(`/apartments/${apartment.id}`);
}