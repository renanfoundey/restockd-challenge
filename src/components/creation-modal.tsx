"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryMultiSelect } from "@/components/category-multi-select";
import { warehouses } from "@/data/warehouses";
import { stores } from "@/data/stores";
import { SparklesIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EntityType = "Reorder" | "Replenishment" | "Rebalance";

export interface CreationConfig {
  name: string;
  // Single-destination case (Reorder, Rebalance)
  warehouseId: string;
  storeId: string;
  // Multi-destination case (Replenishment) — when these are populated they
  // override the single fields and represent the full distribution scope.
  warehouseIds?: string[];
  storeIds?: string[];
  categories: string[];
}

export function CreationModal({
  open,
  onOpenChange,
  entityType,
  basePath,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  basePath: string;
  onComplete: (config: CreationConfig) => string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [warehouseIds, setWarehouseIds] = useState<string[]>([]);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Inventory planning is many-to-many in the real world. Replenishment and
  // Reorder both span warehouses + stores; Rebalance is store-to-store with
  // no warehouse hop. The single legacy fields stay populated as the
  // "primary" anchor for back-compat, but the user always picks N of each.
  const showWarehouses = entityType !== "Rebalance";
  const storesLabel = entityType === "Rebalance" ? "Stores involved" : "Stores";
  const warehouseValid = showWarehouses ? warehouseIds.length > 0 : true;

  const isValid =
    name.trim() &&
    warehouseValid &&
    storeIds.length > 0 &&
    categories.length > 0;

  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setWarehouseIds([]);
      setStoreIds([]);
      setCategories([]);
    }
  }, [open]);

  const handleContinue = () => {
    if (!isValid) return;
    setStep(2);

    setTimeout(() => {
      const newId = onComplete({
        name: name.trim(),
        warehouseId: showWarehouses ? warehouseIds[0] : "",
        storeId: storeIds[0],
        warehouseIds: showWarehouses ? warehouseIds : undefined,
        storeIds,
        categories,
      });
      onOpenChange(false);
      router.push(`${basePath}/${newId}`);
    }, 2500);
  };

  return (
    <Dialog open={open} onOpenChange={step === 1 ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>
              {step === 1 ? `New ${entityType}` : "Finding SKUs"}
            </DialogTitle>
            <span className="text-xs font-medium text-muted-foreground tracking-wide">
              Step {step} of 2
            </span>
          </div>
          <DialogDescription>
            {step === 1
              ? entityType === "Replenishment"
                ? "Replenishment distributes one supplier order across multiple warehouses and stores. Pick every destination that should receive stock."
                : entityType === "Reorder"
                ? "Reorder routes existing inventory from your warehouses out to stores. Pick all source warehouses and the stores that need replenishment."
                : "Rebalance moves existing inventory between stores. Pick every store that should be considered as a source or destination."
              : "Analyzing demand patterns and stock levels."}
          </DialogDescription>
          <div className="flex gap-1 pt-1">
            <span className="h-1 flex-1 rounded-full bg-primary" />
            <span
              className={
                step === 2
                  ? "h-1 flex-1 rounded-full bg-primary"
                  : "h-1 flex-1 rounded-full bg-muted"
              }
            />
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. Spring ${entityType}`}
              />
            </div>

            {showWarehouses && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Warehouses</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {warehouseIds.length} of {warehouses.length} selected
                  </span>
                </div>
                <ChipMultiSelect
                  options={warehouses.map((w) => ({
                    id: w.id,
                    label: w.name,
                    sub: w.location,
                  }))}
                  selected={warehouseIds}
                  onChange={setWarehouseIds}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{storesLabel}</Label>
                <span className="text-[11px] text-muted-foreground">
                  {storeIds.length} of {stores.length} selected
                </span>
              </div>
              <ChipMultiSelect
                options={stores.map((s) => ({
                  id: s.id,
                  label: s.name,
                  sub: s.type,
                }))}
                selected={storeIds}
                onChange={setStoreIds}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Product Categories</Label>
              <CategoryMultiSelect
                selected={categories}
                onChange={setCategories}
              />
            </div>
            <Button
              onClick={handleContinue}
              disabled={!isValid}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <SparklesIcon className="size-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                AI is finding the right SKUs
              </p>
              <p className="text-xs text-muted-foreground">
                {entityType === "Rebalance"
                  ? "Pairing donor and recipient stores by demand and stock-on-hand"
                  : "Allocating across warehouses and stores based on local demand"}
              </p>
            </div>
            <div className="w-full max-w-xs h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary animate-pulse"
                style={{ width: "70%" }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: { id: string; label: string; sub?: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}): ReactNode {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };
  return (
    <div className="rounded-lg border border-border bg-card p-1.5 flex flex-wrap gap-1">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            )}
          >
            {isSelected && <CheckIcon className="size-3" />}
            <span>{opt.label}</span>
            {opt.sub && (
              <span
                className={cn(
                  "text-[10px]",
                  isSelected
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                · {opt.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
