"use client";

import { useState, useEffect } from "react";
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
import { reorderActions } from "@/data/reorder-actions";
import { getItems } from "@/lib/storage";
import { ArrowLeftIcon, ShareIcon, DownloadIcon } from "lucide-react";
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

  if (!action) {
    return (
      <div className="p-6">
        <Link href="/reordering">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/reordering">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">{action.name}</h1>
          <p className="text-xs text-muted-foreground">
            Created {action.createdDate}
          </p>
        </div>
        <StatusBadge status={action.status} />
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Warehouse</p>
          <p className="text-sm font-medium">{action.warehouseName}</p>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Store</p>
          <p className="text-sm font-medium">{action.storeName}</p>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Categories</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {action.categories.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="text-sm font-medium">
            ${action.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Recommended SKUs</h2>
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
                <TableHead>Reason</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
                <TableHead>Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {action.recommendations.map((rec, idx) => (
                <TableRow key={`${rec.skuId}-${idx}`}>
                  <TableCell className="font-mono text-xs">
                    {rec.skuId}
                  </TableCell>
                  <TableCell>{rec.productName}</TableCell>
                  <TableCell className="text-xs">{rec.variant}</TableCell>
                  <TableCell className="text-right">
                    {rec.currentStock}
                  </TableCell>
                  <TableCell className="text-right">
                    {rec.forecastedDemand30d}
                  </TableCell>
                  <TableCell className="text-right">
                    {rec.recommendedQty}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs">
                    {rec.reason}
                  </TableCell>
                  <TableCell className="text-xs">{rec.supplierName}</TableCell>
                  <TableCell className="text-right">
                    ${rec.estimatedCost.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rec.urgency === "High"
                          ? "destructive"
                          : rec.urgency === "Medium"
                          ? "secondary"
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
      </div>
    </div>
  );
}
