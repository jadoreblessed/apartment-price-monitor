import { prisma } from "@/lib/db";
import { scrapePrice } from "@/lib/scraper";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Использование: npx tsx scripts/test-scrape-to-db.ts <URL>");
    process.exit(1);
  }

  let apartment = await prisma.apartment.findFirst({
    where: { avitoUrl: url },
  });

  if (!apartment) {
    apartment = await prisma.apartment.create({
      data: {
        name: "Тест скрейпинга",
        address: "—",
        avitoUrl: url,
        realityCalendarUrl: "https://realitycalendar.ru/test",
      },
    });
    console.log("Создана квартира:", apartment.id);
  }

  console.log("Скрейплю цену...");
  const result = await scrapePrice(url);
  console.log("Результат скрейпинга:", result);

  const snapshot = await prisma.priceSnapshot.create({
    data: {
      apartmentId: apartment.id,
      price: result.price,
      status: result.status,
    },
  });

  console.log("Сохранён снапшот:", snapshot);
}

main().finally(() => prisma.$disconnect());