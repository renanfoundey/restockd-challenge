"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
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
  landedCostFor,
  type MarketplaceItem,
  type TrendSignal,
} from "@/data/marketplace";
import { warehouses } from "@/data/warehouses";
import {
  CURRENT_QUARTER,
  categoryBudgets,
  getBudget,
  getGap,
} from "@/data/otb";
import { getItems, setItems } from "@/lib/storage";
import { cn } from "@/lib/utils";
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
  ShieldCheckIcon,
  AlertTriangleIcon,
  CalendarIcon,
  TrendingUpIcon,
  CircleIcon,
  CircleCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

const categories = [...new Set(marketplaceItems.map((m) => m.category))].sort();
const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "fit", label: "Best forecast fit" },
  { value: "landed", label: "Lowest landed cost" },
  { value: "lead-asc", label: "Fastest lead time" },
  { value: "reliability", label: "Most reliable supplier" },
];

const BOUGHT_STORAGE_KEY = "restockd_marketplace_bought";

interface BoughtRecord {
  id: string;
  itemId: string;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  needBy: string;
  purchasedAt: string;
  considerForReplen: boolean;
  unitLandedCost: number;
}

// Post-purchase status states an inventory manager actually tracks. Derived
// deterministically from purchase + lead time so the timeline feels real
// without needing a real ERP integration.
// Marketplace = single-supplier domestic shipment to one of our warehouses.
// Three plain stages: maker → road → here.
type LifecycleStage = "Production" | "In Transit" | "Received";

const STAGE_ORDER: LifecycleStage[] = ["Production", "In Transit", "Received"];

function stageFor(record: BoughtRecord, item: MarketplaceItem): LifecycleStage {
  const purchaseTime = new Date(record.purchasedAt).getTime();
  const elapsedDays = (Date.now() - purchaseTime) / 86400000;
  const lt = item.leadTimeDays;
  if (elapsedDays >= lt) return "Received";
  if (elapsedDays >= lt * 0.45) return "In Transit";
  return "Production";
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
  const [signalTarget, setSignalTarget] = useState<MarketplaceItem | null>(
    null
  );

  useEffect(() => {
    setBought(getItems<BoughtRecord>(BOUGHT_STORAGE_KEY));
  }, []);

  const persistBought = useCallback((next: BoughtRecord[]) => {
    setBought(next);
    setItems(BOUGHT_STORAGE_KEY, next);
  }, []);

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

  const handleRemoveBought = (id: string) => {
    persistBought(bought.filter((r) => r.id !== id));
  };

  // Pending committed $ per category from Bought items not yet received.
  // This is what makes the OTB strip live: every purchase reduces the
  // "available" budget instantly.
  const committedByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bought) {
      const item = marketplaceItems.find((m) => m.id === b.itemId);
      if (!item) continue;
      const stage = stageFor(b, item);
      if (stage === "Received") continue; // already counted in spent
      const committed = b.quantity * b.unitLandedCost;
      map.set(item.category, (map.get(item.category) ?? 0) + committed);
    }
    return map;
  }, [bought]);

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
        case "fit": {
          const ga = getGap(a.category)?.gapUnits ?? 0;
          const gb = getGap(b.category)?.gapUnits ?? 0;
          return gb - ga;
        }
        case "landed":
          return landedCostFor(a, a.moq).unitLanded - landedCostFor(b, b.moq).unitLanded;
        case "lead-asc":
          return a.leadTimeDays - b.leadTimeDays;
        case "reliability":
          return b.onTimeDeliveryRate - a.onTimeDeliveryRate;
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

  const totalBudget = categoryBudgets.reduce((s, b) => s + b.budgetUSD, 0);
  const totalSpent = categoryBudgets.reduce((s, b) => s + b.spentUSD, 0);
  const totalCommitted = [...committedByCategory.values()].reduce(
    (s, v) => s + v,
    0
  );
  const otbRemaining = totalBudget - totalSpent - totalCommitted;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Browse stock from other manufacturers and queue it for the next
            replenishment cycle. Every buy is checked against your category
            open-to-buy and the demand gap your forecast model projects.
          </p>
        </div>
        <div className="flex items-stretch gap-6">
          <HeroStat label={`${CURRENT_QUARTER} OTB left`} value={fmtCurrency(otbRemaining)} />
          <div className="border-l border-border" />
          <HeroStat
            label="Committed (pending)"
            value={fmtCurrency(totalCommitted)}
          />
          <div className="border-l border-border" />
          <HeroStat label="In replen queue" value={String(considerCount)} />
        </div>
      </div>

      <OtbStrip
        committedByCategory={committedByCategory}
        onSelectCategory={(c) => setCategoryFilter(c)}
        activeCategory={categoryFilter}
      />

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pager.slice.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    errored={imageErrors.has(item.id)}
                    onImageError={() =>
                      setImageErrors((prev) => new Set(prev).add(item.id))
                    }
                    onBuy={() => setBuyTarget(item)}
                    onShowSignals={() => setSignalTarget(item)}
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
                Bought items count as on-order inventory.
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                They reduce your projected demand gap on the SKU detail
                forecast and are pulled into the next replenishment plan when
                <strong> Consider for replen</strong> is on. The status timeline
                tracks each shipment from production through to receipt.
              </p>
            </div>
          </div>
          <BoughtList
            bought={bought}
            onToggleConsider={handleToggleConsider}
            onRemove={handleRemoveBought}
          />
        </TabsContent>
      </Tabs>

      <BuyDialog
        item={buyTarget}
        committedForCategory={
          buyTarget ? committedByCategory.get(buyTarget.category) ?? 0 : 0
        }
        onClose={() => setBuyTarget(null)}
        onConfirm={handleConfirmPurchase}
      />

      <TrendSignalsDialog
        item={signalTarget}
        onClose={() => setSignalTarget(null)}
      />
    </div>
  );
}

function OtbStrip({
  committedByCategory,
  onSelectCategory,
  activeCategory,
}: {
  committedByCategory: Map<string, number>;
  onSelectCategory: (c: string) => void;
  activeCategory: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-xs overflow-x-auto">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Open-to-buy · {CURRENT_QUARTER}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Click a category to filter
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {categoryBudgets.map((b) => {
          const committed = committedByCategory.get(b.category) ?? 0;
          const remaining = b.budgetUSD - b.spentUSD - committed;
          const usedShare = Math.min(
            100,
            Math.round(((b.spentUSD + committed) / b.budgetUSD) * 100)
          );
          const isActive = activeCategory === b.category;
          const tone =
            remaining < 0
              ? "text-destructive-foreground"
              : remaining < b.budgetUSD * 0.15
              ? "text-warning-foreground"
              : "text-foreground";
          const barTone =
            remaining < 0
              ? "bg-destructive"
              : remaining < b.budgetUSD * 0.15
              ? "bg-warning"
              : "bg-primary";
          return (
            <button
              key={b.category}
              type="button"
              onClick={() => onSelectCategory(b.category)}
              className={cn(
                "text-left rounded-lg border p-2.5 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                isActive
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {b.category}
              </p>
              <p className={cn("text-sm font-semibold tabular-nums mt-0.5", tone)}>
                {fmtCurrency(remaining)}
              </p>
              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full transition-all", barTone)}
                  style={{ width: `${usedShare}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                {fmtCompactCurrency(b.spentUSD + committed)} of{" "}
                {fmtCompactCurrency(b.budgetUSD)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MarketplaceCard({
  item,
  errored,
  onImageError,
  onBuy,
  onShowSignals,
}: {
  item: MarketplaceItem;
  errored: boolean;
  onImageError: () => void;
  onBuy: () => void;
  onShowSignals: () => void;
}) {
  const landed = landedCostFor(item, item.moq);
  const gap = getGap(item.category);
  // What share of the 90-day demand gap a single MOQ-sized buy would cover.
  const fitShare =
    gap && gap.gapUnits > 0
      ? Math.min(100, Math.round((item.moq / gap.gapUnits) * 100))
      : 0;
  const reliabilityTone =
    item.onTimeDeliveryRate >= 0.95
      ? "success"
      : item.onTimeDeliveryRate >= 0.88
      ? "info"
      : "warning";
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

        {/* Supplier scorecard chip */}
        <div className="flex items-center justify-between gap-1.5 text-xs flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            <BuildingIcon className="size-3" />
            <span className="font-medium text-foreground truncate max-w-[120px]">
              {item.manufacturer}
            </span>
            <span className="text-[10px]">· {item.countryOfOrigin}</span>
          </span>
          <Badge variant={reliabilityTone}>
            <ShieldCheckIcon className="size-3" />
            {Math.round(item.onTimeDeliveryRate * 100)}% on-time
          </Badge>
        </div>

        {/* Reliability + capacity row */}
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          <ReliabilityFact
            icon={<TruckIcon className="size-3" />}
            value={`${item.leadTimeDays}d`}
            hint={`±${item.leadTimeVarianceDays}d var`}
          />
          <ReliabilityFact
            icon={<AlertTriangleIcon className="size-3" />}
            value={`${(item.defectRate * 100).toFixed(1)}%`}
            hint="defect rate"
          />
          <ReliabilityFact
            icon={<CalendarIcon className="size-3" />}
            value={item.buyingWindow.season}
            hint={`book by ${item.buyingWindow.closeDate.slice(5)}`}
          />
        </div>

        {/* Forecast fit */}
        {gap && gap.gapUnits > 0 && (
          <div className="rounded-md bg-muted/40 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                Forecast fit
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {fitShare}% of {item.category} gap
              </span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${fitShare}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
              {gap.gapUnits.toLocaleString()} unit gap · 90-day forecast
            </p>
          </div>
        )}

        {/* Trend signal pill */}
        {item.trendSignals.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onShowSignals();
            }}
            className="text-left text-[11px] text-muted-foreground inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <TrendingUpIcon className="size-3" />
            {item.trendSignals.length} signal{item.trendSignals.length > 1 ? "s" : ""}
            {item.trendSignals[0].deltaPct
              ? ` · ${item.trendSignals[0].label} +${item.trendSignals[0].deltaPct}%`
              : ` · ${item.trendSignals[0].label}`}
          </button>
        )}

        {/* Price + Buy */}
        <div className="flex items-end justify-between gap-2 pt-2 mt-auto border-t border-border">
          <div>
            <p className="text-base font-semibold tracking-tight tabular-nums">
              ${landed.unitLanded.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground"> landed</span>
            </p>
            <p className="text-[10px] text-muted-foreground tabular-nums">
              ${item.unitPrice.toFixed(2)} FOB · {landed.uplift.toFixed(2)}× · MOQ {item.moq}
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

function ReliabilityFact({
  icon,
  value,
  hint,
}: {
  icon: ReactNode;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded border border-border bg-card px-1.5 py-1 leading-tight">
      <div className="inline-flex items-center gap-1 text-foreground font-medium tabular-nums">
        {icon}
        {value}
      </div>
      <p className="text-[10px] text-muted-foreground truncate">{hint}</p>
    </div>
  );
}

function BoughtList({
  bought,
  onToggleConsider,
  onRemove,
}: {
  bought: BoughtRecord[];
  onToggleConsider: (id: string) => void;
  onRemove: (id: string) => void;
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
    <div className="space-y-3">
      {bought.map((b) => {
        const item = marketplaceItems.find((m) => m.id === b.itemId);
        if (!item) return null;
        const stage = stageFor(b, item);
        return (
          <div
            key={b.id}
            className="rounded-xl border border-border bg-card shadow-xs overflow-hidden"
          >
            <div className="flex">
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="w-28 object-cover bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {item.manufacturer} · {item.countryOfOrigin}
                    </p>
                    <p className="text-sm font-semibold tracking-tight line-clamp-1">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {b.quantity.toLocaleString()} units · landed{" "}
                      {fmtCurrency(b.quantity * b.unitLandedCost)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove from queue"
                    onClick={() => {
                      if (confirm(`Remove ${item.productName} from queue?`))
                        onRemove(b.id);
                    }}
                  >
                    <XIcon />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Deliver to <span className="text-foreground">{b.warehouseName}</span>{" "}
                  by <span className="text-foreground">{b.needBy}</span>
                </p>
              </div>
            </div>
            <StatusTimeline stage={stage} item={item} record={b} />
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-muted/20">
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
        );
      })}
    </div>
  );
}

function StatusTimeline({
  stage,
  item,
  record,
}: {
  stage: LifecycleStage;
  item: MarketplaceItem;
  record: BoughtRecord;
}) {
  const currentIdx = STAGE_ORDER.indexOf(stage);
  const purchaseTime = new Date(record.purchasedAt).getTime();
  const expectedArrival = new Date(
    purchaseTime + item.leadTimeDays * 86400000
  )
    .toISOString()
    .split("T")[0];
  return (
    <div className="px-3 py-3 border-t border-border bg-card">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Status
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          ETA {expectedArrival}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {STAGE_ORDER.map((s, i) => {
          const reached = i <= currentIdx;
          const isCurrent = i === currentIdx && stage !== "Received";
          return (
            <div key={s} className="flex-1 flex items-center gap-1.5">
              <div className="flex flex-col items-center gap-0.5 min-w-0">
                <span
                  className={cn(
                    "inline-flex items-center justify-center size-5 rounded-full transition-colors",
                    reached
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground/50"
                  )}
                >
                  {reached ? (
                    <CircleCheckIcon className="size-3.5" />
                  ) : (
                    <CircleIcon className="size-3" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-wider font-medium leading-none whitespace-nowrap",
                    isCurrent
                      ? "text-primary"
                      : reached
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {s}
                </span>
              </div>
              {i < STAGE_ORDER.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    i < currentIdx ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendSignalsDialog({
  item,
  onClose,
}: {
  item: MarketplaceItem | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Why this item is surfacing</DialogTitle>
          <DialogDescription>
            Demand signals the model used to flag {item.productName} as worth
            reviewing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {item.trendSignals.map((s, i) => (
            <SignalRow key={i} signal={s} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Signal kinds: search interest, social mentions, peer-brand
          sell-through, weather forecasts, internal campaigns. Stronger signals
          carry more weight in the surfaced ranking.
        </p>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SignalRow({ signal }: { signal: TrendSignal }) {
  const labelByKind: Record<TrendSignal["kind"], string> = {
    search: "Search interest",
    social: "Social mentions",
    "peer-brand": "Peer brand benchmark",
    weather: "Weather forecast",
    campaign: "Internal campaign",
    "sell-through": "Sell-through",
  };
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {labelByKind[signal.kind]}
        </p>
        <p className="text-sm font-medium text-foreground truncate">
          {signal.label}
        </p>
      </div>
      {signal.deltaPct !== undefined && (
        <Badge variant="success" className="shrink-0">
          +{signal.deltaPct}%
        </Badge>
      )}
    </div>
  );
}

function BuyDialog({
  item,
  committedForCategory,
  onClose,
  onConfirm,
}: {
  item: MarketplaceItem | null;
  committedForCategory: number;
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

  useEffect(() => {
    if (item) {
      setWarehouseId(warehouses[0]?.id ?? "");
      setQuantity(item.moq);
      setNeedBy(defaultNeedByFor(item));
    }
  }, [item]);

  if (!item) return null;
  const warehouse = warehouses.find((w) => w.id === warehouseId);
  const landed = landedCostFor(item, quantity);
  const total = quantity * landed.unitLanded;
  const belowMoq = quantity < item.moq;

  const earliestArrival = (() => {
    const d = new Date();
    d.setDate(d.getDate() + item.leadTimeDays);
    return d.toISOString().split("T")[0];
  })();
  const tooSoon = needBy && needBy < earliestArrival;

  const budget = getBudget(item.category);
  const otbBefore = budget
    ? budget.budgetUSD - budget.spentUSD - committedForCategory
    : 0;
  const otbAfter = otbBefore - total;
  const overBudget = budget && otbAfter < 0;

  const gap = getGap(item.category);
  const gapShare =
    gap && gap.gapUnits > 0
      ? Math.min(100, Math.round((quantity / gap.gapUnits) * 100))
      : 0;

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
      unitLandedCost: landed.unitLanded,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Buy from marketplace</DialogTitle>
            <Badge variant="info">Bulk order</Badge>
          </div>
          <DialogDescription>
            Choose destination, quantity, and arrival date. The order is queued
            for the next replenishment cycle.
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
              {item.manufacturer} · {item.countryOfOrigin} · {item.paymentTerms}
            </p>
            <p className="text-sm font-semibold tracking-tight truncate">
              {item.productName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              MOQ {item.moq} · {item.leadTimeDays}d lead (±
              {item.leadTimeVarianceDays}d) ·{" "}
              {Math.round(item.onTimeDeliveryRate * 100)}% on-time
            </p>
          </div>
        </div>

        {/* OTB context — what your category budget looks like before/after */}
        {budget && (
          <div
            className={cn(
              "rounded-lg border px-3 py-2.5 text-xs space-y-1.5",
              overBudget
                ? "border-destructive/30 bg-destructive-soft"
                : otbAfter < budget.budgetUSD * 0.15
                ? "border-warning/30 bg-warning-soft/40"
                : "border-info/30 bg-info-soft/40"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                Open-to-buy · {item.category} · {CURRENT_QUARTER}
              </span>
              {overBudget && (
                <span className="text-destructive-foreground font-medium">
                  Over budget
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <OtbStat label="Available" value={fmtCurrency(otbBefore)} />
              <OtbStat label="This buy" value={fmtCurrency(total)} />
              <OtbStat
                label="After"
                value={fmtCurrency(otbAfter)}
                tone={
                  overBudget
                    ? "destructive"
                    : otbAfter < budget.budgetUSD * 0.15
                    ? "warning"
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {/* Forecast fit */}
        {gap && gap.gapUnits > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                Forecast fit · 90-day {item.category} gap
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {quantity.toLocaleString()} of {gap.gapUnits.toLocaleString()} ·{" "}
                {gapShare}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${gapShare}%` }}
              />
            </div>
          </div>
        )}

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

        {/* Landed cost breakdown */}
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Landed cost breakdown
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs tabular-nums">
            <span className="text-muted-foreground">FOB</span>
            <span className="text-right">${landed.fob.toFixed(2)}/unit</span>
            <span className="text-muted-foreground">Freight</span>
            <span className="text-right">+${landed.freight.toFixed(2)}/unit</span>
            <span className="text-muted-foreground">
              Duty ({Math.round(item.dutyRate * 100)}%)
            </span>
            <span className="text-right">+${landed.duty.toFixed(2)}/unit</span>
            <span className="text-muted-foreground">
              Inspection (${item.inspectionFee.toFixed(0)} flat)
            </span>
            <span className="text-right">
              +${landed.inspectionPerUnit.toFixed(2)}/unit
            </span>
            <span className="font-medium text-foreground border-t border-border pt-1">
              Landed unit cost
            </span>
            <span className="text-right font-semibold border-t border-border pt-1">
              ${landed.unitLanded.toFixed(2)}/unit ({landed.uplift.toFixed(2)}× FOB)
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Order total
            </span>
            <span className="text-base font-semibold tabular-nums">
              {fmtCurrency(total)}
            </span>
          </div>
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

function OtbStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "destructive";
}) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive-foreground"
      : tone === "warning"
      ? "text-warning-foreground"
      : "text-foreground";
  return (
    <div className="rounded border border-border bg-card px-2 py-1.5 leading-tight">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className={cn("text-sm font-semibold tabular-nums", toneClass)}>
        {value}
      </p>
    </div>
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

function fmtCurrency(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function fmtCompactCurrency(n: number): string {
  if (Math.abs(n) >= 1000) {
    return `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}
