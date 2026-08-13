import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF0F172A" } };
const headerFont = { bold: true, color: { argb: "FFFFFFFF" } };
const moneyFormat = "#,##0 [$₽-ru-RU]";

function styleSheet(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: widths.length } };
  sheet.getRow(1).height = 26;
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: "middle" };
  });
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 22;
      row.eachCell((cell) => { cell.alignment = { vertical: "middle", wrapText: true }; });
      if (rowNumber % 2 === 0) row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }; });
    }
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Требуется вход", { status: 401 });

  const [apartments, snapshots, runs] = await Promise.all([
    prisma.apartment.findMany({ include: { competitors: true }, orderBy: { createdAt: "asc" } }),
    prisma.priceSnapshot.findMany({
      include: { apartment: true, competitor: { include: { apartment: true } } },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.monitoringRun.findMany({ include: { apartment: true }, orderBy: { startedAt: "desc" } }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Apartment Price Monitor";
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  const summary = workbook.addWorksheet("Сводка");
  summary.addRow(["Квартира", "Адрес", "Наша цена, ₽/сутки", "Конкурентов", "Средняя конкурентов, ₽", "Минимум, ₽", "Максимум, ₽", "Дата заезда", "Ночей"]);
  for (const apartment of apartments) {
    const own = snapshots.find((item) => item.apartmentId === apartment.id && item.price !== null)?.price ?? null;
    const prices = apartment.competitors.map((competitor) => snapshots.find((item) => item.competitorId === competitor.id && item.price !== null)?.price).filter((price): price is number => price !== null && price !== undefined);
    summary.addRow([
      apartment.name, apartment.address, own, apartment.competitors.length,
      prices.length ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length) : null,
      prices.length ? Math.min(...prices) : null, prices.length ? Math.max(...prices) : null,
      apartment.monitoringDate ?? null, apartment.stayNights,
    ]);
  }
  [3, 5, 6, 7].forEach((column) => { summary.getColumn(column).numFmt = moneyFormat; });
  summary.getColumn(8).numFmt = "dd.mm.yyyy";
  styleSheet(summary, [28, 34, 19, 13, 23, 15, 15, 15, 9]);

  const history = workbook.addWorksheet("История цен");
  history.addRow(["Проверено", "Квартира", "Объект", "Тип", "Дата заезда", "Ночей", "Общая стоимость, ₽", "Цена за сутки, ₽", "Статус", "Сотрудник", "Ссылка"]);
  for (const snapshot of snapshots) {
    const apartment = snapshot.apartment ?? snapshot.competitor?.apartment;
    const targetName = snapshot.apartment?.name ?? snapshot.competitor?.name ?? "—";
    const targetUrl = snapshot.apartment?.avitoUrl ?? snapshot.competitor?.url ?? "";
    history.addRow([
      snapshot.capturedAt, apartment?.name ?? "—", targetName,
      snapshot.apartmentId ? "Наша квартира" : "Конкурент", snapshot.checkInDate,
      snapshot.nights, snapshot.totalPrice, snapshot.price, snapshot.status,
      snapshot.recordedBy ?? "—", targetUrl,
    ]);
  }
  [7, 8].forEach((column) => { history.getColumn(column).numFmt = moneyFormat; });
  [1, 5].forEach((column) => { history.getColumn(column).numFmt = column === 1 ? "dd.mm.yyyy hh:mm" : "dd.mm.yyyy"; });
  styleSheet(history, [19, 28, 28, 16, 15, 9, 20, 19, 16, 18, 42]);

  const checks = workbook.addWorksheet("Проверки");
  checks.addRow(["Дата и время", "Квартира", "Период", "Статус", "Проверено", "Успешно", "Пропущено"]);
  for (const run of runs) checks.addRow([run.startedAt, run.apartment.name, run.mode, run.status, run.checkedCount, run.successCount, run.failedCount]);
  checks.getColumn(1).numFmt = "dd.mm.yyyy hh:mm";
  styleSheet(checks, [20, 30, 20, 23, 13, 13, 13]);

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="price-report-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
