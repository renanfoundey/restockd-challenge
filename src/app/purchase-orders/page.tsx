"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ActionListTable } from "@/components/action-list-table";
import { CreationModal } from "@/components/creation-modal";
import { purchaseOrderActions as seedActions } from "@/data/purchase-order-actions";
import { recommendations } from "@/data/recommendations";
import { warehouses } from "@/data/warehouses";
import { stores } from "@/data/stores";
import { suppliers } from "@/data/suppliers";
import { getItems, addItem } from "@/lib/storage";
import { toast } from "sonner";
import type { PurchaseOrderAction } from "@/lib/types";

export default function PurchaseOrdersPage() {
  const [actions, setActions] = useState<PurchaseOrderAction[]>(seedActions);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored = getItems<PurchaseOrderAction>("restockd_purchase_orders");
    if (stored.length) {
      setActions((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        return [...stored.filter((s) => !ids.has(s.id)), ...prev];
      });
    }
  }, []);

  const handleCreate = (config: {
    name: string;
    warehouseId: string;
    storeId: string;
    categories: string[];
  }) => {
    const warehouse = warehouses.find((w) => w.id === config.warehouseId)!;
    const store = stores.find((s) => s.id === config.storeId)!;
    const supplier = suppliers[0];
    const recs = recommendations.slice(0, 5);
    const lineItems = recs.map((r) => ({
      skuId: r.skuId,
      productName: r.productName,
      quantity: r.recommendedQty,
      unitCost: r.estimatedCost / r.recommendedQty,
      lineTotal: r.estimatedCost,
    }));
    const id = `POA-${String(actions.length + 1).padStart(3, "0")}`;

    const newAction: PurchaseOrderAction = {
      id,
      name: config.name,
      type: "purchase-order",
      warehouseId: config.warehouseId,
      warehouseName: warehouse.name,
      storeId: config.storeId,
      storeName: store.name,
      categories: config.categories,
      status: "Ready",
      createdDate: new Date().toISOString().split("T")[0],
      skuCount: lineItems.length,
      totalValue: lineItems.reduce((sum, li) => sum + li.lineTotal, 0),
      supplierId: supplier.id,
      supplierName: supplier.name,
      expectedDelivery: new Date(Date.now() + supplier.leadTimeDays * 86400000)
        .toISOString()
        .split("T")[0],
      lineItems,
    };

    setActions((prev) => [newAction, ...prev]);
    addItem("restockd_purchase_orders", newAction);
    toast.success("Purchase order created");
    return id;
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage purchase orders
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Purchase Order</Button>
      </div>

      <ActionListTable items={actions} basePath="/purchase-orders" />

      <CreationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="Purchase Order"
        basePath="/purchase-orders"
        onComplete={handleCreate}
      />
    </div>
  );
}
