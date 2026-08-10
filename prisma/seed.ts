import { PrismaClient } from "@prisma/client";
import { apartments as mockApartments } from "../src/lib/data";

const prisma = new PrismaClient();

async function main() {
  for (const apt of mockApartments) {
    const apartment = await prisma.apartment.create({
      data: {
        name: apt.name,
        address: apt.address,
        avitoUrl: apt.avitoUrl,
        realityCalendarUrl: apt.realityCalendarUrl,
      },
    });

    // начальная цена — вручную, из твоих текущих моков
    await prisma.priceSnapshot.create({
      data: {
        apartmentId: apartment.id,
        price: apt.price,
        status: "manual",
      },
    });

    for (const comp of apt.competitors) {
      const competitor = await prisma.competitor.create({
        data: {
          name: comp.name,
          url: comp.url,
          apartmentId: apartment.id,
        },
      });

      await prisma.priceSnapshot.create({
        data: {
          competitorId: competitor.id,
          price: comp.price,
          status: "manual",
        },
      });
    }
  }

  console.log("Сид завершён");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());