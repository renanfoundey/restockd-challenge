"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { skus } from "@/data/skus";
import { suppliers } from "@/data/suppliers";
import { recommendations } from "@/data/recommendations";
import { rebalancingSuggestions } from "@/data/rebalancing";
import { purchaseOrderActions } from "@/data/purchase-order-actions";
import { generateStockHistory, deriveForecastInsight } from "@/data/stock-history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkuStatusBadge } from "@/components/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeftIcon,
  ShareIcon,
  DownloadIcon,
  PackageIcon,
  TruckIcon,
  MailIcon,
} from "lucide-react";

const Area = dynamic(
  () => import("recharts").then((m) => m.Area),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((m) => m.Line),
  { ssr: false }
);
const ComposedChart = dynamic(
  () => import("recharts").then((m) => m.ComposedChart),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import("recharts").then((m) => m.ReferenceLine),
  { ssr: false }
);
const ReferenceDot = dynamic(
  () => import("recharts").then((m) => m.ReferenceDot),
  { ssr: false }
);

function wordsOverlap(a: string, b: string): boolean {
  const aWords = a.toLowerCase().split(/\s+/);
  const bWords = b.toLowerCase().split(/\s+/);
  let matches = 0;
  for (const w of aWords) {
    if (w.length > 2 && bWords.includes(w)) matches++;
  }
  return matches >= 1;
}

export default function SkuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sku = skus.find((s) => s.id === id);
  const [copied, setCopied] = useState(false);

  const supplier = useMemo(
    () => (sku ? suppliers.find((s) => s.id === sku.supplierId) : null),
    [sku]
  );

  const stockHistory = useMemo(
    () => (sku ? generateStockHistory(sku) : []),
    [sku]
  );

  const insight = useMemo(
    () => (sku ? deriveForecastInsight(sku) : null),
    [sku]
  );

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const relatedPOs = useMemo(() => {
    if (!sku) return [];
    return purchaseOrderActions.filter(
      (po) =>
        po.lineItems.some((item) => wordsOverlap(item.productName, sku.productName)) ||
        po.supplierName === sku.supplierName
    );
  }, [sku]);

  const relatedRecs = useMemo(() => {
    if (!sku) return [];
    return recommendations.filter(
      (rec) =>
        rec.supplierName === sku.supplierName &&
        wordsOverlap(rec.productName, sku.productName)
    );
  }, [sku]);

  const relatedRebalances = useMemo(() => {
    if (!sku) return [];
    return rebalancingSuggestions.filter(
      (rb) =>
        wordsOverlap(rb.productName, sku.productName) ||
        (rb.variant && sku.variant && rb.variant.split(" / ")[0] === sku.variant.split(" / ")[0])
    );
  }, [sku]);

  if (!sku) {
    return (
      <div className="p-6">
        <Link href="/skus">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon /> Back
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">SKU not found.</p>
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
      <Link href="/skus" className="inline-block">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon /> Back to SKUs
        </Button>
      </Link>

      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {sku.productName}
            </h1>
            <SkuStatusBadge status={sku.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {sku.variant} <span className="text-muted-foreground/50">·</span>{" "}
            <span className="font-mono text-xs">{sku.id}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl overflow-hidden border border-border bg-card shadow-xs">
            <img
              src={sku.imageUrl}
              alt={sku.productName}
              className="w-full aspect-[4/5] object-cover bg-muted"
            />
          </div>
          {supplier && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TruckIcon className="size-3.5" />
                Supplier
              </h3>
              <p className="text-sm font-semibold">{supplier.name}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">MOQ</p>
                  <p className="text-foreground font-medium tabular-nums">
                    {supplier.moq} units
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lead Time</p>
                  <p className="text-foreground font-medium tabular-nums">
                    {supplier.leadTimeDays} days
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-border text-xs text-muted-foreground">
                <MailIcon className="size-3" /> {supplier.contactEmail}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HeroMetric
              label="Current Stock"
              value={sku.currentStock.toLocaleString()}
              hint={`${sku.avgDailySales} units/day avg`}
            />
            <HeroMetric
              label="Days of Supply"
              value={String(sku.daysOfSupply)}
              hint={`Reorder at ${sku.reorderPoint} units`}
              accent={sku.daysOfSupply < 14}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CompactMetric label="Avg / day" value={String(sku.avgDailySales)} />
            <CompactMetric label="Reorder pt" value={String(sku.reorderPoint)} />
            <CompactMetric
              label="Unit cost"
              value={`$${sku.unitCost.toFixed(2)}`}
            />
            <CompactMetric
              label="Lead time"
              value={`${sku.leadTimeDays}d`}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold">Stock Outlook</h3>
                <p className="text-xs text-muted-foreground">
                  90 days actual + 30-day forecast
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] flex-wrap">
                <LegendDot color="var(--color-chart-1)" label="Actual" />
                <LegendDot color="var(--color-chart-1)" label="Forecast" dashed />
                <LegendDot color="var(--color-destructive)" label="Reorder point" dashed />
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stockHistory} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.slice(5)}
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "10px",
                      fontSize: 12,
                      boxShadow: "var(--shadow-md)",
                    }}
                    labelFormatter={(v) => `Date: ${v}`}
                  />
                  <ReferenceLine
                    y={sku.reorderPoint}
                    stroke="var(--color-destructive)"
                    strokeDasharray="4 4"
                    label={{
                      value: `Reorder: ${sku.reorderPoint}`,
                      fontSize: 11,
                      fill: "var(--color-destructive)",
                      position: "right",
                    }}
                  />
                  <ReferenceLine
                    x={todayStr}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="2 4"
                    label={{
                      value: "Today",
                      fontSize: 10,
                      fill: "var(--color-muted-foreground)",
                      position: "insideTopRight",
                    }}
                  />
                  {insight?.reorderDate && (
                    <ReferenceDot
                      x={insight.reorderDate}
                      y={sku.reorderPoint}
                      r={5}
                      fill="var(--color-destructive)"
                      stroke="var(--color-card)"
                      strokeWidth={2}
                      label={{
                        value: `Reorder ${insight.recommendedQty.toLocaleString()} units`,
                        fontSize: 11,
                        fill: "var(--color-destructive)",
                        position: "top",
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="stock"
                    stroke="var(--color-chart-1)"
                    fill="url(#stockGradient)"
                    strokeWidth={2}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {insight && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Days until reorder
                  </p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">
                    {insight.daysUntilReorder ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Recommended qty
                  </p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">
                    {insight.recommendedQty.toLocaleString()} units
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Order by
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {insight.reorderDate ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue={0}>
        <TabsList variant="line">
          <TabsTrigger value={0}>
            <PackageIcon />
            Replenishment ({relatedPOs.length})
          </TabsTrigger>
          <TabsTrigger value={1}>
            Reorder Recommendations ({relatedRecs.length})
          </TabsTrigger>
          <TabsTrigger value={2}>
            Rebalancing ({relatedRebalances.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={0}>
          {relatedPOs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No related replenishment orders found.</p>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Link
                          href={`/replenishment/${po.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {po.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{po.supplierName}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === "Completed" ? "secondary" : "outline"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{po.createdDate}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${po.totalValue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value={1}>
          {relatedRecs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No related reorder recommendations found.</p>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Forecast 30d</TableHead>
                    <TableHead className="text-right">Recommended Qty</TableHead>
                    <TableHead>Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedRecs.map((rec, idx) => (
                    <TableRow key={`${rec.skuId}-${idx}`}>
                      <TableCell className="font-mono text-xs">{rec.skuId}</TableCell>
                      <TableCell>{rec.productName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{rec.variant}</TableCell>
                      <TableCell className="text-right tabular-nums">{rec.currentStock}</TableCell>
                      <TableCell className="text-right tabular-nums">{rec.forecastedDemand30d}</TableCell>
                      <TableCell className="text-right tabular-nums">{rec.recommendedQty}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value={2}>
          {relatedRebalances.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No related rebalancing suggestions found.</p>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From Store</TableHead>
                    <TableHead>To Store</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Suggested Qty</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedRebalances.map((rb) => (
                    <TableRow key={rb.id}>
                      <TableCell className="text-xs text-muted-foreground">{rb.fromStore}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{rb.toStore}</TableCell>
                      <TableCell>{rb.productName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{rb.variant}</TableCell>
                      <TableCell className="text-right tabular-nums">{rb.suggestedQty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-sm whitespace-normal">{rb.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-xl border border-warning/30 bg-warning-soft/40 p-4 shadow-xs"
          : "rounded-xl border border-border bg-card p-4 shadow-xs"
      }
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums mt-1">
        {value}
      </p>
      {hint && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="inline-flex items-center" aria-hidden>
        {dashed ? (
          <svg width="14" height="2" viewBox="0 0 14 2">
            <line x1="0" y1="1" x2="14" y2="1" stroke={color} strokeWidth="2" strokeDasharray="3 2" />
          </svg>
        ) : (
          <span
            className="inline-block w-3 h-0.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
      </span>
      {label}
    </span>
  );
}
