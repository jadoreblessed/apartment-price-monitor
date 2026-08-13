import { prisma } from "@/lib/db";
import { runAllRealMonitoring } from "@/lib/monitoring";
import { AvitoSessionNotReadyError } from "@/lib/scraper";

async function main() {
  const startedAt = new Date();
  console.log(`[${startedAt.toLocaleString("ru-RU")}] Запуск мониторинга...`);

  const result = await runAllRealMonitoring({ headless: true });

  console.log(
    `Готово: квартир ${result.apartmentCount}, проверено ${result.checkedCount}, ` +
      `успешно ${result.successCount}, проблем ${result.blockedCount + result.failedCount}.`
  );
}

main()
  .catch((error) => {
    if (error instanceof AvitoSessionNotReadyError) {
      console.error(error.message);
    } else {
      console.error("Мониторинг завершился с ошибкой:", error);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
