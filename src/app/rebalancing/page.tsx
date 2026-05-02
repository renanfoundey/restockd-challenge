"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionListTable } from "@/components/action-list-table";
import { CreationModal } from "@/components/creation-modal";
import { rebalanceActions as seedActions } from "@/data/rebalance-actions";
import { rebalancingSuggestions } from "@/data/rebalancing";
import { warehouses } from "@/data/warehouses";
import { stores } from "@/data/stores";
import { getItems, addItem, removeItem } from "@/lib/storage";
import { toast } from "sonner";
import { PlusIcon, ShuffleIcon } from "lucide-react";
import type { RebalanceAction } from "@/lib/types";

export default function RebalancingPage() {
  const [actions, setActions] = useState<RebalanceAction[]>(seedActions);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored = getItems<RebalanceAction>("restockd_rebalances");
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
    // Rebalance is store-to-store only — no warehouse hop. The user picks N
    // stores; suggestions move stock between them.
    const selectedStoreIds = config.storeIds?.length
      ? config.storeIds
      : [config.storeId];
    const selectedStores = selectedStoreIds
      .map((id) => stores.find((s) => s.id === id))
      .filter(Boolean) as { id: string; name: string }[];

    // Filter suggestions to only those whose from/to are in the chosen stores
    const inScope = rebalancingSuggestions.filter(
      (s) =>
        selectedStoreIds.includes(s.fromStore) &&
        selectedStoreIds.includes(s.toStore)
    );
    const suggestions = (inScope.length > 0 ? inScope : rebalancingSuggestions).slice(
      0,
      Math.max(20, selectedStores.length * 8)
    );
    const id = `RBA-${String(actions.length + 1).padStart(3, "0")}`;

    const newAction: RebalanceAction = {
      id,
      name: config.name,
      type: "rebalance",
      warehouseId: "",
      warehouseName: "",
      storeId: selectedStores[0]?.id ?? "",
      storeName: selectedStores[0]?.name ?? "",
      storeIds: selectedStores.map((s) => s.id),
      storeNames: selectedStores.map((s) => s.name),
      categories: config.categories,
      status: "Ready",
      createdDate: new Date().toISOString().split("T")[0],
      skuCount: suggestions.length,
      totalValue: 0,
      suggestions,
    };

    setActions((prev) => [newAction, ...prev]);
    addItem("restockd_rebalances", newAction);
    toast.success("Rebalance created");
    return id;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Rebalancing
            </h1>
            <Badge variant="secondary">{actions.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Move existing inventory between stores — shift stock from lower-demand locations to higher-demand ones, no new purchase order needed.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon /> New Rebalance
        </Button>
      </div>

      <ActionListTable
        items={actions}
        basePath="/rebalancing"
        hideWarehouse
        storeColumnLabel="Anchor Store"
        emptyState={{
          icon: ShuffleIcon,
          title: "No rebalances yet",
          description:
            "Shift existing inventory store-to-store, from lower-demand locations to higher-demand ones — no warehouse hop, no purchase order.",
          actionLabel: "Create rebalance",
          onAction: () => setModalOpen(true),
        }}
        onRemove={(item) => {
          setActions((prev) => prev.filter((a) => a.id !== item.id));
          removeItem<RebalanceAction>("restockd_rebalances", item.id);
          toast.success(`${item.name} removed`);
        }}
      />

      <CreationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="Rebalance"
        basePath="/rebalancing"
        onComplete={handleCreate}
      />
    </div>
  );
}
