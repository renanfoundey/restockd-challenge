import { RebalancingSuggestion } from "@/lib/types";
import { stores } from "./stores";

// Rebalancing moves existing inventory between STORES — shifting stock from
// lower-demand locations to higher-demand ones. The from/to fields reference
// store IDs and are joined to store names in the UI.
const baseRebalancingSuggestions: RebalancingSuggestion[] = [
  {
    id: "RB-001",
    skuId: "SKU-1001",
    productName: "Alpine Puffer Jacket",
    variant: "Black / L",
    fromStore: "STR-004",
    toStore: "STR-002",
    suggestedQty: 340,
    reason: "Outlet holding 340 units with slow sell-through. Melrose store running critical with 3 days of supply during peak mountain-retail season.",
  },
  {
    id: "RB-002",
    skuId: "SKU-4001",
    productName: "Performance Legging",
    variant: "Black / S",
    fromStore: "STR-002",
    toStore: "STR-005",
    suggestedQty: 200,
    reason: "Melrose holding 680 units against 15-day demand while Spring Pop-Up has 3-day supply. Austin gym partnerships creating elevated demand.",
  },
  {
    id: "RB-003",
    skuId: "SKU-3001",
    productName: "Slim Straight Denim",
    variant: "Indigo / 32",
    fromStore: "STR-003",
    toStore: "STR-001",
    suggestedQty: 150,
    reason: "Michigan Ave excess from winter slowdown. SoHo Flagship running low with strong spring denim demand in the Northeast.",
  },
  {
    id: "RB-004",
    skuId: "SKU-5001",
    productName: "Floral Midi Dress",
    variant: "Rose / M",
    fromStore: "STR-005",
    toStore: "STR-002",
    suggestedQty: 120,
    reason: "Pop-Up holding 180 units with moderate demand. Melrose spring event season creating 4x typical demand velocity for occasion dresses.",
  },
  {
    id: "RB-005",
    skuId: "SKU-2007",
    productName: "Oversized Graphic Tee",
    variant: "White / M",
    fromStore: "STR-001",
    toStore: "STR-006",
    suggestedQty: 250,
    reason: "Social-driven demand concentrated on online channel. SoHo has 500 units excess while online sold through allocation in 4 days.",
  },
  {
    id: "RB-006",
    skuId: "SKU-6001",
    productName: "Chelsea Ankle Boot",
    variant: "Tan / 8",
    fromStore: "STR-005",
    toStore: "STR-001",
    suggestedQty: 45,
    reason: "SoHo stockout imminent at 2-day supply. Pop-Up has 60 units with declining demand as Texas transitions to open-toe footwear.",
  },
  {
    id: "RB-007",
    skuId: "SKU-4003",
    productName: "Dry-Fit Training Tee",
    variant: "Navy / L",
    fromStore: "STR-003",
    toStore: "STR-005",
    suggestedQty: 180,
    reason: "Michigan Ave overstocked after slow Q1 sell-through. Pop-Up seeing 40% higher demand from Texas gym market.",
  },
  {
    id: "RB-008",
    skuId: "SKU-2003",
    productName: "Linen Blend Camp Shirt",
    variant: "Sky Blue / L",
    fromStore: "STR-003",
    toStore: "STR-002",
    suggestedQty: 160,
    reason: "Warm-weather item slow-moving in Chicago. Melrose already in spring buying mode with 3 weeks of demand remaining.",
  },
  {
    id: "RB-009",
    skuId: "SKU-3005",
    productName: "Relaxed Cargo Pant",
    variant: "Khaki / 32",
    fromStore: "STR-002",
    toStore: "STR-001",
    suggestedQty: 200,
    reason: "Melrose received double allocation in last reorder. SoHo needs replenishment for Northeast urban accounts showing strong demand.",
  },
  {
    id: "RB-010",
    skuId: "SKU-5003",
    productName: "Wrap Sundress",
    variant: "Terracotta / M",
    fromStore: "STR-001",
    toStore: "STR-005",
    suggestedQty: 80,
    reason: "SoHo holding 130 units against moderate demand. Pop-Up receiving surge orders ahead of summer resort season.",
  },
  {
    id: "RB-011",
    skuId: "SKU-1003",
    productName: "Merino Wool Overcoat",
    variant: "Charcoal / L",
    fromStore: "STR-002",
    toStore: "STR-003",
    suggestedQty: 90,
    reason: "Melrose overcoat demand dropping as temperatures rise. Michigan Ave still servicing cold-weather customers through April.",
  },
  {
    id: "RB-012",
    skuId: "SKU-7001",
    productName: "Leather Crossbody Bag",
    variant: "Cognac",
    fromStore: "STR-003",
    toStore: "STR-001",
    suggestedQty: 35,
    reason: "Michigan Ave holding 50 units with low attachment rate. SoHo pairing with spring dress merchandising drives 3x accessory conversion.",
  },
];

// Expand to give detail pages a paginated, hundreds-of-suggestions list.
// Rotate from/to stores across copies so the same SKU isn't moved on the same
// lane twice.
const REB_COPIES = 16;
const REB_LABELS = [
  "",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
];
const STORE_IDS = stores.map((s) => s.id);

export const rebalancingSuggestions: RebalancingSuggestion[] = Array.from(
  { length: REB_COPIES },
  (_, i) =>
    baseRebalancingSuggestions.map((s, idx) => {
      if (i === 0) return s;
      const seed = (idx + i * 5) % 9;
      const fromIdx = (STORE_IDS.indexOf(s.fromStore) + i) % STORE_IDS.length;
      let toIdx = (STORE_IDS.indexOf(s.toStore) + i + 1) % STORE_IDS.length;
      if (toIdx === fromIdx) toIdx = (toIdx + 1) % STORE_IDS.length;
      return {
        ...s,
        id: `${s.id}-${REB_LABELS[i]}`,
        fromStore: STORE_IDS[fromIdx],
        toStore: STORE_IDS[toIdx],
        suggestedQty: Math.max(10, Math.round(s.suggestedQty * (0.5 + seed / 12))),
      };
    })
).flat();
