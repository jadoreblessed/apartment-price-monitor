import type { LaunchOptions } from "playwright";

type ProxyOptions = NonNullable<LaunchOptions["proxy"]>;

export function getProxyOptions(): ProxyOptions | undefined {
  const server = process.env.PROXY_SERVER?.trim();
  const username = process.env.PROXY_USERNAME?.trim();
  const password = process.env.PROXY_PASSWORD?.trim();

  if (!server && !username && !password) return undefined;

  if (!server || !username || !password) {
    throw new Error(
      "Прокси настроен не полностью. Заполните PROXY_SERVER, PROXY_USERNAME и PROXY_PASSWORD в .env."
    );
  }

  return { server, username, password };
}

export function describeProxy(proxy: ProxyOptions | undefined): string {
  return proxy ? `Прокси включён: ${proxy.server}` : "Прокси не настроен";
}
