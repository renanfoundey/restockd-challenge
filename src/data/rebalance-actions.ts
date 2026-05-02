import type { RebalanceAction } from "@/lib/types";
import { rebalancingSuggestions } from "./rebalancing";
import { stores } from "./stores";

// Compute the involved store ids from a suggestion slice so the action header
// can render "N stores involved" without hard-coded warehouse references.
function storesInScope(
  suggestions: { fromStore: string; toStore: string }[]
): { storeIds: string[]; storeNames: string[] } {
  const ids = new Set<string>();
  for (const s of suggestions) {
    ids.add(s.fromStore);
    ids.add(s.toStore);
  }
  const storeIds = [...ids];
  const storeNames = storeIds.map(
    (id) => stores.find((s) => s.id === id)?.name ?? id
  );
  return { storeIds, storeNames };
}

const rba1Suggestions = rebalancingSuggestions.slice(0, 120);
const rba2Suggestions = rebalancingSuggestions.slice(40, 180);
const rba3Suggestions = rebalancingSuggestions.slice(20, 180);

const rba1Stores = storesInScope(rba1Suggestions);
const rba2Stores = storesInScope(rba2Suggestions);
const rba3Stores = storesInScope(rba3Suggestions);

// Rebalance actions never reference warehouses — moves are store-to-store.
// We keep the legacy warehouseId/Name fields empty so the UI renders "—".
export const rebalanceActions: RebalanceAction[] = [
  {
    id: "RBA-001",
    name: "West Coast Spring Rebalance",
    type: "rebalance",
    warehouseId: "",
    warehouseName: "",
    storeId: rba1Stores.storeIds[0] ?? "",
    storeName: rba1Stores.storeNames[0] ?? "",
    storeIds: rba1Stores.storeIds,
    storeNames: rba1Stores.storeNames,
    categories: ["Outerwear", "Tops", "Dresses"],
    status: "Completed",
    createdDate: "2026-03-01",
    skuCount: rba1Suggestions.length,
    totalValue: 0,
    suggestions: rba1Suggestions,
  },
  {
    id: "RBA-002",
    name: "Central Activewear Redistribution",
    type: "rebalance",
    warehouseId: "",
    warehouseName: "",
    storeId: rba2Stores.storeIds[0] ?? "",
    storeName: rba2Stores.storeNames[0] ?? "",
    storeIds: rba2Stores.storeIds,
    storeNames: rba2Stores.storeNames,
    categories: ["Activewear", "Bottoms"],
    status: "Sent to Provider",
    createdDate: "2026-03-25",
    skuCount: rba2Suggestions.length,
    totalValue: 0,
    suggestions: rba2Suggestions,
  },
  {
    id: "RBA-003",
    name: "Northern Cross-Network Transfer",
    type: "rebalance",
    warehouseId: "",
    warehouseName: "",
    storeId: rba3Stores.storeIds[0] ?? "",
    storeName: rba3Stores.storeNames[0] ?? "",
    storeIds: rba3Stores.storeIds,
    storeNames: rba3Stores.storeNames,
    categories: ["Outerwear", "Accessories"],
    status: "Ready to Send",
    createdDate: "2026-04-05",
    skuCount: rba3Suggestions.length,
    totalValue: 0,
    suggestions: rba3Suggestions,
  },
];
