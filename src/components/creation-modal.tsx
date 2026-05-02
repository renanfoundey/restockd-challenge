"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SparklesIcon } from "lucide-react";

type EntityType = "Reorder" | "Replenishment" | "Rebalance";

interface CreationConfig {
  name: string;
  warehouseId: string;
  storeId: string;
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
  const [warehouseId, setWarehouseId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const isValid = name.trim() && warehouseId && storeId && categories.length > 0;

  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setWarehouseId("");
      setStoreId("");
      setCategories([]);
    }
  }, [open]);

  const handleContinue = () => {
    if (!isValid) return;
    setStep(2);

    setTimeout(() => {
      const newId = onComplete({ name: name.trim(), warehouseId, storeId, categories });
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
              ? "Configure scope. We'll match SKUs in the next step."
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
            <div className="space-y-1.5">
              <Label className="text-sm">Warehouse</Label>
              <Select value={warehouseId} onValueChange={(v) => v && setWarehouseId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} — {w.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Store</Label>
              <Select value={storeId} onValueChange={(v) => v && setStoreId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select store..." />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Analyzing demand patterns, stock levels, and forecasts
              </p>
            </div>
            <div className="w-full max-w-xs h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
