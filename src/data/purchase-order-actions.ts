import type { PurchaseOrderAction, POLineItem } from "@/lib/types";
import { purchaseOrders } from "./purchase-orders";
import { warehouses } from "./warehouses";
import { stores } from "./stores";

// Pull every line item from all POs that share a given supplier so each
// replenishment action shows a realistic-length list. Excludes the cancelled POs.
function itemsForSupplier(supplierId: string): POLineItem[] {
  return purchaseOrders
    .filter((po) => po.supplierId === supplierId && po.status !== "Cancelled")
    .flatMap((po) => po.items);
}

// Expand a supplier's items into a paginated-friendly hundreds-of-items list.
// Variants tweak quantities deterministically and keep lineTotal consistent.
function expandItems(base: POLineItem[], targetCount: number): POLineItem[] {
  if (base.length === 0 || targetCount <= base.length) return base;
  const result: POLineItem[] = [...base];
  let i = base.length;
  while (result.length < targetCount) {
    const src = base[i % base.length];
    const seed = (i * 13) % 17;
    // Per-line qty around 0.18–0.4 of base so a typical replenishment action
    // totals $300K–$900K — the realistic per-cycle PO size an inventory
    // manager plans against at this brand scale.
    const qtyMul = 0.18 + (seed / 17) * 0.22;
    const quantity = Math.max(20, Math.round(src.quantity * qtyMul));
    const lineTotal = Math.round(quantity * src.unitCost * 100) / 100;
    result.push({
      ...src,
      skuId: `${src.skuId}-X${i}`,
      quantity,
      lineTotal,
    });
    i++;
  }
  return result;
}

function totalOf(items: POLineItem[]): number {
  return Math.round(items.reduce((sum, li) => sum + li.lineTotal, 0) * 100) / 100;
}

// Derive the destination summary from a distributed line-item list. Returns
// the unique warehouse + store ids and names so the action header can show
// "3 warehouses · 5 stores" instead of a misleading single field.
function destinationsOf(items: POLineItem[]): {
  warehouseIds: string[];
  warehouseNames: string[];
  storeIds: string[];
  storeNames: string[];
} {
  const whIds = new Map<string, string>();
  const stIds = new Map<string, string>();
  for (const li of items) {
    if (li.destinationWarehouseId && li.destinationWarehouseName) {
      whIds.set(li.destinationWarehouseId, li.destinationWarehouseName);
    }
    if (li.destinationStoreId && li.destinationStoreName) {
      stIds.set(li.destinationStoreId, li.destinationStoreName);
    }
  }
  return {
    warehouseIds: [...whIds.keys()],
    warehouseNames: [...whIds.values()],
    storeIds: [...stIds.keys()],
    storeNames: [...stIds.values()],
  };
}

// Spread line items across multiple warehouses and stores so the
// manufacturer → warehouse → store distribution story is concrete on the
// detail page. Deterministic per-index assignment keeps audit checks stable.
function distribute(items: POLineItem[]): POLineItem[] {
  if (warehouses.length === 0 || stores.length === 0) return items;
  return items.map((li, idx) => {
    const wh = warehouses[idx % warehouses.length];
    const st = stores[(idx * 3) % stores.length];
    return {
      ...li,
      destinationWarehouseId: wh.id,
      destinationWarehouseName: wh.name,
      destinationStoreId: st.id,
      destinationStoreName: st.name,
    };
  });
}

const eastwayItems = distribute(expandItems(itemsForSupplier("SUP-001"), 180));
const pacificItems = distribute(expandItems(itemsForSupplier("SUP-003"), 200));
const summitItems = distribute(expandItems(itemsForSupplier("SUP-004"), 160));
const coastalItems = distribute(expandItems(itemsForSupplier("SUP-007"), 220));
const milanoItems = distribute(expandItems(itemsForSupplier("SUP-002"), 140));

const eastwayDest = destinationsOf(eastwayItems);
const pacificDest = destinationsOf(pacificItems);
const summitDest = destinationsOf(summitItems);
const coastalDest = destinationsOf(coastalItems);
const milanoDest = destinationsOf(milanoItems);

export const purchaseOrderActions: PurchaseOrderAction[] = [
  {
    id: "POA-001",
    name: "Eastway Spring Collection",
    type: "purchase-order",
    warehouseId: eastwayDest.warehouseIds[0] ?? "WH-EAST-01",
    warehouseName: eastwayDest.warehouseNames[0] ?? "East Distribution Center",
    storeId: eastwayDest.storeIds[0] ?? "STR-001",
    storeName: eastwayDest.storeNames[0] ?? "SoHo Flagship",
    warehouseIds: eastwayDest.warehouseIds,
    warehouseNames: eastwayDest.warehouseNames,
    storeIds: eastwayDest.storeIds,
    storeNames: eastwayDest.storeNames,
    categories: ["Outerwear", "Tops"],
    status: "Completed",
    createdDate: "2026-01-05",
    skuCount: eastwayItems.length,
    totalValue: totalOf(eastwayItems),
    supplierId: "SUP-001",
    supplierName: "Eastway Textiles",
    expectedDelivery: "2026-01-15",
    lineItems: eastwayItems,
  },
  {
    id: "POA-002",
    name: "Pacific Denim Restock",
    type: "purchase-order",
    warehouseId: pacificDest.warehouseIds[0] ?? "WH-WEST-01",
    warehouseName: pacificDest.warehouseNames[0] ?? "West Coast Hub",
    storeId: pacificDest.storeIds[0] ?? "STR-002",
    storeName: pacificDest.storeNames[0] ?? "Melrose Avenue",
    warehouseIds: pacificDest.warehouseIds,
    warehouseNames: pacificDest.warehouseNames,
    storeIds: pacificDest.storeIds,
    storeNames: pacificDest.storeNames,
    categories: ["Denim"],
    status: "Completed",
    createdDate: "2026-01-10",
    skuCount: pacificItems.length,
    totalValue: totalOf(pacificItems),
    supplierId: "SUP-003",
    supplierName: "Pacific Stitch Works",
    expectedDelivery: "2026-01-18",
    lineItems: pacificItems,
  },
  {
    id: "POA-003",
    name: "Summit Activewear Order",
    type: "purchase-order",
    warehouseId: summitDest.warehouseIds[0] ?? "WH-CENT-01",
    warehouseName: summitDest.warehouseNames[0] ?? "Central Fulfillment",
    storeId: summitDest.storeIds[0] ?? "STR-005",
    storeName: summitDest.storeNames[0] ?? "Spring Pop-Up",
    warehouseIds: summitDest.warehouseIds,
    warehouseNames: summitDest.warehouseNames,
    storeIds: summitDest.storeIds,
    storeNames: summitDest.storeNames,
    categories: ["Activewear"],
    status: "Sent to Provider",
    createdDate: "2026-03-30",
    skuCount: summitItems.length,
    totalValue: totalOf(summitItems),
    supplierId: "SUP-004",
    supplierName: "Summit Athletic Supply",
    expectedDelivery: "2026-04-15",
    lineItems: summitItems,
  },
  {
    id: "POA-004",
    name: "Coastal Cotton Summer Drop",
    type: "purchase-order",
    warehouseId: coastalDest.warehouseIds[0] ?? "WH-WEST-01",
    warehouseName: coastalDest.warehouseNames[0] ?? "West Coast Hub",
    storeId: coastalDest.storeIds[0] ?? "STR-006",
    storeName: coastalDest.storeNames[0] ?? "Restockd Online",
    warehouseIds: coastalDest.warehouseIds,
    warehouseNames: coastalDest.warehouseNames,
    storeIds: coastalDest.storeIds,
    storeNames: coastalDest.storeNames,
    categories: ["Tops", "Dresses"],
    status: "Processing",
    createdDate: "2026-04-01",
    skuCount: coastalItems.length,
    totalValue: totalOf(coastalItems),
    supplierId: "SUP-007",
    supplierName: "Coastal Cotton Mills",
    expectedDelivery: "2026-04-14",
    lineItems: coastalItems,
  },
  {
    id: "POA-005",
    name: "Milano Dress & Accessories",
    type: "purchase-order",
    warehouseId: milanoDest.warehouseIds[0] ?? "WH-EAST-01",
    warehouseName: milanoDest.warehouseNames[0] ?? "East Distribution Center",
    storeId: milanoDest.storeIds[0] ?? "STR-001",
    storeName: milanoDest.storeNames[0] ?? "SoHo Flagship",
    warehouseIds: milanoDest.warehouseIds,
    warehouseNames: milanoDest.warehouseNames,
    storeIds: milanoDest.storeIds,
    storeNames: milanoDest.storeNames,
    categories: ["Dresses", "Accessories"],
    status: "Suggested",
    createdDate: "2026-04-02",
    skuCount: milanoItems.length,
    totalValue: totalOf(milanoItems),
    supplierId: "SUP-002",
    supplierName: "Milano Fabric Co.",
    expectedDelivery: "2026-04-20",
    lineItems: milanoItems,
  },
];
