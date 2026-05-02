"use client";

import { productCategories } from "@/lib/categories";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategoryMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (categories: string[]) => void;
}) {
  const toggle = (cat: string) => {
    onChange(
      selected.includes(cat)
        ? selected.filter((c) => c !== cat)
        : [...selected, cat]
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {productCategories.map((cat) => {
        const isSelected = selected.includes(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            )}
          >
            {isSelected && <CheckIcon className="size-3" />}
            {cat}
          </button>
        );
      })}
    </div>
  );
}
