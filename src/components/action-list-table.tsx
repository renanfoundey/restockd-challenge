"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ArrowRightIcon, Trash2Icon, type LucideIcon } from "lucide-react";

export interface EmptyState {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ActionListTable({
  items,
  basePath,
  emptyState,
  onRemove,
}: {
  items: InventoryAction[];
  basePath: string;
  emptyState?: EmptyState;
  onRemove?: (item: InventoryAction) => void;
}) {
  if (items.length === 0) {
    if (emptyState) {
      const Icon = emptyState.icon;
      return (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 flex flex-col items-center text-center gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Icon className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-tight">
              {emptyState.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {emptyState.description}
            </p>
          </div>
          {emptyState.actionLabel && emptyState.onAction && (
            <Button size="sm" onClick={emptyState.onAction} className="mt-2">
              {emptyState.actionLabel}
            </Button>
          )}
        </div>
      );
    }
    return (
      <p className="text-sm text-muted-foreground py-4">
        No items yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
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
            <TableHead className="text-right w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="group hover:bg-muted/40 cursor-pointer"
            >
              <TableCell>
                <Link
                  href={`${basePath}/${item.id}`}
                  className="font-medium text-foreground inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  {item.name}
                  <ArrowRightIcon className="size-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {item.warehouseName}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {item.storeName}
              </TableCell>
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
              <TableCell className="text-right tabular-nums">
                {item.skuCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.totalValue > 0
                  ? `$${item.totalValue.toLocaleString()}`
                  : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {item.createdDate}
              </TableCell>
              <TableCell className="text-right">
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.name}`}
                    title={`Remove ${item.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (
                        confirm(
                          `Remove "${item.name}"? This cannot be undone.`
                        )
                      ) {
                        onRemove(item);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
