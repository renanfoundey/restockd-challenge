import type { SKU } from "@/lib/types";

export interface StockHistoryPoint {
  date: string;
  stock?: number;
  forecast?: number;
  dailySales?: number;
  isToday?: boolean;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateStockHistory(sku: SKU): StockHistoryPoint[] {
  const seed = hashCode(sku.id);
  const days = 90;
  const today = new Date();

  let stock = sku.currentStock;
  const data: { date: Date; stock: number; sales: number }[] = [];

  // Work backwards from today
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Deterministic daily variation based on seed + day index
    const variation = 0.6 + (((seed * (i + 1) * 7) % 100) / 100) * 0.8;
    const sales = Math.round(sku.avgDailySales * variation);

    data.unshift({ date, stock, sales });

    // Going backwards: previous day had more stock (before today's sales)
    stock += sales;

    // Simulate replenishment events
    if (stock > sku.reorderPoint * 3) {
      stock -= Math.round(sku.avgDailySales * 25);
      if (stock < sku.reorderPoint) stock = sku.reorderPoint + Math.round(sku.avgDailySales * 5);
    }
  }

  const history: StockHistoryPoint[] = data.map((d, idx) => ({
    date: d.date.toISOString().split("T")[0],
    stock: Math.max(0, d.stock),
    dailySales: d.sales,
    isToday: idx === data.length - 1,
  }));

  // Forecast next 30 days from current stock
  const forecastDays = 30;
  const lastStock = history[history.length - 1]?.stock ?? sku.currentStock;
  // Anchor the forecast line so it joins seamlessly with the actual stock line
  history[history.length - 1] = {
    ...history[history.length - 1],
    forecast: lastStock,
  };
  let projected = lastStock;
  for (let i = 1; i <= forecastDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    // Same deterministic variation pattern, projected forward
    const variation = 0.7 + (((seed * (i + 1) * 11) % 100) / 100) * 0.6;
    const projectedSales = Math.round(sku.avgDailySales * variation);
    projected = Math.max(0, projected - projectedSales);
    history.push({
      date: date.toISOString().split("T")[0],
      forecast: projected,
    });
  }

  return history;
}

export interface ForecastInsight {
  daysUntilReorder: number | null;
  reorderDate: string | null;
  recommendedQty: number;
}

export function deriveForecastInsight(sku: SKU): ForecastInsight {
  const today = new Date();
  const daysUntilReorder =
    sku.avgDailySales > 0
      ? Math.max(0, Math.ceil((sku.currentStock - sku.reorderPoint) / sku.avgDailySales))
      : null;
  let reorderDate: string | null = null;
  if (daysUntilReorder !== null) {
    const d = new Date(today);
    d.setDate(d.getDate() + daysUntilReorder);
    reorderDate = d.toISOString().split("T")[0];
  }
  // Cover the next ~30 days of demand from the reorder point + lead time buffer
  const recommendedQty = Math.max(
    sku.reorderPoint,
    Math.round(sku.avgDailySales * (30 + sku.leadTimeDays))
  );
  return { daysUntilReorder, reorderDate, recommendedQty };
}
