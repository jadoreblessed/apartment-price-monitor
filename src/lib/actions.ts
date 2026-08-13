"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildNotification,
  runAllRealMonitoring as runAllRealMonitoringService,
  runRealMonitoringForApartment,
} from "@/lib/monitoring";
import { requireAdmin, requireUser } from "@/lib/auth";

function readRequiredText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

function readMonitoringSettings(formData: FormData) {
  const rawDate = readRequiredText(formData, "monitoringDate");
  const monitoringDate = rawDate ? new Date(`${rawDate}T00:00:00.000Z`) : null;
  const rawNights = Number(formData.get("stayNights"));
  const stayNights = Number.isInteger(rawNights) ? Math.min(30, Math.max(1, rawNights)) : 1;
  return {
    monitoringDate:
      monitoringDate && Number.isFinite(monitoringDate.getTime()) ? monitoringDate : null,
    stayNights,
  };
}

export async function createApartment(formData: FormData) {
  await requireUser();
  const name = readRequiredText(formData, "name");
  const address = readRequiredText(formData, "address");
  const avitoUrl = readRequiredText(formData, "avitoUrl");
  const realityCalendarUrl = readRequiredText(formData, "realityCalendarUrl");
  const monitoringSettings = readMonitoringSettings(formData);

  if (!name || !address || !avitoUrl || !realityCalendarUrl) return;

  const apartment = await prisma.apartment.create({
    data: { name, address, avitoUrl, realityCalendarUrl, ...monitoringSettings },
  });

  revalidatePath("/");
  redirect(`/apartments/${apartment.id}`);
}

export async function updateApartment(apartmentId: string, formData: FormData) {
  await requireUser();
  const name = readRequiredText(formData, "name");
  const address = readRequiredText(formData, "address");
  const avitoUrl = readRequiredText(formData, "avitoUrl");
  const realityCalendarUrl = readRequiredText(formData, "realityCalendarUrl");
  const monitoringSettings = readMonitoringSettings(formData);

  if (!name || !address || !avitoUrl || !realityCalendarUrl) return;

  await prisma.apartment.update({
    where: { id: apartmentId },
    data: { name, address, avitoUrl, realityCalendarUrl, ...monitoringSettings },
  });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/");
}

export async function deleteApartment(apartmentId: string) {
  await requireAdmin();
  await prisma.apartment.delete({ where: { id: apartmentId } });
  revalidatePath("/");
  redirect("/");
}

export async function updateApartmentPrice(apartmentId: string, formData: FormData) {
  await requireUser();
  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price <= 0) return;

  const [apartment, previous] = await Promise.all([
    prisma.apartment.findUnique({ where: { id: apartmentId }, select: { name: true } }),
    prisma.priceSnapshot.findFirst({
      where: { apartmentId, price: { not: null } },
      orderBy: { capturedAt: "desc" },
    }),
  ]);
  if (!apartment) return;

  const roundedPrice = Math.round(price);
  const notification = buildNotification({
    apartmentId,
    targetName: apartment.name,
    previousPrice: previous?.price ?? null,
    price: roundedPrice,
    status: "manual",
  });

  await prisma.$transaction([
    prisma.priceSnapshot.create({
      data: { apartmentId, price: roundedPrice, status: "manual" },
    }),
    ...(notification ? [prisma.notification.create({ data: notification })] : []),
  ]);

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/");
}

export async function addCompetitor(apartmentId: string, formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!name || !url) return;

  await prisma.competitor.create({ data: { name, url, apartmentId } });
  revalidatePath(`/apartments/${apartmentId}`);
}

export async function deleteCompetitor(apartmentId: string, competitorId: string) {
  await requireUser();
  await prisma.competitor.delete({ where: { id: competitorId } });
  revalidatePath(`/apartments/${apartmentId}`);
}

export async function updateCompetitorPrice(apartmentId: string, competitorId: string, formData: FormData) {
  await requireUser();
  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price <= 0) return;

  const [competitor, previous] = await Promise.all([
    prisma.competitor.findUnique({ where: { id: competitorId }, select: { name: true } }),
    prisma.priceSnapshot.findFirst({
      where: { competitorId, price: { not: null } },
      orderBy: { capturedAt: "desc" },
    }),
  ]);
  if (!competitor) return;

  const roundedPrice = Math.round(price);
  const notification = buildNotification({
    apartmentId,
    targetName: competitor.name,
    previousPrice: previous?.price ?? null,
    price: roundedPrice,
    status: "manual",
  });

  await prisma.$transaction([
    prisma.priceSnapshot.create({
      data: { competitorId, price: roundedPrice, status: "manual" },
    }),
    ...(notification ? [prisma.notification.create({ data: notification })] : []),
  ]);
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/");
}

function readManualPrice(formData: FormData) {
  const totalPrice = Number(formData.get("totalPrice"));
  const rawNights = Number(formData.get("nights"));
  const nights = Number.isInteger(rawNights) ? Math.min(30, Math.max(1, rawNights)) : 1;
  const rawDate = String(formData.get("checkInDate") ?? "").trim();
  const checkInDate = rawDate ? new Date(`${rawDate}T00:00:00.000Z`) : null;

  if (!Number.isFinite(totalPrice) || totalPrice <= 0) return null;
  if (checkInDate && !Number.isFinite(checkInDate.getTime())) return null;

  return {
    totalPrice: Math.round(totalPrice),
    price: Math.round(totalPrice / nights),
    nights,
    checkInDate,
  };
}

export async function recordApartmentManualPrice(apartmentId: string, formData: FormData) {
  const user = await requireUser();
  const value = readManualPrice(formData);
  if (!value) return;

  const [apartment, previous] = await Promise.all([
    prisma.apartment.findUnique({ where: { id: apartmentId }, select: { name: true } }),
    prisma.priceSnapshot.findFirst({
      where: { apartmentId, price: { not: null } },
      orderBy: { capturedAt: "desc" },
    }),
  ]);
  if (!apartment) return;

  const notification = buildNotification({
    apartmentId,
    targetName: apartment.name,
    previousPrice: previous?.price ?? null,
    price: value.price,
    status: "manual",
  });

  await prisma.$transaction([
    prisma.priceSnapshot.create({
      data: { apartmentId, ...value, status: "manual", recordedBy: user.name },
    }),
    ...(notification ? [prisma.notification.create({ data: notification })] : []),
  ]);

  revalidatePath(`/apartments/${apartmentId}/check`);
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/check");
  revalidatePath("/");
}

export async function recordCompetitorManualPrice(
  apartmentId: string,
  competitorId: string,
  formData: FormData
) {
  const user = await requireUser();
  const value = readManualPrice(formData);
  if (!value) return;

  const [competitor, previous] = await Promise.all([
    prisma.competitor.findUnique({ where: { id: competitorId }, select: { name: true } }),
    prisma.priceSnapshot.findFirst({
      where: { competitorId, price: { not: null } },
      orderBy: { capturedAt: "desc" },
    }),
  ]);
  if (!competitor) return;

  const notification = buildNotification({
    apartmentId,
    targetName: competitor.name,
    previousPrice: previous?.price ?? null,
    price: value.price,
    status: "manual",
  });

  await prisma.$transaction([
    prisma.priceSnapshot.create({
      data: { competitorId, ...value, status: "manual", recordedBy: user.name },
    }),
    ...(notification ? [prisma.notification.create({ data: notification })] : []),
  ]);

  revalidatePath(`/apartments/${apartmentId}/check`);
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/check");
  revalidatePath("/");
}

export async function completeManualCheck(apartmentId: string, period: string) {
  await requireUser();
  const safePeriod = ["morning", "day", "evening"].includes(period) ? period : "day";
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: { competitors: { select: { id: true } } },
  });
  if (!apartment) return;

  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const recent = await prisma.priceSnapshot.findMany({
    where: {
      status: "manual",
      capturedAt: { gte: since },
      OR: [
        { apartmentId },
        { competitorId: { in: apartment.competitors.map((item) => item.id) } },
      ],
    },
    select: { apartmentId: true, competitorId: true },
  });
  const checked = new Set(
    recent.map((item) => item.competitorId ? `c:${item.competitorId}` : `a:${item.apartmentId}`)
  ).size;
  const targetCount = 1 + apartment.competitors.length;

  await prisma.monitoringRun.create({
    data: {
      apartmentId,
      mode: `manual_${safePeriod}`,
      status: checked >= targetCount ? "completed" : "completed_partial",
      checkedCount: checked,
      successCount: checked,
      failedCount: Math.max(0, targetCount - checked),
    },
  });

  revalidatePath("/check");
  revalidatePath("/");
  redirect("/check");
}

export async function markNotificationRead(notificationId: string) {
  await requireUser();
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  await requireUser();
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/");
}

export async function runRealMonitoring(apartmentId: string) {
  await requireUser();
  await runRealMonitoringForApartment(apartmentId, { headless: true });
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/");
}

export async function runAllRealMonitoring() {
  await requireUser();
  await runAllRealMonitoringService({ headless: true });
  revalidatePath("/");
}
