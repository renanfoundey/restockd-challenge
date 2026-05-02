"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePaginated, PaginatorControls } from "@/components/paginator";
import {
  marketplaceItems,
  marketplaceManufacturers,
  type MarketplaceItem,
} from "@/data/marketplace";
import { warehouses } from "@/data/warehouses";
import { getItems, setItems } from "@/lib/storage";
import {
  PackageIcon,
  SearchIcon,
  XIcon,
  StarIcon,
  TruckIcon,
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  CheckIcon,
  SparklesIcon,
  BuildingIcon,
} from "lucide-react";
import { toast } from "sonner";

const categories = [...new Set(marketplaceItems.map((m) => m.category))].sort();
const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "lead-asc", label: "Fastest lead time" },
];

const BOUGHT_STORAGE_KEY = "restockd_marketplace_bought";

interface BoughtRecord {
  id: string; // unique purchase id
  itemId: string;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  needBy: string;
  purchasedAt: string;
  considerForReplen: boolean;
}

export default function StorePage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState("popular");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [buyTarget, setBuyTarget] = useState<MarketplaceItem | null>(null);
  const [bought, setBought] = useState<BoughtRecord[]>([]);

  useEffect(() => {
    setBought(getItems<BoughtRecord>(BOUGHT_STORAGE_KEY));
  }, []);

  const persistBought = (next: BoughtRecord[]) => {
    setBought(next);
    setItems(BOUGHT_STORAGE_KEY, next);
  };

  const handleConfirmPurchase = (record: BoughtRecord) => {
    persistBought([record, ...bought]);
  };

  const handleToggleConsider = (id: string) => {
    persistBought(
      bought.map((r) =>
        r.id === id ? { ...r, considerForReplen: !r.considerForReplen } : r
      )
    );
  };

  const filtered = useMemo(() => {
    const result = marketplaceItems.filter((item) => {
      if (
        search &&
        !item.productName.toLowerCase().includes(search.toLowerCase()) &&
        !item.manufacturer.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      if (
        manufacturerFilter !== "all" &&
        item.manufacturer !== manufacturerFilter
      )
        return false;
      if (stockOnly && !item.inStock) return false;
      return true;
    });
    return result.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.unitPrice - b.unitPrice;
        case "price-desc":
          return b.unitPrice - a.unitPrice;
        case "lead-asc":
          return a.leadTimeDays - b.leadTimeDays;
        case "popular":
        default:
          return b.ratingCount - a.ratingCount;
      }
    });
  }, [search, categoryFilter, manufacturerFilter, stockOnly, sort]);

  const activeFilterCount =
    (search ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (manufacturerFilter !== "all" ? 1 : 0) +
    (stockOnly ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setManufacturerFilter("all");
    setStockOnly(false);
  };

  const pager = usePaginated(filtered, 24);
  const considerCount = bought.filter((b) => b.considerForReplen).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Browse stock from other manufacturers and bring it into your warehouse. Items you buy here are queued and considered for the next replenishment cycle.
          </p>
        </div>
        <div className="flex items-stretch gap-6">
          <HeroStat label="Items" value={marketplaceItems.length.toLocaleString()} />
          <div className="border-l border-border" />
          <HeroStat label="Manufacturers" value={String(marketplaceManufacturers.length)} />
          <div className="border-l border-border" />
          <HeroStat label="In queue" value={String(considerCount)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FilterField label="Search" className="lg:col-span-2">
            <div className="relative">
              <SearchIcon className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Product or manufacturer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </FilterField>
          <FilterField label="Category">
            <Select
              value={categoryFilter}
              onValueChange={(v) => v && setCategoryFilter(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Manufacturer">
            <Select
              value={manufacturerFilter}
              onValueChange={(v) => v && setManufacturerFilter(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {marketplaceManufacturers.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Sort">
            <Select value={sort} onValueChange={(v) => v && setSort(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Showing {filtered.length.toLocaleString()} of{" "}
              {marketplaceItems.length.toLocaleString()} items
            </span>
            <button
              type="button"
              onClick={() => setStockOnly((v) => !v)}
              className={
                stockOnly
                  ? "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success-soft text-success-foreground border border-success/30"
                  : "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-card text-muted-foreground border border-border hover:bg-muted"
              }
            >
              In stock only
            </button>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="info">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <XIcon /> Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="available">
        <TabsList variant="line" className="border-b border-border w-fit justify-start">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="bought">
            Bought
            {bought.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {bought.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="pt-6 space-y-6">
          {pager.slice.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <SearchIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight">
                  No marketplace items match
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Try adjusting your filters or relaxing the in-stock requirement.
                </p>
              </div>
              {activeFilterCount > 0 && (
                <Button size="sm" variant="outline" onClick={resetFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {pager.slice.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    errored={imageErrors.has(item.id)}
                    onImageError={() =>
                      setImageErrors((prev) => new Set(prev).add(item.id))
                    }
                    onBuy={() => setBuyTarget(item)}
                  />
                ))}
              </div>
              <PaginatorControls {...pager} unitLabel="items" />
            </>
          )}
        </TabsContent>

        <TabsContent value="bought" className="pt-6 space-y-4">
          <div className="rounded-xl border border-info/20 bg-info-soft/40 p-4 flex items-start gap-3">
            <div className="size-8 rounded-full bg-info/15 text-info-foreground flex items-center justify-center shrink-0">
              <SparklesIcon className="size-4" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">
                Bought items are queued for the next replenishment cycle.
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Toggle <strong>Consider for replen</strong> on each row to
                include it in the next AI-generated replenishment plan.
              </p>
            </div>
          </div>
          <BoughtList
            bought={bought}
            onToggleConsider={handleToggleConsider}
          />
        </TabsContent>
      </Tabs>

      <BuyDialog
        item={buyTarget}
        onClose={() => setBuyTarget(null)}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
}

function MarketplaceCard({
  item,
  errored,
  onImageError,
  onBuy,
}: {
  item: MarketplaceItem;
  errored: boolean;
  onImageError: () => void;
  onBuy: () => void;
}) {
  return (
    <article className="group bg-card border border-border rounded-xl overflow-hidden shadow-xs transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/30 flex flex-col">
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        {errored ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <PackageIcon className="size-8" />
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            onError={onImageError}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {item.tags.includes("bestseller") && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning text-white backdrop-blur-sm">
              Bestseller
            </span>
          )}
          {item.tags.includes("trending") && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-info text-white backdrop-blur-sm">
              Trending
            </span>
          )}
          {item.tags.includes("new") && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary text-primary-foreground backdrop-blur-sm">
              New
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          {item.inStock ? (
            <Badge variant="success" className="shadow-sm">
              In stock
            </Badge>
          ) : (
            <Badge variant="outline" className="shadow-sm bg-card/90 backdrop-blur-sm">
              Pre-order
            </Badge>
          )}
        </div>
      </div>
      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col">
        <div>
          <p className="text-sm font-semibold tracking-tight line-clamp-1">
            {item.productName}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            <BuildingIcon className="size-3" />
            <span className="font-medium text-foreground truncate max-w-[140px]">
              {item.manufacturer}
            </span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
          {item.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-2.5">
          <span className="inline-flex items-center gap-1">
            <StarIcon className="size-3 fill-warning text-warning" />
            <span className="text-foreground font-medium tabular-nums">
              {item.rating.toFixed(1)}
            </span>
            <span>({item.ratingCount})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <TruckIcon className="size-3" />
            {item.leadTimeDays}d
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-base font-semibold tracking-tight tabular-nums">
              ${item.unitPrice.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground"> /unit</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              MOQ {item.moq}
            </p>
          </div>
          <Button size="sm" onClick={onBuy}>
            <ShoppingCartIcon /> Buy
          </Button>
        </div>
      </div>
    </article>
  );
}

function BoughtList({
  bought,
  onToggleConsider,
}: {
  bought: BoughtRecord[];
  onToggleConsider: (id: string) => void;
}) {
  if (bought.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 flex flex-col items-center text-center gap-3">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <ShoppingCartIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-tight">
            No purchases yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Buy from the Available tab and orders will land here, ready to be queued for the next replenishment cycle.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {bought.map((b) => {
        const item = marketplaceItems.find((m) => m.id === b.itemId);
        if (!item) return null;
        return (
          <div
            key={b.id}
            className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex"
          >
            <img
              src={item.imageUrl}
              alt={item.productName}
              className="w-24 h-full object-cover bg-muted shrink-0"
            />
            <div className="flex-1 min-w-0 p-3 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  {item.manufacturer}
                </p>
                <p className="text-sm font-semibold tracking-tight line-clamp-1">
                  {item.productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.quantity.toLocaleString()} units · ${" "}
                  {(b.quantity * item.unitPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Deliver to <span className="text-foreground">{b.warehouseName}</span> by{" "}
                <span className="text-foreground">{b.needBy}</span>
              </p>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                <Label className="text-xs flex items-center gap-1.5">
                  <CheckIcon
                    className={
                      b.considerForReplen
                        ? "size-3.5 text-success-foreground"
                        : "size-3.5 text-muted-foreground/40"
                    }
                  />
                  Consider for next replen
                </Label>
                <Switch
                  checked={b.considerForReplen}
                  onCheckedChange={() => onToggleConsider(b.id)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BuyDialog({
  item,
  onClose,
  onConfirm,
}: {
  item: MarketplaceItem | null;
  onClose: () => void;
  onConfirm: (record: BoughtRecord) => void;
}) {
  const defaultNeedByFor = (it: MarketplaceItem) => {
    const d = new Date();
    d.setDate(d.getDate() + it.leadTimeDays + 7);
    return d.toISOString().split("T")[0];
  };

  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [quantity, setQuantity] = useState(item?.moq ?? 0);
  const [needBy, setNeedBy] = useState(item ? defaultNeedByFor(item) : "");

  // Reset form state when the target item changes
  useEffect(() => {
    if (item) {
      setWarehouseId(warehouses[0]?.id ?? "");
      setQuantity(item.moq);
      setNeedBy(defaultNeedByFor(item));
    }
  }, [item]);

  if (!item) return null;
  const warehouse = warehouses.find((w) => w.id === warehouseId);
  const total = quantity * item.unitPrice;
  const belowMoq = quantity < item.moq;

  const earliestArrival = (() => {
    const d = new Date();
    d.setDate(d.getDate() + item.leadTimeDays);
    return d.toISOString().split("T")[0];
  })();
  const tooSoon = needBy && needBy < earliestArrival;

  const adjustQty = (delta: number) => {
    setQuantity((q) => Math.max(item.moq, q + delta));
  };

  const confirm = () => {
    if (!warehouse) return;
    const record: BoughtRecord = {
      id: `BUY-${Date.now()}`,
      itemId: item.id,
      quantity,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      needBy,
      purchasedAt: new Date().toISOString().split("T")[0],
      considerForReplen: true,
    };
    onConfirm(record);
    toast.success(
      `Ordered ${quantity.toLocaleString()} units of ${item.productName} to ${warehouse.name}`,
      { description: needBy ? `Need by ${needBy} · queued for next replenishment` : undefined }
    );
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Buy from marketplace</DialogTitle>
            <Badge variant="info">Bulk order</Badge>
          </div>
          <DialogDescription>
            Choose destination, quantity, and when you need the stock to arrive. The order will be queued for the next replenishment cycle.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 -mt-1">
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="size-16 rounded-lg object-cover bg-muted shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {item.manufacturer}
            </p>
            <p className="text-sm font-semibold tracking-tight truncate">
              {item.productName}
            </p>
            <p className="text-xs text-muted-foreground">
              ${item.unitPrice.toFixed(2)}/unit · MOQ {item.moq} · {item.leadTimeDays}d lead
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Deliver to warehouse</Label>
          <Select
            value={warehouseId}
            onValueChange={(v) => v && setWarehouseId(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a warehouse" />
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
          <Label className="text-sm font-medium">Quantity</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => adjustQty(-item.moq)}
              disabled={quantity <= item.moq}
              aria-label="Decrease quantity"
            >
              <MinusIcon />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="text-center w-24 tabular-nums"
            />
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => adjustQty(item.moq)}
              aria-label="Increase quantity"
            >
              <PlusIcon />
            </Button>
            <span className="text-xs text-muted-foreground ml-1">
              units (steps of {item.moq})
            </span>
          </div>
          {belowMoq && (
            <p className="text-xs text-warning-foreground">
              Below MOQ — order will be rounded up to {item.moq}.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Need by</Label>
          <Input
            type="date"
            value={needBy}
            min={earliestArrival}
            onChange={(e) => setNeedBy(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Earliest arrival is {earliestArrival} ({item.leadTimeDays}-day lead time).
          </p>
          {tooSoon && (
            <p className="text-xs text-destructive-foreground">
              Date is before the earliest possible arrival.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Order total
          </span>
          <span className="text-base font-semibold tabular-nums">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!warehouse || !!tooSoon}>
            Confirm purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-2xl font-semibold tracking-tight tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-1">
        {label}
      </p>
    </div>
  );
}

function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
