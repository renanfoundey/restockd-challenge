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
import { skus } from "@/data/skus";
import { stores } from "@/data/stores";
import { rebalanceActions } from "@/data/rebalance-actions";
import { getItems } from "@/lib/storage";
import { splitVariant } from "@/lib/utils";
import {
  ArrowLeftIcon,
  ShareIcon,
  DownloadIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";
import type { RebalanceAction } from "@/lib/types";

const storeNameOf = (id: string) =>
  stores.find((s) => s.id === id)?.name ?? id;

export default function RebalanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [action, setAction] = useState(() => rebalanceActions.find((a) => a.id === id));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!action) {
      const stored = getItems<RebalanceAction>("restockd_rebalances");
      const found = stored.find((a) => a.id === id);
      if (found) setAction(found);
    }
  }, [id, action]);

  const driverItems = useMemo(() => {
    if (!action) return [];
    const bySku: Record<
      string,
      { skuId: string; productName: string; variant: string; qty: number; value: number }
    > = {};
    for (const s of action.suggestions) {
      const sku = skus.find((sk) => sk.id === s.skuId);
      const unitCost = sku?.unitCost ?? 0;
      if (!bySku[s.skuId]) {
        bySku[s.skuId] = {
          skuId: s.skuId,
          productName: s.productName,
          variant: s.variant,
          qty: 0,
          value: 0,
        };
      }
      bySku[s.skuId].qty += s.suggestedQty;
      bySku[s.skuId].value += s.suggestedQty * unitCost;
    }
    return Object.values(bySku);
  }, [action]);

  if (!action) {
    return (
      <div className="p-6">
        <Link href="/rebalancing">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon /> Back
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Rebalance not found.
        </p>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalQty = action.suggestions.reduce(
    (sum, s) => sum + s.suggestedQty,
    0
  );
  const sourceStoreIds = new Set(action.suggestions.map((s) => s.fromStore));
  const destStoreIds = new Set(action.suggestions.map((s) => s.toStore));
  const sourceStoresCount = sourceStoreIds.size;
  const destStoresCount = destStoreIds.size;
  const sourceStoresList = [...sourceStoreIds]
    .map(storeNameOf)
    .join(" · ");
  const destStoresList = [...destStoreIds].map(storeNameOf).join(" · ");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Link href="/rebalancing" className="inline-block">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon /> Back to Rebalancing
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
        <MetricCard
          label="Source Stores"
          value={String(sourceStoresCount)}
          hint={sourceStoresList}
        />
        <MetricCard
          label="Destination Stores"
          value={String(destStoresCount)}
          hint={destStoresList}
        />
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
          label="Total Units"
          value={totalQty.toLocaleString()}
        />
      </div>

      <RebalanceReasoning action={action} />

      <TopDrivers
        items={driverItems}
        description={`Top SKUs by value across ${action.suggestions.length} suggestions.`}
      />

      <SuggestionsTable suggestions={action.suggestions} />
    </div>
  );
}

function RebalanceReasoning({ action }: { action: RebalanceAction }) {
  // All numbers below derive from action.suggestions so they always agree
  // with the table and the metric cards above. Rebalancing is store-to-store
  // — no warehouses involved, no supplier lead time, no new procurement.
  const totalQty = action.suggestions.reduce((s, x) => s + x.suggestedQty, 0);
  const sourceStores = new Set(action.suggestions.map((s) => s.fromStore));
  const destStores = new Set(action.suggestions.map((s) => s.toStore));
  const distinctProducts = new Set(
    action.suggestions.map((s) => s.productName)
  ).size;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <SparklesIcon className="size-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
              Why this rebalance was created
            </p>
            <h3 className="text-sm font-semibold tracking-tight mt-0.5">
              Transfer {totalQty.toLocaleString()} units of{" "}
              {distinctProducts} product
              {distinctProducts === 1 ? "" : "s"} from{" "}
              {sourceStores.size} source store
              {sourceStores.size === 1 ? "" : "s"} into{" "}
              {destStores.size} higher-demand store
              {destStores.size === 1 ? "" : "s"}
            </h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Rebalancing moves existing store inventory store-to-store — no
            warehouse hop, no purchase order, no supplier lead time. The
            forecast model spotted stores holding excess stock against soft
            demand while sister stores are flagged Critical or Low Stock.
            Executing these{" "}
            <strong className="font-semibold tabular-nums">
              {action.suggestions.length.toLocaleString()}
            </strong>{" "}
            transfers totals{" "}
            <strong className="font-semibold tabular-nums">
              {totalQty.toLocaleString()} units
            </strong>{" "}
            and should clear the donor stores and restore coverage at the
            destinations within a few business days.
          </p>
        </div>
      </div>
    </div>
  );
}

function SuggestionsTable({
  suggestions,
}: {
  suggestions: RebalanceAction["suggestions"];
}) {
  const pager = usePaginated(suggestions, 25);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold tracking-tight">
          Rebalancing Suggestions
        </h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {suggestions.length.toLocaleString()} total
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
              <TableHead className="hidden md:table-cell">From Store</TableHead>
              <TableHead className="hidden md:table-cell">To Store</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="hidden xl:table-cell">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pager.slice.map((item) => {
              const { color, size } = splitVariant(item.variant);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.skuId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.productName}
                    <span className="lg:hidden block text-xs text-muted-foreground font-normal mt-0.5">
                      {item.variant}
                    </span>
                    <span className="md:hidden flex items-center gap-1 text-xs text-muted-foreground font-normal mt-1">
                      <span className="truncate">{storeNameOf(item.fromStore)}</span>
                      <ArrowRightIcon className="size-3 shrink-0" />
                      <span className="truncate">{storeNameOf(item.toStore)}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                    {color || item.variant}
                  </TableCell>
                  <TableCell className="text-xs hidden md:table-cell">
                    {size ? (
                      <Badge variant="outline">{size}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {storeNameOf(item.fromStore)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {storeNameOf(item.toStore)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {item.suggestedQty}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-sm whitespace-normal hidden xl:table-cell">
                    {item.reason}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginatorControls {...pager} unitLabel="suggestions" />
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
