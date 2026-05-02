"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionListTable } from "@/components/action-list-table";
import { CreationModal } from "@/components/creation-modal";
import { reorderActions as seedActions } from "@/data/reorder-actions";
import { recommendations } from "@/data/recommendations";
import { warehouses } from "@/data/warehouses";
import { stores } from "@/data/stores";
import { getItems, addItem, removeItem } from "@/lib/storage";
import { toast } from "sonner";
import { PlusIcon, RotateCcwIcon } from "lucide-react";
import type { ReorderAction } from "@/lib/types";

export default function ReorderingPage() {
  const [actions, setActions] = useState<ReorderAction[]>(seedActions);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored = getItems<ReorderAction>("restockd_reorders");
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
    // Reorder is many warehouses → many stores. Each picked warehouse acts as
    // a source for one or more stores; the AI generates per-SKU
    // recommendations across the whole graph.
    const selectedWarehouseIds = config.warehouseIds?.length
      ? config.warehouseIds
      : [config.warehouseId];
    const selectedStoreIds = config.storeIds?.length
      ? config.storeIds
      : [config.storeId];
    const selectedWarehouses = selectedWarehouseIds
      .map((id) => warehouses.find((w) => w.id === id))
      .filter(Boolean) as { id: string; name: string }[];
    const selectedStores = selectedStoreIds
      .map((id) => stores.find((s) => s.id === id))
      .filter(Boolean) as { id: string; name: string }[];

    const filtered = recommendations.filter((r) =>
      config.categories.some((cat) =>
        r.productName.toLowerCase().includes(cat.toLowerCase())
      )
    );
    const recs = filtered.length > 0 ? filtered : recommendations.slice(0, 6);
    const id = `RA-${String(actions.length + 1).padStart(3, "0")}`;

    const newAction: ReorderAction = {
      id,
      name: config.name,
      type: "reorder",
      warehouseId: selectedWarehouses[0]?.id ?? "",
      warehouseName: selectedWarehouses[0]?.name ?? "",
      storeId: selectedStores[0]?.id ?? "",
      storeName: selectedStores[0]?.name ?? "",
      warehouseIds: selectedWarehouses.map((w) => w.id),
      warehouseNames: selectedWarehouses.map((w) => w.name),
      storeIds: selectedStores.map((s) => s.id),
      storeNames: selectedStores.map((s) => s.name),
      categories: config.categories,
      status: "Ready to Send",
      createdDate: new Date().toISOString().split("T")[0],
      skuCount: recs.length,
      totalValue: recs.reduce((sum, r) => sum + r.estimatedCost, 0),
      recommendations: recs,
    };

    setActions((prev) => [newAction, ...prev]);
    addItem("restockd_reorders", newAction);
    toast.success("Reorder created");
    return id;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Reordering
              </h1>
              <Badge variant="secondary">{actions.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Move existing inventory from your warehouses out to the stores that need it most. Surfaces production gaps when warehouse stock isn't enough.
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon /> New Reorder
        </Button>
      </div>

      <ActionListTable
        items={actions}
        basePath="/reordering"
        emptyState={{
          icon: RotateCcwIcon,
          title: "No reorders yet",
          description:
            "Create a reorder to act on AI-flagged low-stock SKUs and lock in supplier coverage.",
          actionLabel: "Create reorder",
          onAction: () => setModalOpen(true),
        }}
        onRemove={(item) => {
          setActions((prev) => prev.filter((a) => a.id !== item.id));
          removeItem<ReorderAction>("restockd_reorders", item.id);
          toast.success(`${item.name} removed`);
        }}
      />

      <CreationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="Reorder"
        basePath="/reordering"
        onComplete={handleCreate}
      />
    </div>
  );
}
