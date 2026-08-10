import { scrapeMultiple } from "@/lib/scraper";

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error("Использование: npx tsx scripts/test-scrape-multiple.ts <URL1> <URL2> ...");
    process.exit(1);
  }

  console.log(`Начинаю сбор ${urls.length} ссылок с паузами...`);

  const results = await scrapeMultiple(urls, (result, i, total) => {
    console.log(`[${i + 1}/${total}] ${result.status} — ${result.price ?? "—"} ₽ — ${result.url}`);
  });

  console.log("\nИтого:", results);
}

main();