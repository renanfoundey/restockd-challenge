"use client";

import Link from "next/link";
import { skus } from "@/data/skus";
import { PackageIcon } from "lucide-react";
import { useState } from "react";
import type { SKU } from "@/lib/types";

export interface DriverItem {
  skuId: string;
  productName: string;
  variant?: string;
  qty: number;
  value: number;
}

// Many recommendation / rebalancing / PO records reference placeholder skuIds
// that do not exist in the inventory. Resolve to a real SKU by name (and
// variant when possible) so the card photo and link land somewhere real.
function resolveInventorySku(item: DriverItem): SKU | undefined {
  const direct = skus.find((s) => s.id === item.skuId);
  if (direct) return direct;
  const productMatches = skus.filter(
    (s) => s.productName.toLowerCase() === item.productName.toLowerCase()
  );
  if (productMatches.length === 0) {
    // Fall back to a fuzzy productName word-overlap match
    const words = item.productName.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const fuzzy = skus.find((s) => {
      const sn = s.productName.toLowerCase();
      return words.some((w) => sn.includes(w));
    });
    return fuzzy;
  }
  if (item.variant) {
    const variantMatch = productMatches.find(
      (s) => s.variant.toLowerCase() === item.variant!.toLowerCase()
    );
    if (variantMatch) return variantMatch;
  }
  return productMatches[0];
}

export function TopDrivers({
  items,
  description,
  unitLabel = "units",
  emptyText = "No driver data.",
  limit = 4,
}: {
  items: DriverItem[];
  description?: string;
  unitLabel?: string;
  emptyText?: string;
  limit?: number;
}) {
  const top = [...items]
    .sort((a, b) => b.value - a.value || b.qty - a.qty)
    .slice(0, limit);

  if (top.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">{emptyText}</p>
    );
  }

  const totalValue = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Top Drivers</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {top.map((item) => {
          const sku = resolveInventorySku(item);
          const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
          return (
            <DriverCard
              key={item.skuId}
              linkSkuId={sku?.id ?? item.skuId}
              displaySkuId={item.skuId}
              productName={item.productName}
              variant={item.variant ?? sku?.variant}
              qty={item.qty}
              value={item.value}
              share={share}
              imageUrl={sku?.imageUrl}
              unitLabel={unitLabel}
            />
          );
        })}
      </div>
    </div>
  );
}

function DriverCard({
  linkSkuId,
  displaySkuId,
  productName,
  variant,
  qty,
  value,
  share,
  imageUrl,
  unitLabel,
}: {
  linkSkuId: string;
  displaySkuId: string;
  productName: string;
  variant?: string;
  qty: number;
  value: number;
  share: number;
  imageUrl?: string;
  unitLabel: string;
}) {
  const [errored, setErrored] = useState(false);
  return (
    <Link
      href={`/skus/${linkSkuId}`}
      aria-label={`View ${productName} in SKU inventory`}
      className="group rounded-xl border border-border bg-card overflow-hidden shadow-xs transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/30 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/40"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {imageUrl && !errored ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <PackageIcon className="size-7" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <span className="font-mono text-[10px] bg-black/55 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
            {displaySkuId}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1.5 flex-1 flex flex-col">
        <div>
          <p className="text-sm font-semibold tracking-tight line-clamp-1">
            {productName}
          </p>
          {variant && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {variant}
            </p>
          )}
        </div>
        <div className="flex items-end justify-between gap-2 mt-auto pt-1">
          <div>
            <p className="text-base font-semibold tracking-tight tabular-nums">
              ${value.toLocaleString()}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {qty.toLocaleString()} {unitLabel} · {share.toFixed(0)}%
            </p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, share)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
