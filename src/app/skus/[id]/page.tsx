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
import { generateStockHistory } from "@/data/stock-history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const AreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false }
);
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
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import("recharts").then((m) => m.ReferenceLine),
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
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/skus">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">{sku.productName}</h1>
          <p className="text-xs text-muted-foreground">
            {sku.variant} &middot; <span className="font-mono">{sku.id}</span>
          </p>
        </div>
        <Badge
          variant={
            sku.status === "Out of Stock" || sku.status === "Critical"
              ? "destructive"
              : sku.status === "Low Stock"
              ? "secondary"
              : "outline"
          }
        >
          {sku.status}
        </Badge>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <ShareIcon className="h-4 w-4 mr-1" />
            {copied ? "Copied!" : "Share"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <DownloadIcon className="h-4 w-4 mr-1" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Product + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <img
            src={sku.imageUrl}
            alt={sku.productName}
            className="w-full h-64 object-cover rounded-lg bg-muted"
          />
          {supplier && (
            <div className="border border-border rounded-lg p-4 mt-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
                Supplier
              </h3>
              <p className="text-sm font-medium">{supplier.name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <p>MOQ</p>
                  <p className="text-foreground font-medium">{supplier.moq} units</p>
                </div>
                <div>
                  <p>Lead Time</p>
                  <p className="text-foreground font-medium">{supplier.leadTimeDays} days</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MailIcon className="h-3 w-3" /> {supplier.contactEmail}
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Current Stock</p>
              <p className="text-lg font-semibold">{sku.currentStock.toLocaleString()}</p>
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Days of Supply</p>
              <p className="text-lg font-semibold">{sku.daysOfSupply}</p>
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Avg Daily Sales</p>
              <p className="text-lg font-semibold">{sku.avgDailySales}</p>
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Reorder Point</p>
              <p className="text-lg font-semibold">{sku.reorderPoint}</p>
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Unit Cost</p>
              <p className="text-lg font-semibold">${sku.unitCost.toFixed(2)}</p>
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Lead Time</p>
              <p className="text-lg font-semibold">{sku.leadTimeDays} days</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <Badge variant="secondary">{sku.category}</Badge>
          </div>

          {/* Stock Trend Chart */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Stock Trend (90 days)</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockHistory}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    labelFormatter={(v: string) => `Date: ${v}`}
                  />
                  <ReferenceLine
                    y={sku.reorderPoint}
                    stroke="var(--color-destructive)"
                    strokeDasharray="4 4"
                    label={{ value: "Reorder Point", fontSize: 10, fill: "var(--color-destructive)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stock"
                    stroke="var(--color-chart-1)"
                    fill="var(--color-chart-1)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Reference Tabs */}
      <Tabs defaultValue={0}>
        <TabsList variant="line">
          <TabsTrigger value={0}>
            <PackageIcon className="h-4 w-4" />
            Purchase Orders ({relatedPOs.length})
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
            <p className="text-sm text-muted-foreground py-4">No related purchase orders found.</p>
          ) : (
            <div className="overflow-x-auto">
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
                          href={`/purchase-orders/${po.id}`}
                          className="font-medium hover:underline"
                        >
                          {po.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{po.supplierName}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === "Completed" ? "secondary" : "outline"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{po.createdDate}</TableCell>
                      <TableCell className="text-right">
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
            <p className="text-sm text-muted-foreground py-4">No related reorder recommendations found.</p>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell className="text-xs">{rec.variant}</TableCell>
                      <TableCell className="text-right">{rec.currentStock}</TableCell>
                      <TableCell className="text-right">{rec.forecastedDemand30d}</TableCell>
                      <TableCell className="text-right">{rec.recommendedQty}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rec.urgency === "High" ? "destructive" : rec.urgency === "Medium" ? "secondary" : "outline"
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
            <p className="text-sm text-muted-foreground py-4">No related rebalancing suggestions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From Warehouse</TableHead>
                    <TableHead>To Warehouse</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Suggested Qty</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedRebalances.map((rb) => (
                    <TableRow key={rb.id}>
                      <TableCell className="text-xs">{rb.fromWarehouse}</TableCell>
                      <TableCell className="text-xs">{rb.toWarehouse}</TableCell>
                      <TableCell>{rb.productName}</TableCell>
                      <TableCell className="text-xs">{rb.variant}</TableCell>
                      <TableCell className="text-right">{rb.suggestedQty}</TableCell>
                      <TableCell className="text-xs max-w-sm">{rb.reason}</TableCell>
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
