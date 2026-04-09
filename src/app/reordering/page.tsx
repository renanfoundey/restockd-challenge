"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ActionListTable } from "@/components/action-list-table";
import { CreationModal } from "@/components/creation-modal";
import { reorderActions as seedActions } from "@/data/reorder-actions";
import { recommendations } from "@/data/recommendations";
import { warehouses } from "@/data/warehouses";
import { stores } from "@/data/stores";
import { getItems, addItem } from "@/lib/storage";
import { toast } from "sonner";
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
    categories: string[];
  }) => {
    const warehouse = warehouses.find((w) => w.id === config.warehouseId)!;
    const store = stores.find((s) => s.id === config.storeId)!;
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
      warehouseId: config.warehouseId,
      warehouseName: warehouse.name,
      storeId: config.storeId,
      storeName: store.name,
      categories: config.categories,
      status: "Ready",
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
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Reordering</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered reorder recommendations
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Reorder</Button>
      </div>

      <ActionListTable items={actions} basePath="/reordering" />

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
