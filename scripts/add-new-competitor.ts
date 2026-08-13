import { prisma } from "@/lib/db";

const COMPETITOR_URL =
  "https://www.avito.ru/moskva/kvartiry/kvartira-studiya_25_m_2_krovati_4336630166";

async function main() {
  const apartment = await prisma.apartment.findFirst({ orderBy: { createdAt: "asc" } });
  if (!apartment) {
    throw new Error("Сначала добавьте свою квартиру через интерфейс.");
  }

  const existing = await prisma.competitor.findFirst({
    where: { apartmentId: apartment.id, url: COMPETITOR_URL },
  });
  if (existing) {
    console.log(`Конкурент уже добавлен к квартире «${apartment.name}».`);
    return;
  }

  await prisma.competitor.create({
    data: {
      apartmentId: apartment.id,
      name: "Квартира-студия 25 м²",
      url: COMPETITOR_URL,
    },
  });
  console.log(`Конкурент добавлен к квартире «${apartment.name}».`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
