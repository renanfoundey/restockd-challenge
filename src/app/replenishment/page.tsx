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
