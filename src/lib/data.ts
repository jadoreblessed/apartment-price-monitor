import { Apartment } from "@/types";

export const apartments: Apartment[] = [
  {
    id: "1",
    name: "1-комнатная квартира",
    address: "ул. Ленина, 25",
    avitoUrl: "https://avito.ru/",
    realityCalendarUrl: "https://realitycalendar.ru/",
    price: 5000,
    updatedAt: "Сегодня, 09:05",

    competitors: [
      {
        id: "c1",
        name: "Конкурент 1",
        url: "https://avito.ru/",
        price: 4500,
        updatedAt: "Сегодня, 09:04",
      },
      {
        id: "c2",
        name: "Конкурент 2",
        url: "https://avito.ru/",
        price: 5200,
        updatedAt: "Сегодня, 09:05",
      },
      {
        id: "c3",
        name: "Конкурент 3",
        url: "https://avito.ru/",
        price: 5500,
        updatedAt: "Сегодня, 09:05",
      },
    ],
  },

  {
    id: "2",
    name: "2-комнатная квартира",
    address: "ул. Центральная, 12",
    avitoUrl: "https://avito.ru/",
    realityCalendarUrl: "https://realitycalendar.ru/",
    price: 6500,
    updatedAt: "Сегодня, 09:06",

    competitors: [
      {
        id: "c4",
        name: "Конкурент 1",
        url: "https://avito.ru/",
        price: 5800,
        updatedAt: "Сегодня, 09:06",
      },
      {
        id: "c5",
        name: "Конкурент 2",
        url: "https://avito.ru/",
        price: 6200,
        updatedAt: "Сегодня, 09:06",
      },
      {
        id: "c6",
        name: "Конкурент 3",
        url: "https://avito.ru/",
        price: 7000,
        updatedAt: "Сегодня, 09:06",
      },
    ],
  },
];