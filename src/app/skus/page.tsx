"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { skus } from "@/data/skus";
import { getItems } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkuStatusBadge, SKU_STATUS_ORDER } from "@/components/status-badge";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import type { SKU } from "@/lib/types";

const categories = [...new Set(skus.map((s) => s.category))].sort();
const supplierList = [...new Set(skus.map((s) => s.supplierName))].sort();
const statuses = ["In Stock", "Low Stock", "Critical", "Out of Stock"];
const PAGE_SIZE = 20;

export default function SkusPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [uploadedSkus, setUploadedSkus] = useState<SKU[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUploadedSkus(getItems<SKU>("restockd_uploaded_skus"));
  }, []);

  const allSkus = useMemo(() => [...skus, ...uploadedSkus], [uploadedSkus]);

  const filtered = useMemo(() => {
    const result = allSkus.filter((sku) => {
      if (
        search &&
        !sku.productName.toLowerCase().includes(search.toLowerCase()) &&
        !sku.id.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (categoryFilter !== "all" && sku.category !== categoryFilter)
        return false;
      if (supplierFilter !== "all" && sku.supplierName !== supplierFilter)
        return false;
      if (statusFilter !== "all" && sku.status !== statusFilter) return false;
      return true;
    });
    return result.sort((a, b) => {
      const sa = SKU_STATUS_ORDER[a.status];
      const sb = SKU_STATUS_ORDER[b.status];
      if (sa !== sb) return sa - sb;
      return a.daysOfSupply - b.daysOfSupply;
    });
  }, [allSkus, search, categoryFilter, supplierFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const activeFilterCount =
    (search ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (supplierFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            SKU Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Every SKU you carry, continuously analysed by our forecast model. Out-of-stock and critical items surface first so you act on what's hurting most.
          </p>
        </div>
        <div className="flex items-stretch gap-6">
          <HeroStat label="SKUs tracked" value={allSkus.length.toLocaleString()} />
          <div className="border-l border-border" />
          <HeroStat label="Categories" value={String(categories.length)} />
          <div className="border-l border-border" />
          <HeroStat label="Suppliers" value={String(supplierList.length)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterField label="Search">
            <div className="relative">
              <SearchIcon className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Product or SKU ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
          </FilterField>
          <FilterField label="Category">
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                if (v) {
                  setCategoryFilter(v);
                  setPage(1);
                }
              }}
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
          <FilterField label="Supplier">
            <Select
              value={supplierFilter}
              onValueChange={(v) => {
                if (v) {
                  setSupplierFilter(v);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {supplierList.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                if (v) {
                  setStatusFilter(v);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Showing {filtered.length.toLocaleString()} of {allSkus.length.toLocaleString()} SKUs
          </span>
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

      {paginated.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 flex flex-col items-center text-center gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <SearchIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-tight">
              No SKUs match
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try adjusting your filters or clearing the search.
            </p>
          </div>
          {activeFilterCount > 0 && (
            <Button size="sm" variant="outline" onClick={resetFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {paginated.map((sku) => (
            <Link
              key={sku.id}
              href={`/skus/${sku.id}`}
              aria-label={`${sku.productName}, ${sku.variant}, status ${sku.status}`}
              className="group bg-card border border-border rounded-xl overflow-hidden shadow-xs transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/40"
            >
              <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                {imageErrors.has(sku.id) ? (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <PackageIcon className="size-8" />
                  </div>
                ) : (
                  <img
                    src={sku.imageUrl}
                    alt={sku.productName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    onError={() =>
                      setImageErrors((prev) => new Set(prev).add(sku.id))
                    }
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                <div className="absolute top-2 left-2">
                  <span className="font-mono text-[10px] bg-black/55 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {sku.id}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <SkuStatusBadge
                    status={sku.status}
                    className="ring-1 ring-black/5 shadow-sm backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="p-3.5 space-y-2.5">
                <div>
                  <p className="text-sm font-semibold tracking-tight line-clamp-1">
                    {sku.productName}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {sku.variant}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {sku.category} · {sku.supplierName}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <Stat label="Stock" value={sku.currentStock.toLocaleString()} />
                  <Stat label="Days" value={String(sku.daysOfSupply)} />
                  <Stat label="Reorder" value={String(sku.reorderPoint)} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeftIcon /> Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRightIcon />
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
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
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
