import type { ReorderAction, ReorderRecommendation } from "@/lib/types";
import { recommendations } from "./recommendations";

// With the 12x recommendation pool (~360 items), large slices give each
// action a realistic, hundreds-of-items workload that requires pagination.
const recsRA1 = recommendations.slice(0, 180);
const recsRA2 = recommendations.slice(40, 220);
const recsRA3 = recommendations.slice(80, 240);
const recsRA4 = recommendations.slice(120, 340);

const sumCost = (recs: ReorderRecommendation[]) =>
  Math.round(recs.reduce((s, r) => s + r.estimatedCost, 0));

export const reorderActions: ReorderAction[] = [
  {
    id: "RA-001",
    name: "Spring Essentials Restock",
    type: "reorder",
    warehouseId: "WH-EAST-01",
    warehouseName: "East Distribution Center",
    storeId: "STR-001",
    storeName: "SoHo Flagship",
    categories: ["Tops", "Dresses", "Accessories"],
    status: "Completed",
    createdDate: "2026-02-15",
    skuCount: recsRA1.length,
    totalValue: sumCost(recsRA1),
    recommendations: recsRA1,
  },
  {
    id: "RA-002",
    name: "Activewear Q2 Replenishment",
    type: "reorder",
    warehouseId: "WH-WEST-01",
    warehouseName: "West Coast Hub",
    storeId: "STR-002",
    storeName: "Melrose Avenue",
    categories: ["Activewear"],
    status: "Approved",
    createdDate: "2026-03-20",
    skuCount: recsRA2.length,
    totalValue: sumCost(recsRA2),
    recommendations: recsRA2,
  },
  {
    id: "RA-003",
    name: "Denim & Bottoms Reorder",
    type: "reorder",
    warehouseId: "WH-CENT-01",
    warehouseName: "Central Fulfillment",
    storeId: "STR-005",
    storeName: "Spring Pop-Up",
    categories: ["Denim", "Bottoms"],
    status: "Ready",
    createdDate: "2026-04-01",
    skuCount: recsRA3.length,
    totalValue: sumCost(recsRA3),
    recommendations: recsRA3,
  },
  {
    id: "RA-004",
    name: "Online Channel Fast-Movers",
    type: "reorder",
    warehouseId: "WH-NRTH-01",
    warehouseName: "Northern Depot",
    storeId: "STR-006",
    storeName: "Restockd Online",
    categories: ["Tops", "Outerwear", "Footwear"],
    status: "Draft",
    createdDate: "2026-04-07",
    skuCount: recsRA4.length,
    totalValue: sumCost(recsRA4),
    recommendations: recsRA4,
  },
];
