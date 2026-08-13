import { prisma } from "@/lib/db";

async function main() {
  const testApartments = await prisma.apartment.findMany({
    where: { name: { startsWith: "Тест скрейпинга" } },
    select: { id: true, name: true },
  });

  const testApartmentIds = testApartments.map((item) => item.id);
  const [mockSnapshots, mockRuns, , deletedApartments] = await prisma.$transaction([
    prisma.priceSnapshot.deleteMany({ where: { status: "mock" } }),
    prisma.monitoringRun.deleteMany({ where: { mode: "mock" } }),
    prisma.priceSnapshot.deleteMany({
      where: { apartmentId: { in: testApartmentIds } },
    }),
    prisma.apartment.deleteMany({
      where: { id: { in: testApartmentIds } },
    }),
  ]);

  console.log(
    `Удалено: тестовых квартир ${deletedApartments.count}, mock-замеров ${mockSnapshots.count}, mock-запусков ${mockRuns.count}.`
  );
}

main()
  .catch((error) => {
    console.error("Не удалось очистить тестовые данные:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
