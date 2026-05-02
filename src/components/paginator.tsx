"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function usePaginated<T>(items: T[], pageSize = 25) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Clamp the page when items change underneath us
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const slice = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );
  return {
    page,
    totalPages,
    setPage,
    slice,
    rangeStart: items.length === 0 ? 0 : (page - 1) * pageSize + 1,
    rangeEnd: Math.min(page * pageSize, items.length),
    total: items.length,
  };
}

export function PaginatorControls({
  page,
  totalPages,
  setPage,
  rangeStart,
  rangeEnd,
  total,
  unitLabel = "items",
}: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  unitLabel?: string;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground tabular-nums">
        {total.toLocaleString()} {unitLabel}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
      <p className="text-muted-foreground tabular-nums">
        Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
        {total.toLocaleString()} {unitLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeftIcon /> Previous
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums px-2">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
