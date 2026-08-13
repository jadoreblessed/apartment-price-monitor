export interface Competitor {
  id: string;
  name: string;
  url: string;
  price: number;
  updatedAt: string;
}

export interface PriceHistoryPoint {
  id: string;
  price: number | null;
  status: string;
  capturedAt: string;
  capturedAtLabel: string;
}

export interface Apartment {
  id: string;
  name: string;
  address: string;
  avitoUrl: string;
  realityCalendarUrl: string;
  price: number;
  updatedAt: string;
  competitors: Competitor[];
  priceHistory?: PriceHistoryPoint[];
}
