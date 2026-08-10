import { chromium, type Browser } from "playwright";

export interface ScrapeResult {
  url: string;
  price: number | null;
  status: "ok" | "not_found" | "blocked";
}

const PRICE_SELECTORS = [
  '[data-marker="item-view/item-price"]',
  '[itemprop="price"]',
  ".style-price-value",
];

function parsePrice(text: string): number | null {
  const digitsOnly = text.replace(/[^\d]/g, "");
  if (!digitsOnly) return null;
  return parseInt(digitsOnly, 10);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// случайная задержка в диапазоне, чтобы не быть предсказуемо-механическими
function randomDelay(minMs: number, maxMs: number) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(ms);
}

async function scrapeOnePage(browser: Browser, url: string): Promise<ScrapeResult> {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await delay(2000 + Math.random() * 1500); // даём странице дозагрузиться

    for (const selector of PRICE_SELECTORS) {
      const el = await page.$(selector);
      if (el) {
        const text = await el.textContent();
        if (text) {
          const price = parsePrice(text);
          if (price) {
            return { url, price, status: "ok" };
          }
        }
      }
    }

    return { url, price: null, status: "not_found" };
  } catch (error) {
    console.error(`Ошибка при скрейпинге ${url}:`, error);
    return { url, price: null, status: "blocked" };
  } finally {
    await page.close();
  }
}

// Одна ссылка — оставляем для точечного теста
export async function scrapePrice(url: string): Promise<ScrapeResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    return await scrapeOnePage(browser, url);
  } finally {
    await browser.close();
  }
}

// Пакетный сбор — один браузер на все ссылки, с паузами между запросами
export async function scrapeMultiple(
  urls: string[],
  onProgress?: (result: ScrapeResult, index: number, total: number) => void
): Promise<ScrapeResult[]> {
  const browser = await chromium.launch({ headless: true });
  const results: ScrapeResult[] = [];

  try {
    for (let i = 0; i < urls.length; i++) {
      const result = await scrapeOnePage(browser, urls[i]);
      results.push(result);
      onProgress?.(result, i, urls.length);

      // пауза перед следующим запросом (кроме последнего)
      if (i < urls.length - 1) {
        await randomDelay(8000, 20000); // 8–20 секунд между объявлениями
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}