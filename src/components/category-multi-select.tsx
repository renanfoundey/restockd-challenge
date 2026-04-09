"use client";

import { Button } from "@/components/ui/button";
import { productCategories } from "@/lib/categories";

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
    <div className="flex flex-wrap gap-2">
      {productCategories.map((cat) => (
        <Button
          key={cat}
          type="button"
          variant={selected.includes(cat) ? "default" : "outline"}
          size="sm"
          onClick={() => toggle(cat)}
        >
          {cat}
        </Button>
      ))}
    </div>
  );
}
