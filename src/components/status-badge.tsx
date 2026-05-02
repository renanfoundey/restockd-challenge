"use client";

import { Badge } from "@/components/ui/badge";
import type { InventoryAction, SKU } from "@/lib/types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "outline";

const actionStatusConfig: Record<
  InventoryAction["status"],
  { variant: BadgeVariant }
> = {
  Suggested: { variant: "outline" },
  "Ready to Send": { variant: "warning" },
  "Sent to Provider": { variant: "info" },
  Processing: { variant: "info" },
  Completed: { variant: "success" },
};

export function StatusBadge({ status }: { status: InventoryAction["status"] }) {
  const config = actionStatusConfig[status];
  return <Badge variant={config.variant}>{status}</Badge>;
}

const skuStatusConfig: Record<SKU["status"], { variant: BadgeVariant }> = {
  "Out of Stock": { variant: "destructive" },
  Critical: { variant: "destructive" },
  "Low Stock": { variant: "warning" },
  "In Stock": { variant: "success" },
};

export function SkuStatusBadge({
  status,
  className,
}: {
  status: SKU["status"];
  className?: string;
}) {
  const config = skuStatusConfig[status];
  return (
    <Badge variant={config.variant} className={className}>
      {status}
    </Badge>
  );
}

export const SKU_STATUS_ORDER: Record<SKU["status"], number> = {
  "Out of Stock": 0,
  Critical: 1,
  "Low Stock": 2,
  "In Stock": 3,
};
