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

export interface POLineItem {
  skuId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

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
}

export interface RebalancingSuggestion {
  id: string;
  skuId: string;
  productName: string;
  variant: string;
  fromWarehouse: string;
  toWarehouse: string;
  suggestedQty: number;
  reason: string;
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
  warehouseId: string;
  warehouseName: string;
  storeId: string;
  storeName: string;
  categories: string[];
  status: "Draft" | "Processing" | "Ready" | "Approved" | "Completed";
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
