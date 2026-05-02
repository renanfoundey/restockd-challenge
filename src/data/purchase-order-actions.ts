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
    const qtyMul = 0.6 + (seed / 17) * 1.2;
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

export const purchaseOrderActions: PurchaseOrderAction[] = [
  {
    id: "POA-001",
    name: "Eastway Spring Collection",
    type: "purchase-order",
    warehouseId: "WH-EAST-01",
    warehouseName: "East Distribution Center",
    storeId: "STR-001",
    storeName: "SoHo Flagship",
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
    warehouseId: "WH-WEST-01",
    warehouseName: "West Coast Hub",
    storeId: "STR-002",
    storeName: "Melrose Avenue",
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
    warehouseId: "WH-CENT-01",
    warehouseName: "Central Fulfillment",
    storeId: "STR-005",
    storeName: "Spring Pop-Up",
    categories: ["Activewear"],
    status: "Approved",
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
    warehouseId: "WH-WEST-01",
    warehouseName: "West Coast Hub",
    storeId: "STR-006",
    storeName: "Restockd Online",
    categories: ["Tops", "Dresses"],
    status: "Ready",
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
    warehouseId: "WH-EAST-01",
    warehouseName: "East Distribution Center",
    storeId: "STR-001",
    storeName: "SoHo Flagship",
    categories: ["Dresses", "Accessories"],
    status: "Draft",
    createdDate: "2026-04-02",
    skuCount: milanoItems.length,
    totalValue: totalOf(milanoItems),
    supplierId: "SUP-002",
    supplierName: "Milano Fabric Co.",
    expectedDelivery: "2026-04-20",
    lineItems: milanoItems,
  },
];
