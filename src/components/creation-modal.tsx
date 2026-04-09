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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryMultiSelect } from "@/components/category-multi-select";
import { warehouses } from "@/data/warehouses";
import { stores } from "@/data/stores";
import { Loader2Icon } from "lucide-react";

type EntityType = "Reorder" | "Purchase Order" | "Rebalance";

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
          <DialogTitle>
            {step === 1 ? `New ${entityType}` : "Finding SKUs..."}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm mb-1.5">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. Spring ${entityType}`}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5">Warehouse</Label>
              <Select value={warehouseId} onValueChange={(v) => v && setWarehouseId(v)}>
                <SelectTrigger>
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
            <div>
              <Label className="text-sm mb-1.5">Store</Label>
              <Select value={storeId} onValueChange={(v) => v && setStoreId(v)}>
                <SelectTrigger>
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
            <div>
              <Label className="text-sm mb-1.5">Product Categories</Label>
              <CategoryMultiSelect
                selected={categories}
                onChange={setCategories}
              />
            </div>
            <Button
              onClick={handleContinue}
              disabled={!isValid}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2Icon className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              AI is finding the right SKUs...
            </p>
            <p className="text-xs text-muted-foreground/60">
              Analyzing demand patterns, stock levels, and forecasts
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
