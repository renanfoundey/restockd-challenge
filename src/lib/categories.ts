import { skus } from "@/data/skus";

export const productCategories = [...new Set(skus.map((s) => s.category))].sort();
