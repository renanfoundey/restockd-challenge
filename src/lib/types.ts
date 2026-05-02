export interface SKU {
  id: string;
  productName: string;
  variant: string;
  category: string;
  currentStock: number;
  avgDailySales: number;
  daysOfSupply: number;
  reorderPoint: number;
  status: "In Stock" | "Low Stock" | "Critical" | "Out of Stock";
  supplierId: string;
  supplierName: string;
  unitCost: number;
  leadTimeDays: number;
  imageUrl: string;
}

export interface Supplier {
  id: string;
  name: string;
  categories: string[];
  moq: number;
  leadTimeDays: number;
  contactEmail: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: "Draft" | "Submitted" | "In Transit" | "Received" | "Cancelled";
  createdDate: string;
  expectedDelivery: string;
  items: POLineItem[];
  totalCost: number;
}

// Where the recommended units come from. Reorder is internal — warehouse →
// store — so a line can only be in one of three states: ready in warehouse,
// arriving via an existing replenishment in transit, or being made via an
// existing replenishment in production. New POs are out of scope here; if
// nothing's in the pipeline the planner should open a Replenishment instead.
export type ReorderAvailability =
  | "in_warehouse"
  | "in_transit"
  | "in_production";

export interface ReorderRecommendation {
  skuId: string;
  productName: string;
  variant: string;
  currentStock: number;
  forecastedDemand30d: number;
  recommendedQty: number;
  reason: string;
  supplierName: string;
  supplierId: string;
  estimatedCost: number;
  urgency: "High" | "Medium" | "Low";
  // How sourcing is gated for this SKU. Drives the planner's expectation:
  // "ready today" vs "wait N days for production".
  availability: ReorderAvailability;
  // Units already on hand at the source warehouse, available immediately.
  warehouseStockOnHand: number;
  // Where this would ship from, when ready.
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  // Days until the gap can be covered (0 if in_warehouse).
  estimatedWaitDays: number;
  // Optional production / PO reference if availability != in_warehouse.
  productionStatus?: string;
}

export interface RebalancingSuggestion {
  id: string;
  skuId: string;
  productName: string;
  variant: string;
  // Rebalancing moves existing inventory between STORES (lower-demand →
  // higher-demand), not between warehouses. Field names previously mentioned
  // "Warehouse" — we keep that here for backwards-compat with the storage key
  // but populate them with store identifiers.
  fromStore: string;
  toStore: string;
  suggestedQty: number;
  reason: string;
}

export interface POLineItem {
  skuId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  // Replenishment distributes a single supplier order across multiple
  // destination warehouses + stores. These override the action-level defaults.
  destinationWarehouseId?: string;
  destinationWarehouseName?: string;
  destinationStoreId?: string;
  destinationStoreName?: string;
}

export interface ReorderRequest {
  id: string;
  skuId: string;
  productName: string;
  quantity: number;
  supplierId: string;
  supplierName: string;
  status: "Pending" | "Approved" | "Shipped" | "Received";
  createdDate: string;
}

export interface Store {
  id: string;
  name: string;
  type: "Retail" | "Outlet" | "Pop-Up" | "Online";
  location: string;
}

export interface InventoryAction {
  id: string;
  name: string;
  // Single-destination fallback. Kept for back-compat with the legacy
  // one-warehouse / one-store actions and for the "primary" anchor view.
  warehouseId: string;
  warehouseName: string;
  storeId: string;
  storeName: string;
  // Real-world planning is many-to-many: a single replenishment, reorder, or
  // rebalance routinely fans out across multiple warehouses and stores. When
  // these arrays are populated they are authoritative — the UI should show
  // the full list and prefer them over the single-destination fields.
  warehouseIds?: string[];
  warehouseNames?: string[];
  storeIds?: string[];
  storeNames?: string[];
  categories: string[];
  // Global action status — uniform across Replenishment / Reorder / Rebalance.
  status:
    | "Suggested"
    | "Ready to Send"
    | "Sent to Provider"
    | "Processing"
    | "Completed";
  createdDate: string;
  skuCount: number;
  totalValue: number;
}

export interface ReorderAction extends InventoryAction {
  type: "reorder";
  recommendations: ReorderRecommendation[];
}

export interface PurchaseOrderAction extends InventoryAction {
  type: "purchase-order";
  supplierId: string;
  supplierName: string;
  expectedDelivery: string;
  lineItems: POLineItem[];
}

export interface RebalanceAction extends InventoryAction {
  type: "rebalance";
  suggestions: RebalancingSuggestion[];
}
