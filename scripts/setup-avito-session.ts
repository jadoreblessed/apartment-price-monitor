import { chromium } from "playwright";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { describeProxy, getProxyOptions } from "../src/lib/proxy";

async function main() {
  const profilePath = path.resolve("playwright-profile");
  const proxy = getProxyOptions();
  console.log(describeProxy(proxy));
  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    proxy,
    locale: "ru-RU",
    viewport: { width: 1440, height: 900 },
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://www.avito.ru/", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  console.log("Avito открыт с постоянным профилем.");
  console.log("Если появилась проверка, пройдите её вручную. Затем закройте окно браузера.");
  await context.waitForEvent("close");

  await mkdir(profilePath, { recursive: true });
  await writeFile(
    path.join(profilePath, ".session-ready"),
    `Сессия подтверждена: ${new Date().toISOString()}\n`,
    "utf8"
  );
  console.log("Сессия Avito сохранена. Автоматический мониторинг готов к запуску.");
}

main().catch((error) => {
  console.error("Не удалось подготовить сессию Avito:", error);
  process.exitCode = 1;
});
