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
import { SkuLineStatusBadge } from "@/components/action-line-status";
import { SendToIntegration } from "@/components/send-to-integration";
import { reorderActions } from "@/data/reorder-actions";
import { getItems } from "@/lib/storage";
import { splitVariant } from "@/lib/utils";
import { ArrowLeftIcon, ShareIcon, DownloadIcon, SparklesIcon } from "lucide-react";
import type { ReorderAction, ReorderRecommendation } from "@/lib/types";

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
        <div className="flex flex-wrap gap-2">
          <SendToIntegration actionName={action.name} noun="reorder" />
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

      <RecommendationsTable
        recommendations={action.recommendations}
        actionStatus={action.status}
      />
    </div>
  );
}


function ReorderReasoning({ action }: { action: ReorderAction }) {
  // All numbers below are derived from the actual recommendations attached to
  // this action, so the reasoning text always matches the table beneath it.
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
  const readyNow = action.recommendations.filter(
    (r) => r.availability === "in_warehouse"
  ).length;
  const gated = action.recommendations.length - readyNow;

  // Profit forecast: a typical retail markup and a 30-day sell-through.
  // Cost basis is action.totalValue (sum of recommendation estimatedCost),
  // which is what the metric card "Total Value" displays — keeping the math
  // visibly consistent end-to-end.
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
              Move {totalUnits.toLocaleString()} units across{" "}
              {distinctProducts} product
              {distinctProducts === 1 ? "" : "s"} from {action.warehouseName}{" "}
              to {action.storeName}
            </h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            The forecast model flagged{" "}
            <strong className="font-semibold tabular-nums">
              {action.recommendations.length.toLocaleString()}
            </strong>{" "}
            SKUs in {action.warehouseName} below their reorder point —{" "}
            {highUrgency} marked High urgency.{" "}
            <strong className="font-semibold tabular-nums">{readyNow}</strong>{" "}
            can ship to {action.storeName} from warehouse stock today; the
            remaining{" "}
            <strong className="font-semibold tabular-nums">{gated}</strong> are
            gated by procurement or production from{" "}
            {distinctSuppliers.size} manufacturer
            {distinctSuppliers.size === 1 ? "" : "s"}. Cost outlay{" "}
            <strong className="font-semibold tabular-nums">
              ${action.totalValue.toLocaleString()}
            </strong>{" "}
            should generate{" "}
            <strong className="font-semibold tabular-nums">
              ${Math.round(projectedRevenue).toLocaleString()}
            </strong>{" "}
            in 30-day revenue at {Math.round(SELL_THROUGH * 100)}% sell-through
            and a {MARKUP.toFixed(1)}× markup, for a projected gross profit of{" "}
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
  actionStatus,
}: {
  recommendations: ReorderAction["recommendations"];
  actionStatus: ReorderAction["status"];
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
              <TableHead>Availability</TableHead>
              <TableHead className="hidden xl:table-cell">Reason</TableHead>
              <TableHead className="hidden xl:table-cell">Supplier</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Est. Cost</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
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
                  <TableCell>
                    <AvailabilityBadge rec={rec} />
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
                  <TableCell>
                    <SkuLineStatusBadge
                      status={actionStatus}
                      flow="reorder"
                      idx={idx}
                    />
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

function AvailabilityBadge({ rec }: { rec: ReorderRecommendation }) {
  // Per-SKU sourcing summary: where the units come from and how long any
  // gated portion will take to land at the warehouse.
  if (rec.availability === "in_warehouse") {
    return (
      <div className="space-y-0.5 max-w-[200px]">
        <Badge variant="success">Ready today</Badge>
        <p className="text-[10px] text-muted-foreground">
          {rec.warehouseStockOnHand.toLocaleString()} units at{" "}
          {rec.sourceWarehouseName}
        </p>
      </div>
    );
  }
  const variant = rec.availability === "in_transit" ? "info" : "warning";
  const label =
    rec.availability === "in_transit" ? "In transit" : "In production";
  const coverage =
    rec.warehouseStockOnHand > 0
      ? `${rec.warehouseStockOnHand.toLocaleString()} / ${rec.recommendedQty.toLocaleString()} on hand`
      : `0 / ${rec.recommendedQty.toLocaleString()} on hand`;
  return (
    <div className="space-y-0.5 max-w-[220px]">
      <Badge variant={variant}>{label}</Badge>
      <p className="text-[10px] text-muted-foreground leading-tight">
        +{rec.estimatedWaitDays}d {rec.productionStatus ? `· ${rec.productionStatus}` : ""}
      </p>
      <p className="text-[10px] text-muted-foreground leading-tight">
        {coverage} at {rec.sourceWarehouseName}
      </p>
    </div>
  );
}
