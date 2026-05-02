export type TrendSignalKind =
  | "search"
  | "social"
  | "peer-brand"
  | "weather"
  | "campaign"
  | "sell-through";

export interface TrendSignal {
  kind: TrendSignalKind;
  label: string; // human-readable description
  deltaPct?: number; // +/- % change vs baseline
}

export interface MarketplaceItem {
  id: string;
  productName: string;
  manufacturer: string;
  category: string;
  description: string;
  // FOB / supplier ex-works price.
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  rating: number;
  ratingCount: number;
  inStock: boolean;
  imageUrl: string;
  tags: string[];
  // === Landed cost components (planner-grade pricing) ===
  // Per-unit shipping cost from supplier to your warehouse.
  freightUnitCost: number;
  // Tariff applied to FOB price; 0.18 = 18%.
  dutyRate: number;
  // Flat per-order inspection / broker fee (amortized in landed unit cost).
  inspectionFee: number;
  // === Supplier reliability scorecard ===
  countryOfOrigin: string;
  paymentTerms: string;
  // Share of recent shipments that arrived on or before promised date.
  onTimeDeliveryRate: number; // 0..1
  // Defective / return rate observed over recent shipments.
  defectRate: number; // 0..1
  // ± days variance against the supplier's stated lead time.
  leadTimeVarianceDays: number;
  // Units the manufacturer can still take in their current production window.
  capacityRemainingUnits: number;
  // === Planning context ===
  // Buying / drop window — when this item is intended to land in stores.
  buyingWindow: { season: string; closeDate: string };
  // Why this item surfaced — one or more demand signals with provenance.
  trendSignals: TrendSignal[];
}

export interface LandedCost {
  fob: number;
  freight: number;
  duty: number;
  inspectionPerUnit: number;
  unitLanded: number;
  // Multiplier vs FOB so the planner can see the upcharge at a glance.
  uplift: number;
}

export function landedCostFor(item: MarketplaceItem, qty: number): LandedCost {
  const fob = item.unitPrice;
  const freight = item.freightUnitCost;
  const duty = fob * item.dutyRate;
  const inspectionPerUnit = qty > 0 ? item.inspectionFee / qty : 0;
  const unitLanded = fob + freight + duty + inspectionPerUnit;
  return {
    fob,
    freight,
    duty,
    inspectionPerUnit,
    unitLanded: Math.round(unitLanded * 100) / 100,
    uplift: fob > 0 ? Math.round((unitLanded / fob) * 100) / 100 : 1,
  };
}

const PRODUCT_IMAGE_COUNT = 30;

function img(i: number) {
  return `/images/products/product-${String(((i - 1) % PRODUCT_IMAGE_COUNT) + 1).padStart(2, "0")}.jpg`;
}

export const marketplaceManufacturers = [
  "Atlas & Bloom",
  "Stitchcraft Co.",
  "Northwind Apparel",
  "Meridian Textiles",
  "Sundial Brands",
  "Loomwell Studio",
  "Cedar Lane Goods",
  "Ironwood Workwear",
];

// Per-manufacturer scorecard. In a real system these would come from
// shipment / receipts data. Using a fixed table keeps every item from a
// given supplier consistent.
const SUPPLIER_SCORECARD: Record<
  string,
  {
    countryOfOrigin: string;
    paymentTerms: string;
    onTimeDeliveryRate: number;
    defectRate: number;
    leadTimeVarianceDays: number;
    dutyRate: number;
    freightUplift: number; // freight $/unit added on top of FOB
  }
> = {
  "Atlas & Bloom": {
    countryOfOrigin: "Portugal",
    paymentTerms: "Net 45",
    onTimeDeliveryRate: 0.94,
    defectRate: 0.012,
    leadTimeVarianceDays: 3,
    dutyRate: 0.12,
    freightUplift: 4.5,
  },
  "Stitchcraft Co.": {
    countryOfOrigin: "Italy",
    paymentTerms: "30% deposit + 70% balance",
    onTimeDeliveryRate: 0.88,
    defectRate: 0.018,
    leadTimeVarianceDays: 5,
    dutyRate: 0.14,
    freightUplift: 5.0,
  },
  "Northwind Apparel": {
    countryOfOrigin: "Vietnam",
    paymentTerms: "Net 30",
    onTimeDeliveryRate: 0.91,
    defectRate: 0.022,
    leadTimeVarianceDays: 4,
    dutyRate: 0.16,
    freightUplift: 3.0,
  },
  "Meridian Textiles": {
    countryOfOrigin: "Turkey",
    paymentTerms: "Net 30",
    onTimeDeliveryRate: 0.96,
    defectRate: 0.009,
    leadTimeVarianceDays: 2,
    dutyRate: 0.13,
    freightUplift: 3.5,
  },
  "Sundial Brands": {
    countryOfOrigin: "India",
    paymentTerms: "LC at sight",
    onTimeDeliveryRate: 0.83,
    defectRate: 0.031,
    leadTimeVarianceDays: 9,
    dutyRate: 0.18,
    freightUplift: 2.5,
  },
  "Loomwell Studio": {
    countryOfOrigin: "Spain",
    paymentTerms: "Net 60",
    onTimeDeliveryRate: 0.92,
    defectRate: 0.014,
    leadTimeVarianceDays: 4,
    dutyRate: 0.12,
    freightUplift: 4.0,
  },
  "Cedar Lane Goods": {
    countryOfOrigin: "USA",
    paymentTerms: "Net 30",
    onTimeDeliveryRate: 0.97,
    defectRate: 0.008,
    leadTimeVarianceDays: 1,
    dutyRate: 0.0,
    freightUplift: 1.5,
  },
  "Ironwood Workwear": {
    countryOfOrigin: "Mexico",
    paymentTerms: "Net 45",
    onTimeDeliveryRate: 0.9,
    defectRate: 0.016,
    leadTimeVarianceDays: 3,
    dutyRate: 0.0,
    freightUplift: 2.0,
  },
};

// Trend signal generator — surfaces *why* an item appears trending/new/etc.
// instead of just showing a label. Deterministic per item id.
function trendSignalsFor(item: { id: string; tags: string[]; category: string }): TrendSignal[] {
  const seed = parseInt(item.id.replace(/[^0-9]/g, "")) || 0;
  const out: TrendSignal[] = [];
  if (item.tags.includes("trending")) {
    out.push({
      kind: "search",
      label: `${item.category} search interest`,
      deltaPct: 18 + (seed % 22),
    });
    out.push({
      kind: "social",
      label: "TikTok mentions (last 7d)",
      deltaPct: 35 + (seed % 60),
    });
  }
  if (item.tags.includes("bestseller")) {
    out.push({
      kind: "sell-through",
      label: "Peer brand sell-through",
      deltaPct: 12 + (seed % 18),
    });
  }
  if (item.tags.includes("new")) {
    out.push({
      kind: "campaign",
      label: "Spring drop launch window",
    });
  }
  if (item.category === "Outerwear") {
    out.push({
      kind: "weather",
      label: "Cold front forecast NE region",
      deltaPct: 8 + (seed % 14),
    });
  }
  if (out.length === 0) {
    out.push({
      kind: "peer-brand",
      label: "Steady demand baseline",
    });
  }
  return out;
}

const SEASONS: { season: string; closeDate: string }[] = [
  { season: "SS27", closeDate: "2026-08-15" },
  { season: "FW27", closeDate: "2026-11-30" },
  { season: "Carryover", closeDate: "2027-02-28" },
];

type RawItem = Omit<
  MarketplaceItem,
  | "freightUnitCost"
  | "dutyRate"
  | "inspectionFee"
  | "countryOfOrigin"
  | "paymentTerms"
  | "onTimeDeliveryRate"
  | "defectRate"
  | "leadTimeVarianceDays"
  | "capacityRemainingUnits"
  | "buyingWindow"
  | "trendSignals"
>;

function enrich(raw: RawItem, idx: number): MarketplaceItem {
  const card = SUPPLIER_SCORECARD[raw.manufacturer] ?? {
    countryOfOrigin: "—",
    paymentTerms: "Net 30",
    onTimeDeliveryRate: 0.9,
    defectRate: 0.02,
    leadTimeVarianceDays: 4,
    dutyRate: 0.12,
    freightUplift: 3.5,
  };
  const seed = parseInt(raw.id.replace(/[^0-9]/g, "")) || idx;
  // Capacity declines for popular items, fuller for slow movers
  const capacityRemainingUnits = raw.tags.includes("bestseller")
    ? 800 + (seed % 600)
    : 2400 + (seed % 1800);
  // Inspection fee is a flat ~$200-$400 per shipment regardless of qty
  const inspectionFee = 220 + (seed % 200);
  return {
    ...raw,
    freightUnitCost: card.freightUplift,
    dutyRate: card.dutyRate,
    inspectionFee,
    countryOfOrigin: card.countryOfOrigin,
    paymentTerms: card.paymentTerms,
    onTimeDeliveryRate: card.onTimeDeliveryRate,
    defectRate: card.defectRate,
    leadTimeVarianceDays: card.leadTimeVarianceDays,
    capacityRemainingUnits,
    buyingWindow: SEASONS[idx % SEASONS.length],
    trendSignals: trendSignalsFor(raw),
  };
}

const baseMarketplaceItems: RawItem[] = [
  { id: "MK-1001", productName: "Quilted Field Jacket", manufacturer: "Atlas & Bloom", category: "Outerwear", description: "Waxed cotton shell with Sherpa lining. Heritage workwear silhouette.", unitPrice: 68.5, moq: 24, leadTimeDays: 18, rating: 4.7, ratingCount: 142, inStock: true, imageUrl: img(1), tags: ["bestseller"] },
  { id: "MK-1002", productName: "Cropped Bomber", manufacturer: "Northwind Apparel", category: "Outerwear", description: "Lightweight nylon with rib trim. Trending for spring drops.", unitPrice: 42.0, moq: 36, leadTimeDays: 14, rating: 4.4, ratingCount: 88, inStock: true, imageUrl: img(2), tags: ["trending"] },
  { id: "MK-1003", productName: "Linen Camp Shirt", manufacturer: "Sundial Brands", category: "Tops", description: "Garment-washed linen, oversized fit. Ships in five colorways.", unitPrice: 18.5, moq: 60, leadTimeDays: 10, rating: 4.6, ratingCount: 211, inStock: true, imageUrl: img(3), tags: ["new"] },
  { id: "MK-1004", productName: "Heavyweight Pocket Tee", manufacturer: "Cedar Lane Goods", category: "Tops", description: "10oz cotton, reinforced collar. White-label friendly.", unitPrice: 9.25, moq: 144, leadTimeDays: 7, rating: 4.8, ratingCount: 503, inStock: true, imageUrl: img(4), tags: ["bestseller"] },
  { id: "MK-1005", productName: "Knit Polo", manufacturer: "Stitchcraft Co.", category: "Tops", description: "Merino-cotton blend, knitted-not-woven. 6 colors.", unitPrice: 24.0, moq: 48, leadTimeDays: 21, rating: 4.5, ratingCount: 67, inStock: false, imageUrl: img(5), tags: [] },
  { id: "MK-1006", productName: "Selvedge Slim Jean", manufacturer: "Ironwood Workwear", category: "Denim", description: "13oz Japanese selvedge, raw indigo. Sized waist 28-38.", unitPrice: 54.0, moq: 30, leadTimeDays: 25, rating: 4.9, ratingCount: 318, inStock: true, imageUrl: img(6), tags: ["bestseller"] },
  { id: "MK-1007", productName: "Wide-Leg Carpenter Pant", manufacturer: "Meridian Textiles", category: "Bottoms", description: "Heavy twill, utility pockets. Carryover seasonal.", unitPrice: 36.5, moq: 36, leadTimeDays: 16, rating: 4.3, ratingCount: 92, inStock: true, imageUrl: img(7), tags: ["trending"] },
  { id: "MK-1008", productName: "Pleated Trouser", manufacturer: "Loomwell Studio", category: "Bottoms", description: "Wool-poly suiting fabric, double pleat. Tailored fit.", unitPrice: 48.0, moq: 24, leadTimeDays: 22, rating: 4.6, ratingCount: 124, inStock: true, imageUrl: img(8), tags: [] },
  { id: "MK-1009", productName: "Wrap Midi Dress", manufacturer: "Atlas & Bloom", category: "Dresses", description: "Viscose-blend wrap with tie waist. Ships ready-to-merch.", unitPrice: 32.0, moq: 36, leadTimeDays: 14, rating: 4.7, ratingCount: 198, inStock: true, imageUrl: img(9), tags: ["new"] },
  { id: "MK-1010", productName: "Slip Dress", manufacturer: "Sundial Brands", category: "Dresses", description: "Bias-cut satin, adjustable straps. Three jewel tones.", unitPrice: 28.0, moq: 48, leadTimeDays: 18, rating: 4.4, ratingCount: 76, inStock: true, imageUrl: img(10), tags: [] },
  { id: "MK-1011", productName: "Performance Legging", manufacturer: "Northwind Apparel", category: "Activewear", description: "Recycled nylon, 4-way stretch. Squat-tested.", unitPrice: 22.0, moq: 60, leadTimeDays: 12, rating: 4.5, ratingCount: 412, inStock: true, imageUrl: img(11), tags: ["bestseller"] },
  { id: "MK-1012", productName: "Training Hoodie", manufacturer: "Ironwood Workwear", category: "Activewear", description: "French terry, brushed interior. Embroidery-ready.", unitPrice: 34.5, moq: 36, leadTimeDays: 14, rating: 4.6, ratingCount: 188, inStock: true, imageUrl: img(12), tags: [] },
  { id: "MK-1013", productName: "Canvas Tote", manufacturer: "Cedar Lane Goods", category: "Accessories", description: "20oz duck canvas, leather handles. Customization included.", unitPrice: 12.5, moq: 100, leadTimeDays: 9, rating: 4.8, ratingCount: 622, inStock: true, imageUrl: img(13), tags: ["bestseller"] },
  { id: "MK-1014", productName: "Wide-Brim Felt Hat", manufacturer: "Loomwell Studio", category: "Accessories", description: "Wool felt, grosgrain band. Two crowns available.", unitPrice: 26.0, moq: 24, leadTimeDays: 28, rating: 4.5, ratingCount: 51, inStock: false, imageUrl: img(14), tags: [] },
  { id: "MK-1015", productName: "Leather Belt", manufacturer: "Stitchcraft Co.", category: "Accessories", description: "Full-grain veg-tanned leather, brass buckle.", unitPrice: 14.0, moq: 60, leadTimeDays: 11, rating: 4.7, ratingCount: 245, inStock: true, imageUrl: img(15), tags: [] },
  { id: "MK-1016", productName: "Knit Beanie", manufacturer: "Meridian Textiles", category: "Accessories", description: "100% merino, double-cuff. Six neutrals + two brights.", unitPrice: 8.5, moq: 96, leadTimeDays: 8, rating: 4.6, ratingCount: 333, inStock: true, imageUrl: img(16), tags: ["new"] },
  { id: "MK-1017", productName: "Court Sneaker", manufacturer: "Sundial Brands", category: "Footwear", description: "Full-grain leather upper, vulcanized sole.", unitPrice: 38.0, moq: 24, leadTimeDays: 30, rating: 4.4, ratingCount: 112, inStock: true, imageUrl: img(17), tags: [] },
  { id: "MK-1018", productName: "Chunky Loafer", manufacturer: "Atlas & Bloom", category: "Footwear", description: "Penny strap, lugged sole. Sizing 5-12 W/M.", unitPrice: 52.0, moq: 18, leadTimeDays: 32, rating: 4.6, ratingCount: 89, inStock: true, imageUrl: img(18), tags: ["trending"] },
  { id: "MK-1019", productName: "Cropped Tank", manufacturer: "Northwind Apparel", category: "Tops", description: "Ribbed cotton, bound neckline. Ships in 8 colors.", unitPrice: 7.5, moq: 144, leadTimeDays: 10, rating: 4.5, ratingCount: 287, inStock: true, imageUrl: img(19), tags: ["bestseller"] },
  { id: "MK-1020", productName: "Trucker Jacket", manufacturer: "Ironwood Workwear", category: "Denim", description: "Rigid 12oz denim, cone mills. Made-to-order sizing.", unitPrice: 46.0, moq: 36, leadTimeDays: 22, rating: 4.7, ratingCount: 165, inStock: true, imageUrl: img(20), tags: [] },
  { id: "MK-1021", productName: "Pleated Mini Skirt", manufacturer: "Loomwell Studio", category: "Bottoms", description: "Crepe-back satin, knife pleats. Ships hemmed.", unitPrice: 21.0, moq: 48, leadTimeDays: 17, rating: 4.4, ratingCount: 73, inStock: true, imageUrl: img(21), tags: ["trending"] },
  { id: "MK-1022", productName: "Quarter-Zip Pullover", manufacturer: "Cedar Lane Goods", category: "Tops", description: "Fleece-lined poly, half-zip placket. White label.", unitPrice: 28.5, moq: 60, leadTimeDays: 13, rating: 4.6, ratingCount: 198, inStock: true, imageUrl: img(22), tags: [] },
  { id: "MK-1023", productName: "Maxi Sundress", manufacturer: "Sundial Brands", category: "Dresses", description: "Lawn cotton, smocked bodice. Floral prints.", unitPrice: 34.0, moq: 36, leadTimeDays: 16, rating: 4.5, ratingCount: 142, inStock: true, imageUrl: img(23), tags: ["new"] },
  { id: "MK-1024", productName: "Boyfriend Blazer", manufacturer: "Meridian Textiles", category: "Outerwear", description: "Stretch suiting, single-button. Inclusive sizing.", unitPrice: 64.0, moq: 24, leadTimeDays: 24, rating: 4.6, ratingCount: 96, inStock: true, imageUrl: img(24), tags: [] },
  { id: "MK-1025", productName: "Joggers", manufacturer: "Northwind Apparel", category: "Activewear", description: "Mid-weight terry, taper leg. Drawcord ankle.", unitPrice: 26.0, moq: 60, leadTimeDays: 12, rating: 4.5, ratingCount: 256, inStock: true, imageUrl: img(25), tags: ["bestseller"] },
  { id: "MK-1026", productName: "Suede Crossbody", manufacturer: "Stitchcraft Co.", category: "Accessories", description: "Italian suede, magnetic closure. Adjustable strap.", unitPrice: 32.0, moq: 36, leadTimeDays: 20, rating: 4.7, ratingCount: 134, inStock: true, imageUrl: img(26), tags: [] },
  { id: "MK-1027", productName: "Wool Topcoat", manufacturer: "Atlas & Bloom", category: "Outerwear", description: "Italian wool melton, single-breasted. Pre-book Q3.", unitPrice: 138.0, moq: 12, leadTimeDays: 45, rating: 4.8, ratingCount: 58, inStock: false, imageUrl: img(27), tags: [] },
  { id: "MK-1028", productName: "Boxy Crop Tee", manufacturer: "Cedar Lane Goods", category: "Tops", description: "Heavy cotton jersey, raw hem. White-label friendly.", unitPrice: 11.0, moq: 96, leadTimeDays: 9, rating: 4.6, ratingCount: 187, inStock: true, imageUrl: img(28), tags: ["trending"] },
  { id: "MK-1029", productName: "Cargo Short", manufacturer: "Ironwood Workwear", category: "Bottoms", description: "Ripstop cotton, six-pocket utility. Modern fit.", unitPrice: 24.0, moq: 48, leadTimeDays: 14, rating: 4.4, ratingCount: 102, inStock: true, imageUrl: img(29), tags: [] },
  { id: "MK-1030", productName: "Strappy Sandal", manufacturer: "Sundial Brands", category: "Footwear", description: "Italian leather, block heel. Sizes 5-11.", unitPrice: 42.0, moq: 18, leadTimeDays: 28, rating: 4.5, ratingCount: 67, inStock: true, imageUrl: img(30), tags: ["new"] },
];

export const marketplaceItems: MarketplaceItem[] = baseMarketplaceItems.map(
  (item, idx) => enrich(item, idx)
);
