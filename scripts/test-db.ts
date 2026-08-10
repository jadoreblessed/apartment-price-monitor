import { prisma } from "@/lib/db";

async function main() {
  const apartment = await prisma.apartment.create({
    data: {
      name: "Тестовая квартира",
      address: "ул. Тестовая, 1",
      avitoUrl: "https://avito.ru/test",
      realityCalendarUrl: "https://realitycalendar.ru/test",
    },
  });

  console.log("Создано:", apartment);

  const all = await prisma.apartment.findMany();
  console.log("Всего квартир в базе:", all.length);
}

main().finally(() => prisma.$disconnect());