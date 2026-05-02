import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function splitVariant(variant: string | undefined | null): {
  color: string;
  size: string;
} {
  if (!variant) return { color: "", size: "" };
  const parts = variant
    .split(" / ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { color: "", size: "" };
  if (parts.length === 1) return { color: parts[0], size: "" };
  return {
    color: parts.slice(0, -1).join(" / "),
    size: parts[parts.length - 1],
  };
}
