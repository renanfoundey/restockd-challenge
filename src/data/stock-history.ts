import type { SKU } from "@/lib/types";

export interface StockHistoryPoint {
  date: string;
  stock: number;
  dailySales: number;
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
  const points: StockHistoryPoint[] = [];
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

  return data.map((d) => ({
    date: d.date.toISOString().split("T")[0],
    stock: Math.max(0, d.stock),
    dailySales: d.sales,
  }));
}
