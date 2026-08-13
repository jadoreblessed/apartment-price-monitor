import path from "node:path";
import { access } from "node:fs/promises";
import { chromium, type BrowserContext, type Page } from "playwright";
import { describeProxy, getProxyOptions } from "@/lib/proxy";

export interface ScrapeResult {
  url: string;
  price: number | null;
  totalPrice: number | null;
  nights: number;
  status: "ok" | "not_found" | "blocked";
}

export interface ScrapeOptions {
  headless?: boolean;
  allowManualCheck?: boolean;
  checkInDate?: Date;
  nights?: number;
}

const PROFILE_PATH = path.resolve("playwright-profile");
const SESSION_READY_PATH = path.join(PROFILE_PATH, ".session-ready");
const BETWEEN_REQUESTS_MIN_MS = 10_000;
const BETWEEN_REQUESTS_MAX_MS = 25_000;

export class AvitoSessionNotReadyError extends Error {
  constructor() {
    super(
      "Сессия Avito не подготовлена. Выполните npm run avito:session, пройдите проверку и закройте окно браузера."
    );
    this.name = "AvitoSessionNotReadyError";
  }
}

const PRICE_SELECTORS = [
  '[data-marker="item-view/item-price"]',
  '[data-marker="item-view/item-price-container"]',
  '[itemprop="price"]',
  'meta[itemprop="price"]',
  ".style-price-value",
];

const TOTAL_PRICE_SELECTORS = [
  '[data-marker="booking-widget/price-details/total"]',
  '[data-marker="item-view/booking/total-price"]',
  '[data-marker*="total-price"]',
  '[class*="totalPrice"]',
];

const TOTAL_PRICE_TEXT_PATTERN = /([\d\s\u00a0\u202f]+)\s*₽\s*за\s*весь\s*период/i;
const BOOKING_PRICE_TIMEOUT_MS = 20_000;

const BLOCKED_TEXTS = [
  "доступ ограничен",
  "подтвердите, что вы не робот",
  "пройдите проверку",
  "подозрительную активность",
  "введите символы с картинки",
];

const MANUAL_CHECK_TIMEOUT_MS = 5 * 60_000;
const MANUAL_CHECK_POLL_MS = 2_000;

function parsePrice(text: string): number | null {
  const digitsOnly = text.replace(/[^\d]/g, "");
  if (!digitsOnly) return null;

  const price = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(ms);
}

async function isBlocked(page: Page): Promise<boolean> {
  const title = await page.title().catch(() => "");
  const body = await page.locator("body").innerText().catch(() => "");
  const pageText = `${title}\n${body}`.toLowerCase();

  return BLOCKED_TEXTS.some((text) => pageText.includes(text));
}

async function waitForManualCheck(page: Page): Promise<boolean> {
  console.error(
    "Avito ограничил доступ. Пройдите проверку в открытом окне — скрипт подождёт до 5 минут."
  );

  const deadline = Date.now() + MANUAL_CHECK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (page.isClosed()) return false;

    await delay(MANUAL_CHECK_POLL_MS);

    if (!(await isBlocked(page))) {
      await randomDelay(2_000, 4_000);
      return true;
    }
  }

  console.error("Проверка Avito не пройдена за 5 минут. Сбор остановлен.");
  return false;
}

async function readPrice(page: Page): Promise<number | null> {
  for (const selector of PRICE_SELECTORS) {
    const element = page.locator(selector).first();
    if ((await element.count()) === 0) continue;

    const rawValue =
      (await element.getAttribute("content").catch(() => null)) ??
      (await element.getAttribute("data-value").catch(() => null)) ??
      (await element.textContent().catch(() => null));

    if (!rawValue) continue;

    const price = parsePrice(rawValue);
    if (price !== null) return price;
  }

  return null;
}

async function readPriceFromSelectors(page: Page, selectors: string[]): Promise<number | null> {
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if ((await element.count()) === 0) continue;
    const rawValue = await element.textContent().catch(() => null);
    const price = rawValue ? parsePrice(rawValue) : null;
    if (price !== null) return price;
  }
  return null;
}

async function readBookingTotalPrice(page: Page): Promise<number | null> {
  await page
    .waitForFunction(
      () => /₽\s*за\s*весь\s*период/i.test(document.body?.innerText ?? ""),
      undefined,
      { timeout: BOOKING_PRICE_TIMEOUT_MS }
    )
    .catch(() => {});

  const bodyText = await page.locator("body").innerText().catch(() => "");
  const textMatch = bodyText.match(TOTAL_PRICE_TEXT_PATTERN);
  const textPrice = textMatch ? parsePrice(textMatch[1]) : null;
  if (textPrice !== null) return textPrice;

  return readPriceFromSelectors(page, TOTAL_PRICE_SELECTORS);
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildAvitoMonitoringUrl(url: string, checkInDate?: Date, nights = 1): string {
  const result = new URL(url);
  result.searchParams.delete("guestsDetailed");
  if (!checkInDate) return result.toString();

  const safeNights = Math.max(1, Math.round(nights));
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setUTCDate(checkOutDate.getUTCDate() + safeNights);
  result.searchParams.set("checkIn", formatDate(checkInDate));
  result.searchParams.set("checkOut", formatDate(checkOutDate));
  return result.toString();
}

async function scrapeOnePage(
  page: Page,
  url: string,
  allowManualCheck: boolean,
  options: ScrapeOptions
): Promise<ScrapeResult> {
  const nights = Math.max(1, Math.round(options.nights ?? 1));
  const monitoringUrl = buildAvitoMonitoringUrl(url, options.checkInDate, nights);
  try {
    const response = await page.goto(monitoringUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await randomDelay(3_000, 6_000);

    if ([403, 429].includes(response?.status() ?? 0) || (await isBlocked(page))) {
      if (!allowManualCheck || !(await waitForManualCheck(page))) {
        return { url, price: null, totalPrice: null, nights, status: "blocked" };
      }
    }

    const requiresBookingTotal = Boolean(options.checkInDate) && nights > 1;
    const totalPrice = requiresBookingTotal ? await readBookingTotalPrice(page) : null;
    const advertisedNightlyPrice = await readPrice(page);
    const price = requiresBookingTotal
      ? totalPrice !== null
        ? Math.round(totalPrice / nights)
        : null
      : advertisedNightlyPrice;
    return price === null
      ? { url, price: null, totalPrice, nights, status: "not_found" }
      : { url, price, totalPrice: totalPrice ?? price * nights, nights, status: "ok" };
  } catch (error) {
    console.error(`Ошибка при сборе ${url}:`, error);
    return { url, price: null, totalPrice: null, nights, status: "blocked" };
  }
}

async function createContext(options: ScrapeOptions = {}): Promise<BrowserContext> {
  try {
    await access(SESSION_READY_PATH);
  } catch {
    throw new AvitoSessionNotReadyError();
  }

  const proxy = getProxyOptions();
  console.log(describeProxy(proxy));

  return chromium.launchPersistentContext(PROFILE_PATH, {
    headless: options.headless ?? false,
    proxy,
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    viewport: { width: 1440, height: 900 },
  });
}

export async function scrapePrice(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const context = await createContext(options);

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    return await scrapeOnePage(page, url, options.allowManualCheck ?? !options.headless, options);
  } finally {
    await context.close().catch(() => {});
  }
}

export async function scrapeMultiple(
  urls: string[],
  onProgress?: (result: ScrapeResult, index: number, total: number) => void,
  options: ScrapeOptions = {}
): Promise<ScrapeResult[]> {
  const context = await createContext(options);
  const results: ScrapeResult[] = [];

  try {
    // Один таб переиспользуется для всего прохода. Его не закрываем между URL.
    const page = context.pages()[0] ?? (await context.newPage());

    for (let i = 0; i < urls.length; i++) {
      if (page.isClosed()) {
        console.error("Окно браузера было закрыто. Сбор остановлен.");
        break;
      }

      const result = await scrapeOnePage(
        page,
        urls[i],
        options.allowManualCheck ?? !options.headless,
        options
      );
      results.push(result);
      onProgress?.(result, i, urls.length);

      if (result.status === "blocked") {
        for (let rest = i + 1; rest < urls.length; rest++) {
          const blocked = {
            url: urls[rest],
            price: null,
            totalPrice: null,
            nights: Math.max(1, Math.round(options.nights ?? 1)),
            status: "blocked" as const,
          };
          results.push(blocked);
          onProgress?.(blocked, rest, urls.length);
        }
        break;
      }
      if (i < urls.length - 1) {
        await randomDelay(BETWEEN_REQUESTS_MIN_MS, BETWEEN_REQUESTS_MAX_MS);
      }
    }
  } finally {
    await context.close().catch(() => {});
  }

  return results;
}
