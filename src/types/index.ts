export interface Competitor {
  id: string;
  name: string;
  url: string;
  price: number;
  updatedAt: string;
  checkStatus?: string;
  lastCheckAt?: string;
  isFresh?: boolean;
}

export interface PriceHistoryPoint {
  id: string;
  price: number | null;
  status: string;
  capturedAt: string;
  capturedAtLabel: string;
  checkInDateLabel?: string;
  nights?: number;
  totalPrice?: number | null;
  recordedBy?: string | null;
}

export interface Apartment {
  id: string;
  name: string;
  address: string;
  avitoUrl: string;
  realityCalendarUrl: string;
  monitoringDate: string;
  stayNights: number;
  price: number;
  updatedAt: string;
  checkStatus?: string;
  lastCheckAt?: string;
  isFresh?: boolean;
  competitors: Competitor[];
  priceHistory?: PriceHistoryPoint[];
  priceHistoryTotal?: number;
  monitoringRuns?: MonitoringRun[];
}

export interface MonitoringRun {
  id: string;
  mode: string;
  status: string;
  checkedCount: number;
  successCount: number;
  blockedCount: number;
  failedCount: number;
  startedAtLabel: string;
}
