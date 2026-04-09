"use client";

import { Badge } from "@/components/ui/badge";
import type { InventoryAction } from "@/lib/types";

const statusConfig: Record<
  InventoryAction["status"],
  { variant: "default" | "secondary" | "outline"; label?: string }
> = {
  Draft: { variant: "outline" },
  Processing: { variant: "secondary" },
  Ready: { variant: "default" },
  Approved: { variant: "default" },
  Completed: { variant: "secondary" },
};

export function StatusBadge({ status }: { status: InventoryAction["status"] }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{status}</Badge>;
}
