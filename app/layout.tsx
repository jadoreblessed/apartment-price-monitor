import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Price Monitor — квартиры",
  description: "Ручная проверка и сравнение цен посуточной аренды",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
