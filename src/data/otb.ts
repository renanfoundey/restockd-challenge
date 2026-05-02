// Open-to-buy: per-category quarterly budget. In a real merchandising system
// this is the constraint every Buy decision is made against. Stored values
// are the budget + spent-to-date; "committed" (= pending Bought items not yet
// landed) is computed at runtime from the marketplace Bought queue.

export interface CategoryBudget {
  category: string;
  quarter: string; // e.g. "Q3 2026"
  budgetUSD: number;
  spentUSD: number; // already landed + paid
}

export const CURRENT_QUARTER = "Q3 2026";

export const categoryBudgets: CategoryBudget[] = [
  { category: "Outerwear", quarter: CURRENT_QUARTER, budgetUSD: 240_000, spentUSD: 142_500 },
  { category: "Tops", quarter: CURRENT_QUARTER, budgetUSD: 180_000, spentUSD: 98_300 },
  { category: "Bottoms", quarter: CURRENT_QUARTER, budgetUSD: 160_000, spentUSD: 71_400 },
  { category: "Denim", quarter: CURRENT_QUARTER, budgetUSD: 140_000, spentUSD: 88_900 },
  { category: "Dresses", quarter: CURRENT_QUARTER, budgetUSD: 120_000, spentUSD: 49_700 },
  { category: "Activewear", quarter: CURRENT_QUARTER, budgetUSD: 200_000, spentUSD: 156_200 },
  { category: "Accessories", quarter: CURRENT_QUARTER, budgetUSD: 90_000, spentUSD: 42_100 },
  { category: "Footwear", quarter: CURRENT_QUARTER, budgetUSD: 150_000, spentUSD: 67_800 },
];

export function getBudget(category: string): CategoryBudget | undefined {
  return categoryBudgets.find((b) => b.category === category);
}

// Forecasted demand gap by category for the upcoming planning horizon. Drives
// the "Forecast fit" signal on each marketplace item — the planner sees
// whether buying this item materially closes a real demand gap or not.
export interface CategoryGap {
  category: string;
  forecastUnits: number; // 90-day demand
  onHandUnits: number;
  onOrderUnits: number; // open POs not yet received
  gapUnits: number; // forecastUnits - onHand - onOrder, floored at 0
}

export const categoryGaps: CategoryGap[] = [
  { category: "Outerwear", forecastUnits: 4800, onHandUnits: 2100, onOrderUnits: 900, gapUnits: 1800 },
  { category: "Tops", forecastUnits: 9200, onHandUnits: 5800, onOrderUnits: 1400, gapUnits: 2000 },
  { category: "Bottoms", forecastUnits: 5400, onHandUnits: 3200, onOrderUnits: 800, gapUnits: 1400 },
  { category: "Denim", forecastUnits: 6100, onHandUnits: 4400, onOrderUnits: 1200, gapUnits: 500 },
  { category: "Dresses", forecastUnits: 4200, onHandUnits: 2300, onOrderUnits: 600, gapUnits: 1300 },
  { category: "Activewear", forecastUnits: 8800, onHandUnits: 3600, onOrderUnits: 1500, gapUnits: 3700 },
  { category: "Accessories", forecastUnits: 3600, onHandUnits: 2900, onOrderUnits: 400, gapUnits: 300 },
  { category: "Footwear", forecastUnits: 3000, onHandUnits: 1700, onOrderUnits: 500, gapUnits: 800 },
];

export function getGap(category: string): CategoryGap | undefined {
  return categoryGaps.find((g) => g.category === category);
}
