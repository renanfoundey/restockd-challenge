"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionListTable } from "@/components/action-list-table";
import { CreationModal } from "@/components/creation-modal";
import { purchaseOrderActions as seedActions } from "@/data/purchase-order-actions";
import { recommendations } from "@/data/recommendations";
import { warehouses } from "@/data/warehouses";
import { stores } from "@/data/stores";
import { suppliers } from "@/data/suppliers";
import { getItems, addItem, removeItem } from "@/lib/storage";
import { toast } from "sonner";
import { PlusIcon, TruckIcon } from "lucide-react";
import type { PurchaseOrderAction } from "@/lib/types";

export default function ReplenishmentPage() {
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
    warehouseIds?: string[];
    storeIds?: string[];
    categories: string[];
  }) => {
    const supplier = suppliers[0];
    const recs = recommendations.slice(0, 5);

    // A replenishment routinely fans out across multiple warehouses + stores.
    // Distribute each line item deterministically across the chosen
    // destinations so every selected warehouse/store gets a real share.
    const selectedWarehouseIds = config.warehouseIds?.length
      ? config.warehouseIds
      : [config.warehouseId];
    const selectedStoreIds = config.storeIds?.length
      ? config.storeIds
      : [config.storeId];

    const selectedWarehouses = selectedWarehouseIds.map(
      (id) => warehouses.find((w) => w.id === id)!
    );
    const selectedStores = selectedStoreIds.map(
      (id) => stores.find((s) => s.id === id)!
    );

    const lineItems = recs.map((r, idx) => {
      const wh = selectedWarehouses[idx % selectedWarehouses.length];
      const st = selectedStores[idx % selectedStores.length];
      return {
        skuId: r.skuId,
        productName: r.productName,
        quantity: r.recommendedQty,
        unitCost: r.estimatedCost / r.recommendedQty,
        lineTotal: r.estimatedCost,
        destinationWarehouseId: wh.id,
        destinationWarehouseName: wh.name,
        destinationStoreId: st.id,
        destinationStoreName: st.name,
      };
    });
    const id = `POA-${String(actions.length + 1).padStart(3, "0")}`;

    const newAction: PurchaseOrderAction = {
      id,
      name: config.name,
      type: "purchase-order",
      warehouseId: selectedWarehouses[0].id,
      warehouseName: selectedWarehouses[0].name,
      storeId: selectedStores[0].id,
      storeName: selectedStores[0].name,
      warehouseIds: selectedWarehouses.map((w) => w.id),
      warehouseNames: selectedWarehouses.map((w) => w.name),
      storeIds: selectedStores.map((s) => s.id),
      storeNames: selectedStores.map((s) => s.name),
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
    toast.success("Replenishment created");
    return id;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Replenishment
            </h1>
            <Badge variant="secondary">{actions.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep the network stocked. Each plan covers what you need to bring in next, where it should land, and which stores it's serving — so you spend less time chasing PO statuses and more time on what to merchandise next.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon /> New Replenishment
        </Button>
      </div>

      <ActionListTable
        items={actions}
        basePath="/replenishment"
        emptyState={{
          icon: TruckIcon,
          title: "No replenishments yet",
          description:
            "Turn flagged SKUs into supplier-ready orders with quantities and lead times pre-filled.",
          actionLabel: "Create replenishment",
          onAction: () => setModalOpen(true),
        }}
        onRemove={(item) => {
          setActions((prev) => prev.filter((a) => a.id !== item.id));
          removeItem<PurchaseOrderAction>("restockd_purchase_orders", item.id);
          toast.success(`${item.name} removed`);
        }}
      />

      <CreationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="Replenishment"
        basePath="/replenishment"
        onComplete={handleCreate}
      />
    </div>
  );
}
