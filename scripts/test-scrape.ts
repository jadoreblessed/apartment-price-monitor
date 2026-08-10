import { chromium } from "playwright";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Использование: npx tsx scripts/test-scrape.ts <URL объявления Avito>");
    process.exit(1);
  }

  // headless: false — чтобы своими глазами видеть, что показывает Avito (капча, блок и т.д.)
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  console.log("Открываю страницу...");
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "scripts/debug-screenshot.png", fullPage: true });
  console.log("Скриншот сохранён: scripts/debug-screenshot.png");
  console.log("Title страницы:", await page.title());

  const priceSelectors = [
    '[data-marker="item-view/item-price"]',
    '[itemprop="price"]',
    ".style-price-value",
  ];

  let found = false;
  for (const selector of priceSelectors) {
    const el = await page.$(selector);
    if (el) {
      console.log(`Найдено по селектору ${selector}:`, await el.textContent());
      found = true;
      break;
    }
  }

  if (!found) {
    console.log("Цена не найдена стандартными селекторами.");
    console.log("Проверь scripts/debug-screenshot.png — возможно капча/антибот.");
  }

  await browser.close();
}

main();