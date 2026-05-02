"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopDrivers } from "@/components/top-drivers";
import { usePaginated, PaginatorControls } from "@/components/paginator";
import { reorderActions } from "@/data/reorder-actions";
import { getItems } from "@/lib/storage";
import { splitVariant } from "@/lib/utils";
import { ArrowLeftIcon, ShareIcon, DownloadIcon, SparklesIcon } from "lucide-react";
import type { ReorderAction } from "@/lib/types";

export default function ReorderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [action, setAction] = useState(() => reorderActions.find((a) => a.id === id));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!action) {
      const stored = getItems<ReorderAction>("restockd_reorders");
      const found = stored.find((a) => a.id === id);
      if (found) setAction(found);
    }
  }, [id, action]);

  const driverItems = useMemo(
    () =>
      action
        ? action.recommendations.map((r) => ({
            skuId: r.skuId,
            productName: r.productName,
            variant: r.variant,
            qty: r.recommendedQty,
            value: r.estimatedCost,
          }))
        : [],
    [action]
  );

  if (!action) {
    return (
      <div className="p-6">
        <Link href="/reordering">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon /> Back
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">Reorder not found.</p>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Link href="/reordering" className="inline-block">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon /> Back to Reordering
        </Button>
      </Link>

      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {action.name}
            </h1>
            <StatusBadge status={action.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created {action.createdDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <ShareIcon />
            {copied ? "Copied!" : "Share"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <DownloadIcon /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Warehouse" value={action.warehouseName} />
        <MetricCard label="Store" value={action.storeName} />
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Categories
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {action.categories.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
        <MetricCard
          label="Total Value"
          value={`$${action.totalValue.toLocaleString()}`}
        />
      </div>

      <ReorderReasoning action={action} />

      <TopDrivers
        items={driverItems}
        description={`Top SKUs by estimated cost across ${action.recommendations.length} recommendations.`}
      />

      <RecommendationsTable recommendations={action.recommendations} />
    </div>
  );
}

function ReorderReasoning({ action }: { action: ReorderAction }) {
  const totalUnits = action.recommendations.reduce(
    (s, r) => s + r.recommendedQty,
    0
  );
  const distinctProducts = new Set(
    action.recommendations.map((r) => r.productName)
  ).size;
  const distinctSuppliers = new Set(
    action.recommendations.map((r) => r.supplierName)
  );
  const highUrgency = action.recommendations.filter(
    (r) => r.urgency === "High"
  ).length;
  // Profit forecast: assume a typical retail markup of 2.4x cost,
  // and a 30-day sell-through of 65% of recommended quantity.
  const SELL_THROUGH = 0.65;
  const MARKUP = 2.4;
  const projectedRevenue = action.totalValue * MARKUP * SELL_THROUGH;
  const projectedProfit = projectedRevenue - action.totalValue * SELL_THROUGH;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <SparklesIcon className="size-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
              Why this reorder was created
            </p>
            <h3 className="text-sm font-semibold tracking-tight mt-0.5">
              Buy {totalUnits.toLocaleString()} units across{" "}
              {distinctProducts} product
              {distinctProducts === 1 ? "" : "s"} from{" "}
              {distinctSuppliers.size} manufacturer
              {distinctSuppliers.size === 1 ? "" : "s"}
            </h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Reordering buys new inventory from the manufacturer and routes it
            through {action.warehouseName} to {action.storeName}. The forecast
            model flagged {action.recommendations.length.toLocaleString()} SKUs
            below their reorder point, with {highUrgency} marked High urgency.
            Bundling them now hits supplier MOQs and lands stock before
            projected stockout dates. Cost outlay{" "}
            <strong className="font-semibold tabular-nums">
              ${action.totalValue.toLocaleString()}
            </strong>{" "}
            against projected 30-day revenue of{" "}
            <strong className="font-semibold tabular-nums">
              ${Math.round(projectedRevenue).toLocaleString()}
            </strong>{" "}
            (assuming {Math.round(SELL_THROUGH * 100)}% sell-through at{" "}
            {MARKUP.toFixed(1)}× markup), for a projected gross profit of{" "}
            <strong className="font-semibold tabular-nums text-success-foreground">
              ${Math.round(projectedProfit).toLocaleString()}
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationsTable({
  recommendations,
}: {
  recommendations: ReorderAction["recommendations"];
}) {
  const pager = usePaginated(recommendations, 25);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold tracking-tight">
          Recommended SKUs
        </h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {recommendations.length.toLocaleString()} total
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden lg:table-cell">Variant</TableHead>
              <TableHead className="hidden md:table-cell">Size</TableHead>
              <TableHead className="text-right hidden md:table-cell">Current</TableHead>
              <TableHead className="text-right hidden md:table-cell">Forecast 30d</TableHead>
              <TableHead className="text-right">Recommended</TableHead>
              <TableHead className="hidden xl:table-cell">Reason</TableHead>
              <TableHead className="hidden xl:table-cell">Supplier</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Est. Cost</TableHead>
              <TableHead>Urgency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pager.slice.map((rec, idx) => {
              const { color, size } = splitVariant(rec.variant);
              return (
                <TableRow key={`${rec.skuId}-${idx}`}>
                  <TableCell className="font-mono text-xs">
                    {rec.skuId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {rec.productName}
                    <span className="lg:hidden block text-xs text-muted-foreground font-normal mt-0.5">
                      {rec.variant}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                    {color || rec.variant}
                  </TableCell>
                  <TableCell className="text-xs hidden md:table-cell">
                    {size ? (
                      <Badge variant="outline">{size}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden md:table-cell">
                    {rec.currentStock}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden md:table-cell">
                    {rec.forecastedDemand30d}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {rec.recommendedQty}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs whitespace-normal hidden xl:table-cell">
                    {rec.reason}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">
                    {rec.supplierName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden lg:table-cell">
                    ${rec.estimatedCost.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rec.urgency === "High"
                          ? "destructive"
                          : rec.urgency === "Medium"
                          ? "warning"
                          : "outline"
                      }
                    >
                      {rec.urgency}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginatorControls {...pager} unitLabel="recommendations" />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-sm font-semibold mt-1 truncate">{value}</p>
    </div>
  );
}
