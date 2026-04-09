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
import { purchaseOrderActions } from "@/data/purchase-order-actions";
import { getItems } from "@/lib/storage";
import { ArrowLeftIcon, ShareIcon, DownloadIcon } from "lucide-react";
import type { PurchaseOrderAction } from "@/lib/types";

export default function PurchaseOrderDetailPage() {
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

  if (!action) {
    return (
      <div className="p-6">
        <Link href="/purchase-orders">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Purchase order not found.
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/purchase-orders">
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
          <p className="text-xs text-muted-foreground">Supplier</p>
          <p className="text-sm font-medium">{action.supplierName}</p>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Warehouse</p>
          <p className="text-sm font-medium">{action.warehouseName}</p>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Store</p>
          <p className="text-sm font-medium">{action.storeName}</p>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Expected Delivery</p>
          <p className="text-sm font-medium">{action.expectedDelivery}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="text-sm font-medium">
            ${action.totalValue.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Line Items</p>
          <p className="text-sm font-medium">{action.lineItems.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Line Items</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {action.lineItems.map((item, idx) => (
                <TableRow key={`${item.skuId}-${idx}`}>
                  <TableCell className="font-mono text-xs">
                    {item.skuId}
                  </TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${item.unitCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${item.lineTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell colSpan={4} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-right">
                  ${action.totalValue.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
