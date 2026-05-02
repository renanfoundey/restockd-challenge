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
import { purchaseOrderActions } from "@/data/purchase-order-actions";
import { skus } from "@/data/skus";
import { suppliers } from "@/data/suppliers";
import { getItems } from "@/lib/storage";
import { splitVariant } from "@/lib/utils";
import {
  ArrowLeftIcon,
  ShareIcon,
  DownloadIcon,
  SparklesIcon,
} from "lucide-react";
import type { PurchaseOrderAction } from "@/lib/types";

export default function ReplenishmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [action, setAction] = useState(() => purchaseOrderActions.find((a) => a.id === id));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!action) {
      const stored = getItems<PurchaseOrderAction>("restockd_purchase_orders");
      const found = stored.find((a) => a.id === id);
      if (found) setAction(found);
    }
  }, [id, action]);

  const driverItems = useMemo(
    () =>
      action
        ? action.lineItems.map((li) => ({
            skuId: li.skuId,
            productName: li.productName,
            qty: li.quantity,
            value: li.lineTotal,
          }))
        : [],
    [action]
  );

  if (!action) {
    return (
      <div className="p-6">
        <Link href="/replenishment">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon /> Back
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Replenishment not found.
        </p>
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
      <Link href="/replenishment" className="inline-block">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon /> Back to Replenishment
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
            Created {action.createdDate} · Supplier {action.supplierName}
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
        <MetricCard label="Supplier" value={action.supplierName} />
        <MetricCard
          label="Warehouses"
          value={`${action.warehouseNames?.length ?? 1}`}
          hint={(action.warehouseNames ?? [action.warehouseName]).join(" · ")}
        />
        <MetricCard
          label="Stores"
          value={`${action.storeNames?.length ?? 1}`}
          hint={(action.storeNames ?? [action.storeName]).join(" · ")}
        />
        <MetricCard label="Expected Delivery" value={action.expectedDelivery} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
          label="Total Cost"
          value={`$${action.totalValue.toLocaleString()}`}
        />
        <MetricCard
          label="Line Items"
          value={action.lineItems.length.toLocaleString()}
        />
      </div>

      <ReplenishmentReasoning action={action} />

      <TopDrivers
        items={driverItems}
        description={`Top SKUs by line total across ${action.lineItems.length} line items.`}
      />

      <LineItemsTable action={action} />
    </div>
  );
}

function ReplenishmentReasoning({ action }: { action: PurchaseOrderAction }) {
  const supplier = suppliers.find((s) => s.id === action.supplierId);
  const totalUnits = action.lineItems.reduce((s, li) => s + li.quantity, 0);
  const distinctProducts = new Set(action.lineItems.map((li) => li.productName))
    .size;
  const distinctWarehouses = new Set(
    action.lineItems
      .map((li) => li.destinationWarehouseName)
      .filter(Boolean) as string[]
  );
  const distinctStores = new Set(
    action.lineItems
      .map((li) => li.destinationStoreName)
      .filter(Boolean) as string[]
  );
  const SELL_THROUGH = 0.7;
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
              Why this replenishment was created
            </p>
            <h3 className="text-sm font-semibold tracking-tight mt-0.5">
              Restock {distinctProducts} product
              {distinctProducts === 1 ? "" : "s"} from {action.supplierName} into{" "}
              {distinctWarehouses.size || 1} warehouse
              {distinctWarehouses.size === 1 ? "" : "s"} for{" "}
              {distinctStores.size || 1} store
              {distinctStores.size === 1 ? "" : "s"}
            </h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Replenishment buys new inventory from {action.supplierName} and
            distributes it across the network: manufacturer → warehouse →
            store. {action.lineItems.length.toLocaleString()} line items
            totaling{" "}
            <strong className="font-semibold tabular-nums">
              {totalUnits.toLocaleString()} units
            </strong>
            . The forecast flagged these SKUs as below their reorder point or
            projected to drop below it within {supplier?.leadTimeDays ?? 14}{" "}
            days. Bundling them meets MOQ {supplier?.moq ?? "—"} efficiently
            and lands stock by {action.expectedDelivery}. Cost outlay{" "}
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
          <div className="flex flex-wrap gap-1.5 pt-1">
            {action.categories.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LineItemsTable({ action }: { action: PurchaseOrderAction }) {
  const pager = usePaginated(action.lineItems, 25);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold tracking-tight">Line Items</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {action.lineItems.length.toLocaleString()} total
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden lg:table-cell">Size</TableHead>
              <TableHead className="hidden md:table-cell">Destination</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right hidden md:table-cell">Unit Cost</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pager.slice.map((item, idx) => {
              const sku = skus.find((s) => s.id === item.skuId);
              const { size } = splitVariant(sku?.variant);
              const destWh =
                item.destinationWarehouseName ?? action.warehouseName;
              const destStore =
                item.destinationStoreName ?? action.storeName;
              return (
                <TableRow key={`${item.skuId}-${idx}`}>
                  <TableCell className="font-mono text-xs hidden sm:table-cell">
                    {item.skuId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.productName}
                    <span className="sm:hidden block text-xs text-muted-foreground font-mono font-normal mt-0.5">
                      {item.skuId}
                    </span>
                    <span className="md:hidden block text-xs text-muted-foreground font-normal mt-0.5">
                      {destWh} → {destStore} · ${item.unitCost.toFixed(2)} / unit
                    </span>
                  </TableCell>
                  <TableCell className="text-xs hidden lg:table-cell">
                    {size ? (
                      <Badge variant="outline">{size}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell whitespace-normal">
                    <span className="block">{destWh}</span>
                    <span className="block text-[11px] text-muted-foreground/80">
                      → {destStore}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden md:table-cell">
                    ${item.unitCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${item.lineTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/40 font-semibold">
              <TableCell colSpan={6} className="text-right">
                Total (all pages)
              </TableCell>
              <TableCell className="text-right tabular-nums">
                ${action.totalValue.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <PaginatorControls {...pager} unitLabel="line items" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-sm font-semibold mt-1 truncate">{value}</p>
      {hint && (
        <p
          className="text-[11px] text-muted-foreground mt-1 line-clamp-2"
          title={hint}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
