"use client";

import Link from "next/link";
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
import type { InventoryAction } from "@/lib/types";

export function ActionListTable({
  items,
  basePath,
}: {
  items: InventoryAction[];
  basePath: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No items yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">SKUs</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer">
              <TableCell>
                <Link
                  href={`${basePath}/${item.id}`}
                  className="font-medium hover:underline"
                >
                  {item.name}
                </Link>
              </TableCell>
              <TableCell className="text-xs">{item.warehouseName}</TableCell>
              <TableCell className="text-xs">{item.storeName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.categories.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-right">{item.skuCount}</TableCell>
              <TableCell className="text-right">
                {item.totalValue > 0
                  ? `$${item.totalValue.toLocaleString()}`
                  : "—"}
              </TableCell>
              <TableCell className="text-xs">{item.createdDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
