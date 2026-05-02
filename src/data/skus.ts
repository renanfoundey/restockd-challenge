import { SKU } from "@/lib/types";

function computeStatus(daysOfSupply: number): SKU["status"] {
  if (daysOfSupply === 0) return "Out of Stock";
  if (daysOfSupply <= 4) return "Critical";
  if (daysOfSupply <= 14) return "Low Stock";
  return "In Stock";
}

// Product images stored locally in /public/images/products/
const PRODUCT_IMAGE_COUNT = 30;

function sku(
  id: string,
  productName: string,
  variant: string,
  category: string,
  currentStock: number,
  avgDailySales: number,
  unitCost: number,
  leadTimeDays: number,
  supplierId: string,
  supplierName: string,
  imageIndex: number
): SKU {
  const daysOfSupply =
    avgDailySales === 0 ? 0 : Math.floor(currentStock / avgDailySales);
  return {
    id,
    productName,
    variant,
    category,
    currentStock,
    avgDailySales,
    daysOfSupply,
    reorderPoint: Math.round(avgDailySales * leadTimeDays * 1.5),
    status: computeStatus(daysOfSupply),
    supplierId,
    supplierName,
    unitCost,
    leadTimeDays,
    imageUrl: `/images/products/product-${String(((imageIndex - 1) % PRODUCT_IMAGE_COUNT) + 1).padStart(2, "0")}.jpg`,
  };
}

const baseSkus: SKU[] = [
  // ─── Outerwear (15 SKUs) ──────────────────────────────────────────
  sku("AJ-BLK-M", "Alpine Jacket", "Black / M", "Outerwear", 340, 18, 89.0, 10, "SUP-001", "Eastway Textiles", 1),
  sku("AJ-BLK-L", "Alpine Jacket", "Black / L", "Outerwear", 290, 22, 89.0, 10, "SUP-001", "Eastway Textiles", 2),
  sku("AJ-NVY-M", "Alpine Jacket", "Navy / M", "Outerwear", 180, 15, 89.0, 10, "SUP-001", "Eastway Textiles", 3),
  sku("AJ-NVY-L", "Alpine Jacket", "Navy / L", "Outerwear", 55, 14, 89.0, 10, "SUP-006", "Nordic Wool Collective", 4),
  sku("QP-OLV-S", "Quilted Puffer Vest", "Olive / S", "Outerwear", 420, 12, 72.0, 8, "SUP-006", "Nordic Wool Collective", 5),
  sku("QP-OLV-M", "Quilted Puffer Vest", "Olive / M", "Outerwear", 510, 25, 72.0, 8, "SUP-006", "Nordic Wool Collective", 6),
  sku("QP-BLK-L", "Quilted Puffer Vest", "Black / L", "Outerwear", 30, 10, 72.0, 8, "SUP-001", "Eastway Textiles", 7),
  sku("WB-CME-S", "Wool Blend Overcoat", "Camel / S", "Outerwear", 95, 8, 165.0, 14, "SUP-006", "Nordic Wool Collective", 8),
  sku("WB-CME-M", "Wool Blend Overcoat", "Camel / M", "Outerwear", 120, 10, 165.0, 14, "SUP-006", "Nordic Wool Collective", 9),
  sku("WB-CHR-L", "Wool Blend Overcoat", "Charcoal / L", "Outerwear", 0, 7, 165.0, 14, "SUP-006", "Nordic Wool Collective", 10),
  sku("RN-BLK-M", "Rain Shell Anorak", "Black / M", "Outerwear", 600, 20, 58.0, 7, "SUP-001", "Eastway Textiles", 11),
  sku("RN-BLK-L", "Rain Shell Anorak", "Black / L", "Outerwear", 480, 18, 58.0, 7, "SUP-001", "Eastway Textiles", 12),
  sku("RN-SLT-S", "Rain Shell Anorak", "Slate / S", "Outerwear", 15, 5, 58.0, 7, "SUP-001", "Eastway Textiles", 13),
  sku("LB-TAN-M", "Linen Blazer", "Tan / M", "Outerwear", 200, 9, 120.0, 12, "SUP-006", "Nordic Wool Collective", 14),
  sku("LB-NVY-L", "Linen Blazer", "Navy / L", "Outerwear", 75, 11, 120.0, 12, "SUP-006", "Nordic Wool Collective", 15),

  // ─── Tops (15 SKUs) ───────────────────────────────────────────────
  sku("MC-WHT-S", "Merino Crew Sweater", "White / S", "Tops", 850, 35, 48.0, 7, "SUP-006", "Nordic Wool Collective", 16),
  sku("MC-WHT-M", "Merino Crew Sweater", "White / M", "Tops", 1020, 42, 48.0, 7, "SUP-006", "Nordic Wool Collective", 17),
  sku("MC-NVY-L", "Merino Crew Sweater", "Navy / L", "Tops", 60, 20, 48.0, 7, "SUP-006", "Nordic Wool Collective", 18),
  sku("OB-WHT-S", "Oxford Button-Down", "White / S", "Tops", 380, 18, 42.0, 6, "SUP-001", "Eastway Textiles", 19),
  sku("OB-WHT-M", "Oxford Button-Down", "White / M", "Tops", 520, 30, 42.0, 6, "SUP-001", "Eastway Textiles", 20),
  sku("OB-LBL-L", "Oxford Button-Down", "Light Blue / L", "Tops", 44, 12, 42.0, 6, "SUP-001", "Eastway Textiles", 21),
  sku("BP-STR-M", "Breton Stripe Tee", "Stripe / M", "Tops", 1400, 55, 28.0, 5, "SUP-007", "Coastal Cotton Mills", 22),
  sku("BP-STR-L", "Breton Stripe Tee", "Stripe / L", "Tops", 900, 50, 28.0, 5, "SUP-007", "Coastal Cotton Mills", 23),
  sku("HN-GRY-S", "Henley Long Sleeve", "Grey / S", "Tops", 0, 8, 34.0, 6, "SUP-007", "Coastal Cotton Mills", 24),
  sku("HN-GRY-M", "Henley Long Sleeve", "Grey / M", "Tops", 150, 14, 34.0, 6, "SUP-007", "Coastal Cotton Mills", 25),
  sku("HN-BRG-L", "Henley Long Sleeve", "Burgundy / L", "Tops", 18, 6, 34.0, 6, "SUP-007", "Coastal Cotton Mills", 26),
  sku("FL-GRN-M", "Flannel Camp Shirt", "Forest Green / M", "Tops", 260, 10, 52.0, 8, "SUP-001", "Eastway Textiles", 27),
  sku("FL-GRN-L", "Flannel Camp Shirt", "Forest Green / L", "Tops", 210, 9, 52.0, 8, "SUP-001", "Eastway Textiles", 28),
  sku("CT-BLK-S", "Cotton Polo", "Black / S", "Tops", 700, 38, 32.0, 5, "SUP-007", "Coastal Cotton Mills", 29),
  sku("CT-BLK-M", "Cotton Polo", "Black / M", "Tops", 30, 25, 32.0, 5, "SUP-007", "Coastal Cotton Mills", 30),

  // ─── Bottoms (15 SKUs) ────────────────────────────────────────────
  sku("SC-KHK-30", "Slim Chinos", "Khaki / 30", "Bottoms", 680, 28, 45.0, 7, "SUP-003", "Pacific Stitch Works", 31),
  sku("SC-KHK-32", "Slim Chinos", "Khaki / 32", "Bottoms", 820, 35, 45.0, 7, "SUP-003", "Pacific Stitch Works", 32),
  sku("SC-NVY-34", "Slim Chinos", "Navy / 34", "Bottoms", 40, 15, 45.0, 7, "SUP-003", "Pacific Stitch Works", 33),
  sku("PL-BLK-S", "Pleated Trousers", "Black / S", "Bottoms", 310, 12, 62.0, 9, "SUP-008", "Urban Thread Group", 34),
  sku("PL-BLK-M", "Pleated Trousers", "Black / M", "Bottoms", 420, 16, 62.0, 9, "SUP-008", "Urban Thread Group", 35),
  sku("PL-CHR-L", "Pleated Trousers", "Charcoal / L", "Bottoms", 8, 4, 62.0, 9, "SUP-008", "Urban Thread Group", 36),
  sku("CG-OLV-M", "Cargo Joggers", "Olive / M", "Bottoms", 550, 22, 38.0, 6, "SUP-008", "Urban Thread Group", 37),
  sku("CG-OLV-L", "Cargo Joggers", "Olive / L", "Bottoms", 480, 20, 38.0, 6, "SUP-008", "Urban Thread Group", 38),
  sku("CG-BLK-S", "Cargo Joggers", "Black / S", "Bottoms", 0, 18, 38.0, 6, "SUP-003", "Pacific Stitch Works", 39),
  sku("LN-WHT-30", "Linen Drawstring Pants", "White / 30", "Bottoms", 230, 10, 50.0, 8, "SUP-003", "Pacific Stitch Works", 40),
  sku("LN-WHT-32", "Linen Drawstring Pants", "White / 32", "Bottoms", 190, 11, 50.0, 8, "SUP-003", "Pacific Stitch Works", 41),
  sku("LN-SND-34", "Linen Drawstring Pants", "Sand / 34", "Bottoms", 65, 8, 50.0, 8, "SUP-003", "Pacific Stitch Works", 42),
  sku("CS-GRY-S", "Corduroy Straight Leg", "Grey / S", "Bottoms", 140, 7, 55.0, 9, "SUP-008", "Urban Thread Group", 43),
  sku("CS-GRY-M", "Corduroy Straight Leg", "Grey / M", "Bottoms", 370, 14, 55.0, 9, "SUP-008", "Urban Thread Group", 44),
  sku("CS-RST-L", "Corduroy Straight Leg", "Rust / L", "Bottoms", 20, 6, 55.0, 9, "SUP-008", "Urban Thread Group", 45),

  // ─── Dresses (15 SKUs) ────────────────────────────────────────────
  sku("MW-BLK-S", "Midi Wrap Dress", "Black / S", "Dresses", 440, 20, 68.0, 8, "SUP-002", "Milano Fabric Co.", 46),
  sku("MW-BLK-M", "Midi Wrap Dress", "Black / M", "Dresses", 380, 22, 68.0, 8, "SUP-002", "Milano Fabric Co.", 47),
  sku("MW-RSE-L", "Midi Wrap Dress", "Rose / L", "Dresses", 90, 15, 68.0, 8, "SUP-002", "Milano Fabric Co.", 48),
  sku("SS-FLR-S", "Slip Dress", "Floral / S", "Dresses", 260, 14, 55.0, 7, "SUP-007", "Coastal Cotton Mills", 49),
  sku("SS-FLR-M", "Slip Dress", "Floral / M", "Dresses", 320, 18, 55.0, 7, "SUP-007", "Coastal Cotton Mills", 50),
  sku("SS-IVR-L", "Slip Dress", "Ivory / L", "Dresses", 0, 10, 55.0, 7, "SUP-007", "Coastal Cotton Mills", 51),
  sku("SH-NVY-XS", "Shirt Dress", "Navy / XS", "Dresses", 175, 8, 72.0, 9, "SUP-002", "Milano Fabric Co.", 52),
  sku("SH-NVY-S", "Shirt Dress", "Navy / S", "Dresses", 210, 11, 72.0, 9, "SUP-002", "Milano Fabric Co.", 53),
  sku("SH-WHT-M", "Shirt Dress", "White / M", "Dresses", 45, 12, 72.0, 9, "SUP-002", "Milano Fabric Co.", 54),
  sku("KN-CRM-S", "Knit Sweater Dress", "Cream / S", "Dresses", 500, 16, 78.0, 10, "SUP-007", "Coastal Cotton Mills", 55),
  sku("KN-CRM-M", "Knit Sweater Dress", "Cream / M", "Dresses", 600, 24, 78.0, 10, "SUP-007", "Coastal Cotton Mills", 56),
  sku("KN-BLK-L", "Knit Sweater Dress", "Black / L", "Dresses", 10, 8, 78.0, 10, "SUP-007", "Coastal Cotton Mills", 57),
  sku("MX-DOT-S", "Maxi Tiered Dress", "Polka Dot / S", "Dresses", 130, 6, 82.0, 10, "SUP-002", "Milano Fabric Co.", 58),
  sku("MX-DOT-M", "Maxi Tiered Dress", "Polka Dot / M", "Dresses", 150, 7, 82.0, 10, "SUP-002", "Milano Fabric Co.", 59),
  sku("MX-SAG-L", "Maxi Tiered Dress", "Sage / L", "Dresses", 22, 5, 82.0, 10, "SUP-002", "Milano Fabric Co.", 60),

  // ─── Activewear (15 SKUs) ─────────────────────────────────────────
  sku("YL-BLK-S", "Yoga Leggings", "Black / S", "Activewear", 1800, 75, 36.0, 5, "SUP-004", "Summit Athletic Supply", 61),
  sku("YL-BLK-M", "Yoga Leggings", "Black / M", "Activewear", 1600, 80, 36.0, 5, "SUP-004", "Summit Athletic Supply", 62),
  sku("YL-NVY-L", "Yoga Leggings", "Navy / L", "Activewear", 50, 40, 36.0, 5, "SUP-004", "Summit Athletic Supply", 63),
  sku("PT-GRY-S", "Performance Tank", "Grey / S", "Activewear", 920, 30, 22.0, 4, "SUP-004", "Summit Athletic Supply", 64),
  sku("PT-GRY-M", "Performance Tank", "Grey / M", "Activewear", 1100, 38, 22.0, 4, "SUP-004", "Summit Athletic Supply", 65),
  sku("PT-BLK-L", "Performance Tank", "Black / L", "Activewear", 15, 12, 22.0, 4, "SUP-004", "Summit Athletic Supply", 66),
  sku("RH-BLK-M", "Running Shorts", "Black / M", "Activewear", 700, 28, 28.0, 5, "SUP-008", "Urban Thread Group", 67),
  sku("RH-BLK-L", "Running Shorts", "Black / L", "Activewear", 540, 24, 28.0, 5, "SUP-008", "Urban Thread Group", 68),
  sku("RH-TL-S", "Running Shorts", "Teal / S", "Activewear", 0, 15, 28.0, 5, "SUP-008", "Urban Thread Group", 69),
  sku("TJ-BLK-S", "Training Jacket", "Black / S", "Activewear", 300, 10, 65.0, 7, "SUP-004", "Summit Athletic Supply", 70),
  sku("TJ-BLK-M", "Training Jacket", "Black / M", "Activewear", 350, 14, 65.0, 7, "SUP-004", "Summit Athletic Supply", 71),
  sku("TJ-NVY-L", "Training Jacket", "Navy / L", "Activewear", 85, 9, 65.0, 7, "SUP-004", "Summit Athletic Supply", 72),
  sku("SB-GRY-S", "Sports Bra", "Grey / S", "Activewear", 1200, 50, 25.0, 4, "SUP-004", "Summit Athletic Supply", 73),
  sku("SB-GRY-M", "Sports Bra", "Grey / M", "Activewear", 1400, 60, 25.0, 4, "SUP-004", "Summit Athletic Supply", 74),
  sku("SB-BLK-L", "Sports Bra", "Black / L", "Activewear", 25, 20, 25.0, 4, "SUP-004", "Summit Athletic Supply", 75),

  // ─── Accessories (15 SKUs) ────────────────────────────────────────
  sku("CT-NTR-OS", "Canvas Tote", "Natural / OS", "Accessories", 950, 40, 18.0, 5, "SUP-002", "Milano Fabric Co.", 76),
  sku("CT-BLK-OS", "Canvas Tote", "Black / OS", "Accessories", 780, 35, 18.0, 5, "SUP-002", "Milano Fabric Co.", 77),
  sku("LB-BRN-OS", "Leather Belt", "Brown / OS", "Accessories", 420, 15, 32.0, 6, "SUP-005", "Artisan Leather Goods", 78),
  sku("LB-BLK-OS", "Leather Belt", "Black / OS", "Accessories", 500, 18, 32.0, 6, "SUP-005", "Artisan Leather Goods", 79),
  sku("WS-NVY-OS", "Wool Scarf", "Navy / OS", "Accessories", 310, 12, 28.0, 7, "SUP-002", "Milano Fabric Co.", 80),
  sku("WS-GRY-OS", "Wool Scarf", "Grey / OS", "Accessories", 45, 10, 28.0, 7, "SUP-002", "Milano Fabric Co.", 81),
  sku("WS-BRG-OS", "Wool Scarf", "Burgundy / OS", "Accessories", 0, 6, 28.0, 7, "SUP-002", "Milano Fabric Co.", 82),
  sku("BC-TAN-OS", "Baseball Cap", "Tan / OS", "Accessories", 1100, 45, 14.0, 4, "SUP-002", "Milano Fabric Co.", 83),
  sku("BC-BLK-OS", "Baseball Cap", "Black / OS", "Accessories", 1300, 55, 14.0, 4, "SUP-002", "Milano Fabric Co.", 84),
  sku("LW-BRN-OS", "Leather Wallet", "Brown / OS", "Accessories", 260, 8, 45.0, 8, "SUP-005", "Artisan Leather Goods", 85),
  sku("LW-BLK-OS", "Leather Wallet", "Black / OS", "Accessories", 300, 10, 45.0, 8, "SUP-005", "Artisan Leather Goods", 86),
  sku("SS-BLK-OS", "Sunglasses", "Black / OS", "Accessories", 15, 4, 38.0, 6, "SUP-005", "Artisan Leather Goods", 87),
  sku("SS-TRT-OS", "Sunglasses", "Tortoise / OS", "Accessories", 180, 7, 38.0, 6, "SUP-005", "Artisan Leather Goods", 88),
  sku("CW-SLV-OS", "Classic Watch", "Silver / OS", "Accessories", 75, 3, 120.0, 12, "SUP-005", "Artisan Leather Goods", 89),
  sku("CW-GLD-OS", "Classic Watch", "Gold / OS", "Accessories", 60, 2, 120.0, 12, "SUP-005", "Artisan Leather Goods", 90),

  // ─── Footwear (15 SKUs) ───────────────────────────────────────────
  sku("TR-BLK-9", "Trail Runner Sneaker", "Black / 9", "Footwear", 340, 14, 95.0, 10, "SUP-005", "Artisan Leather Goods", 91),
  sku("TR-BLK-10", "Trail Runner Sneaker", "Black / 10", "Footwear", 400, 18, 95.0, 10, "SUP-005", "Artisan Leather Goods", 92),
  sku("TR-WHT-11", "Trail Runner Sneaker", "White / 11", "Footwear", 50, 12, 95.0, 10, "SUP-005", "Artisan Leather Goods", 93),
  sku("CL-BRN-9", "Chelsea Boot", "Brown / 9", "Footwear", 220, 8, 145.0, 12, "SUP-005", "Artisan Leather Goods", 94),
  sku("CL-BRN-10", "Chelsea Boot", "Brown / 10", "Footwear", 280, 10, 145.0, 12, "SUP-005", "Artisan Leather Goods", 95),
  sku("CL-BLK-11", "Chelsea Boot", "Black / 11", "Footwear", 0, 6, 145.0, 12, "SUP-005", "Artisan Leather Goods", 96),
  sku("WL-WHT-8", "White Leather Sneaker", "White / 8", "Footwear", 560, 22, 78.0, 8, "SUP-005", "Artisan Leather Goods", 97),
  sku("WL-WHT-9", "White Leather Sneaker", "White / 9", "Footwear", 620, 28, 78.0, 8, "SUP-005", "Artisan Leather Goods", 98),
  sku("WL-WHT-10", "White Leather Sneaker", "White / 10", "Footwear", 30, 20, 78.0, 8, "SUP-005", "Artisan Leather Goods", 99),
  sku("ES-TAN-8", "Espadrille Slide", "Tan / 8", "Footwear", 480, 15, 42.0, 6, "SUP-005", "Artisan Leather Goods", 100),
  sku("ES-TAN-9", "Espadrille Slide", "Tan / 9", "Footwear", 520, 17, 42.0, 6, "SUP-005", "Artisan Leather Goods", 101),
  sku("ES-NVY-10", "Espadrille Slide", "Navy / 10", "Footwear", 10, 8, 42.0, 6, "SUP-005", "Artisan Leather Goods", 102),
  sku("LF-BLK-9", "Suede Loafer", "Black / 9", "Footwear", 190, 6, 110.0, 10, "SUP-005", "Artisan Leather Goods", 103),
  sku("LF-BRN-10", "Suede Loafer", "Brown / 10", "Footwear", 170, 5, 110.0, 10, "SUP-005", "Artisan Leather Goods", 104),
  sku("LF-NVY-11", "Suede Loafer", "Navy / 11", "Footwear", 100, 4, 110.0, 10, "SUP-005", "Artisan Leather Goods", 105),

  // ─── Denim (15 SKUs) ──────────────────────────────────────────────
  sku("HR-IND-26", "High-Rise Straight Jean", "Indigo / 26", "Denim", 580, 20, 68.0, 8, "SUP-003", "Pacific Stitch Works", 106),
  sku("HR-IND-28", "High-Rise Straight Jean", "Indigo / 28", "Denim", 720, 28, 68.0, 8, "SUP-003", "Pacific Stitch Works", 107),
  sku("HR-BLK-30", "High-Rise Straight Jean", "Black / 30", "Denim", 35, 18, 68.0, 8, "SUP-003", "Pacific Stitch Works", 108),
  sku("SF-MDW-28", "Slim Fit Jean", "Medium Wash / 28", "Denim", 490, 22, 58.0, 7, "SUP-003", "Pacific Stitch Works", 109),
  sku("SF-MDW-30", "Slim Fit Jean", "Medium Wash / 30", "Denim", 640, 30, 58.0, 7, "SUP-003", "Pacific Stitch Works", 110),
  sku("SF-DKW-32", "Slim Fit Jean", "Dark Wash / 32", "Denim", 15, 14, 58.0, 7, "SUP-008", "Urban Thread Group", 111),
  sku("RX-LTW-28", "Relaxed Boyfriend Jean", "Light Wash / 28", "Denim", 350, 16, 62.0, 8, "SUP-008", "Urban Thread Group", 112),
  sku("RX-LTW-30", "Relaxed Boyfriend Jean", "Light Wash / 30", "Denim", 400, 18, 62.0, 8, "SUP-008", "Urban Thread Group", 113),
  sku("RX-MDW-32", "Relaxed Boyfriend Jean", "Medium Wash / 32", "Denim", 0, 12, 62.0, 8, "SUP-003", "Pacific Stitch Works", 114),
  sku("WL-IND-26", "Wide Leg Crop Jean", "Indigo / 26", "Denim", 260, 10, 65.0, 9, "SUP-003", "Pacific Stitch Works", 115),
  sku("WL-IND-28", "Wide Leg Crop Jean", "Indigo / 28", "Denim", 300, 12, 65.0, 9, "SUP-003", "Pacific Stitch Works", 116),
  sku("WL-BLK-30", "Wide Leg Crop Jean", "Black / 30", "Denim", 55, 9, 65.0, 9, "SUP-003", "Pacific Stitch Works", 117),
  sku("DJ-BLU-S", "Denim Trucker Jacket", "Blue / S", "Denim", 180, 7, 75.0, 9, "SUP-008", "Urban Thread Group", 118),
  sku("DJ-BLU-M", "Denim Trucker Jacket", "Blue / M", "Denim", 240, 9, 75.0, 9, "SUP-008", "Urban Thread Group", 119),
  sku("DJ-BLK-L", "Denim Trucker Jacket", "Black / L", "Denim", 28, 8, 75.0, 9, "SUP-008", "Urban Thread Group", 120),
];

// Multiply the catalog ~4x to better reflect a realistic warehouse footprint
// (target ~480 SKUs). We vary stock and sales deterministically per copy so
// status mix stays interesting.
const COPIES = 4;
const COPY_LABELS = ["", "B", "C", "D"];

function deriveCopy(base: SKU, copyIndex: number): SKU {
  if (copyIndex === 0) return base;
  const seed = (base.id.charCodeAt(0) + copyIndex * 13) % 100;
  const stockMultiplier = 0.4 + (seed / 100) * 1.2;
  const salesMultiplier = 0.7 + ((seed * 3) % 60) / 100;
  const currentStock = Math.max(0, Math.round(base.currentStock * stockMultiplier));
  const avgDailySales = Math.max(1, Math.round(base.avgDailySales * salesMultiplier));
  const daysOfSupply =
    avgDailySales === 0 ? 0 : Math.floor(currentStock / avgDailySales);
  return {
    ...base,
    id: `${base.id}-${COPY_LABELS[copyIndex]}`,
    currentStock,
    avgDailySales,
    daysOfSupply,
    reorderPoint: Math.round(avgDailySales * base.leadTimeDays * 1.5),
    status: computeStatus(daysOfSupply),
  };
}

export const skus: SKU[] = Array.from({ length: COPIES }, (_, i) =>
  baseSkus.map((s) => deriveCopy(s, i))
).flat();
