"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { skus } from "@/data/skus";
import { getItems } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SKU } from "@/lib/types";

const categories = [...new Set(skus.map((s) => s.category))].sort();
const suppliers = [...new Set(skus.map((s) => s.supplierName))].sort();
const statuses = ["In Stock", "Low Stock", "Critical", "Out of Stock"];
const PAGE_SIZE = 20;

export default function SkusPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [uploadedSkus, setUploadedSkus] = useState<SKU[]>([]);

  useEffect(() => {
    setUploadedSkus(getItems<SKU>("restockd_uploaded_skus"));
  }, []);

  const allSkus = useMemo(() => [...skus, ...uploadedSkus], [uploadedSkus]);

  const filtered = useMemo(() => {
    return allSkus.filter((sku) => {
      if (search && !sku.productName.toLowerCase().includes(search.toLowerCase()) && !sku.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && sku.category !== categoryFilter) return false;
      if (supplierFilter !== "all" && sku.supplierName !== supplierFilter) return false;
      if (statusFilter !== "all" && sku.status !== statusFilter) return false;
      return true;
    });
  }, [search, categoryFilter, supplierFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">SKU Inventory</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} items</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { if (v) { setCategoryFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={(v) => { if (v) { setSupplierFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.map((sku) => (
          <Link key={sku.id} href={`/skus/${sku.id}`} className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/40 transition-colors cursor-pointer block">
            <img
              src={sku.imageUrl}
              alt={sku.productName}
              className="w-full h-48 object-cover bg-muted"
              loading="lazy"
            />
            <div className="p-3 space-y-1.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{sku.productName}</p>
                  <p className="text-xs text-muted-foreground">{sku.variant}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{sku.id}</span>
              </div>
              <div className="text-xs text-muted-foreground">{sku.category} &middot; {sku.supplierName}</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pt-1">
                <div>Stock: <span className="font-medium">{sku.currentStock}</span></div>
                <div>Avg/day: <span className="font-medium">{sku.avgDailySales}</span></div>
                <div>Days supply: <span className="font-medium">{sku.daysOfSupply}</span></div>
                <div>Reorder pt: <span className="font-medium">{sku.reorderPoint}</span></div>
              </div>
              <div className="text-xs pt-1">
                Status: {sku.status}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
