export interface ChatResponse {
  keywords: string[];
  response: string;
}

export const suggestedPrompts = [
  "What's the forecast for the Alpine Jacket this season?",
  "Should I reorder the denim collection?",
  "Which SKUs are at risk of stockout?",
  "How is the activewear category performing?",
];

export const chatResponses: ChatResponse[] = [
  {
    keywords: ["forecast", "demand", "predict", "projection", "outlook"],
    response:
      "Looking at the overall demand forecast for Q2 2026, we're seeing a strong upward trajectory across most categories. Total projected demand is up 18% compared to the same period last year, driven primarily by the spring transition in Tops and Dresses. The Linen Blend Camp Shirt (SKU-2003) and Wrap Sundress (SKU-5003) are leading the charge with pre-season indicators suggesting demand well above initial forecasts.\n\nOn the other hand, winter-weight items like the Merino Wool Overcoat (SKU-1003) and Ribbed Turtleneck (SKU-2006) are entering their seasonal decline. I'd recommend shifting focus to spring and summer inventory allocation. The AI model is showing 85% confidence in these projections based on historical sell-through patterns, current order velocity, and external trend signals from social media engagement data.",
  },
  {
    keywords: ["alpine", "puffer", "jacket", "outerwear", "coat", "windbreaker"],
    response:
      "The Alpine Puffer Jacket (SKU-1001, SKU-1002) has been one of your strongest performers this past season, with the Black colorway outselling Navy by roughly 1.8x. Current inventory sits at about 18 units for the Black/L variant, which at current sell-through gives you roughly 3 days of supply. There is a submitted PO (PO-2026-009) that includes Lightweight Windbreakers but you may want to consider an additional order specifically for the Alpine Puffer to cover any gap.\n\nLooking forward, outerwear as a category typically sees a 60% demand drop between April and June, but the Lightweight Windbreaker (SKU-1005, SKU-1006) is bucking that trend as a transitional piece. The windbreaker is forecasted to see a 35% demand increase through May as customers look for lighter layering options. I'd prioritize the windbreaker allocation and consider marking down remaining heavy puffer inventory to free up warehouse capacity for spring goods.",
  },
  {
    keywords: ["denim", "jean", "jeans", "trucker", "wide leg", "slim"],
    response:
      "The denim category is showing really interesting dynamics right now. Your Slim Straight Denim (SKU-3001, SKU-3002) remains the volume leader with consistent demand across all channels, but the Indigo/32 variant is down to just 28 units with about 3 days of supply remaining. There is a draft PO (PO-2026-012) ready for submission that covers this gap. I would recommend finalizing and submitting it promptly given Pacific Stitch Works' 8-day lead time.\n\nThe bigger story is the Denim Trucker Jacket (SKU-3008) which has seen a demand spike driven by social media trends. It currently has only 4 days of supply and is flagged as a high-urgency reorder. The High-Rise Wide Leg Jean (SKU-3003) is also trending upward as the wide-leg silhouette continues gaining market share. Overall, denim represents about 22% of your total revenue and the category health looks strong heading into spring, though you need to act on those low-stock items quickly.",
  },
  {
    keywords: ["activewear", "athletic", "performance", "legging", "training", "yoga", "gym", "fitness"],
    response:
      "Activewear is your fastest-growing category right now, up 28% year-over-year. The Performance Legging (SKU-4001, SKU-4002) continues to be the anchor SKU with combined demand of nearly 700 units over the next 30 days. The Black/S variant has about 6 days of supply while Navy/M is more critical at just 5 days. There is a submitted PO (PO-2026-010) covering both the Yoga Flow Pant and Performance Legging, with an expected delivery of April 15th.\n\nThe Dry-Fit Training Tee (SKU-4003) and Compression Short (SKU-4004) are also showing elevated demand as gym season ramps up. Summit Athletic Supply has been reliable with a 7-day lead time, which gives you some flexibility, but I would keep the reorder cadence tight given the velocity. The Yoga Flow Pant (SKU-4006) is an emerging winner with studio partnerships driving incremental demand above what the model initially predicted. Consider increasing your forward buy on that SKU by 15-20% above the current recommendation.",
  },
  {
    keywords: ["stockout", "out of stock", "risk", "critical", "low stock", "running out"],
    response:
      "I have identified several SKUs at immediate stockout risk that need your attention. The most critical are the Floral Midi Dress in Rose (SKU-5001) with just 1 day of supply remaining, the Chelsea Ankle Boot in Tan (SKU-6001) at under 2 days, and the Alpine Puffer Jacket in Black/L at 3 days. The Platform Sneaker in White (SKU-6003) is also concerning because its previous purchase order (PO-2026-013) was cancelled, meaning there is no replenishment in the pipeline.\n\nBeyond the immediate crisis items, there are several SKUs in the 3-to-5-day supply range including the Slim Straight Denim Indigo/32 (SKU-3001), the Denim Trucker Jacket (SKU-3008), and the Oversized Graphic Tee White (SKU-2007) which is burning through stock at 3x normal rate due to social media exposure. I would recommend prioritizing purchase orders for these items today. For the items with existing submitted POs, check if expedited shipping is available to close the gap.",
  },
  {
    keywords: ["seasonal", "season", "spring", "summer", "transition", "weather", "warm"],
    response:
      "The spring-summer transition is the defining theme of your inventory strategy right now. We are seeing clear acceleration in warm-weather categories. The Linen Blend Camp Shirt (SKU-2003), Wrap Sundress (SKU-5003), Cotton Maxi Dress (SKU-5005), and Oversized Graphic Tee (SKU-2007) are all trending upward and should be your focus for the next 60 days. PO-2026-006 from Coastal Cotton Mills is in transit with camp shirts and sundresses expected around April 10th, which should help.\n\nOn the flip side, winter-weight items need attention for a different reason. The Merino Wool Overcoat (SKU-1003) and Ribbed Turtleneck (SKU-2006) are seeing demand drop to about 30% of their winter peak. I would recommend rebalancing overcoat inventory from the West Coast Hub to the Northern Depot where cold-weather demand persists longer. The system has already flagged this as rebalancing suggestion RB-011. Clearing winter goods from southern and western warehouses will free capacity for the incoming spring shipments.",
  },
  {
    keywords: ["supplier", "lead time", "delivery", "shipping", "vendor", "supply chain"],
    response:
      "Your supplier lead times range from 5 days with Urban Thread Group up to 14 days with Milano Fabric Co. and Nordic Wool Collective. For the current critical stockout situations, the fastest path to replenishment is through Urban Thread Group (SUP-008) at 5 days and Coastal Cotton Mills (SUP-007) at 6 days. Summit Athletic Supply (SUP-004) at 7 days is also relatively quick for activewear needs.\n\nThe longer lead times from Milano Fabric Co. (SUP-002) and Nordic Wool Collective (SUP-006) mean you need to plan further ahead for dresses and premium knitwear. Currently, PO-2026-007 from Nordic Wool is in transit with Merino Wool Overcoats and Cashmere V-Neck Sweaters expected April 12th. For Milano, the draft PO-2026-011 covering Floral Midi Dresses, Silk Scarves, and Woven Belts should be submitted immediately given the 14-day lead time and the critical stock level on the Floral Midi Dress. Every day of delay adds risk of a full stockout on that top-selling dress.",
  },
  {
    keywords: ["reorder", "replenish", "order", "buy", "purchase", "when", "timing"],
    response:
      "Based on current stock levels and demand velocity, I have 10 high-urgency reorder recommendations that should be actioned this week. The most time-sensitive are the Floral Midi Dress Rose/M (1 day of supply), Chelsea Ankle Boot Tan/8 (under 2 days), Slim Straight Denim Indigo/32 (3 days), and the Oversized Graphic Tee White/M (3 days). For each of these, I have calculated the recommended order quantities factoring in supplier MOQs, lead times, and projected demand through the next 30 days.\n\nYou currently have two draft POs ready for review. PO-2026-011 from Milano Fabric Co. covers the Floral Midi Dress along with accessories, and PO-2026-012 from Pacific Stitch Works covers denim needs. I recommend submitting both today. For the activewear gaps, PO-2026-010 is already submitted to Summit Athletic Supply with arrival expected April 15th, which should cover the Yoga Flow Pant and Performance Legging needs. The main gap in your PO pipeline is footwear from Artisan Leather Goods, where you need to create a new order for Chelsea Ankle Boots and Platform Sneakers.",
  },
  {
    keywords: ["category", "performance", "overview", "summary", "dashboard", "overall", "how are we"],
    response:
      "Here is a snapshot across your main categories. Activewear is your strongest performer at 28% year-over-year growth, driven by Performance Leggings and Dry-Fit Training Tees. Denim holds steady as your largest revenue category at 22% of sales, with Slim Straight and Wide Leg silhouettes leading. Dresses are the breakout story for spring, with the Floral Midi Dress and Wrap Sundress both exceeding initial forecasts by over 40%.\n\nTops represent your highest volume category by unit count, with the Oversized Graphic Tee seeing exceptional demand from social media exposure. Outerwear is transitioning predictably, with heavy coats declining and lightweight pieces like the Windbreaker picking up. Footwear is a concern area because the cancelled PO for Platform Sneakers has left a gap. Accessories remain steady with good attachment rates when merchandised alongside spring dresses. Overall inventory health is moderate, with 10 SKUs flagged as high urgency for reorder and 12 rebalancing opportunities identified across your four warehouses.",
  },
  {
    keywords: ["optimize", "optimization", "efficiency", "improve", "reduce", "waste", "cost"],
    response:
      "There are several optimization opportunities I see in your current inventory setup. First, warehouse rebalancing could save significant costs. You have 12 active rebalancing suggestions that would redistribute about 1,850 total units across your network. The biggest win is moving Alpine Puffer Jacket inventory from East DC to the West Coast Hub where demand is 2.5x higher, avoiding potential markdowns at the overstocked location while preventing stockouts at the understocked one.\n\nSecond, order consolidation could reduce shipping costs. You have items from Coastal Cotton Mills split across two POs when they could potentially be combined. Similarly, the draft PO for Milano Fabric Co. could be expanded to include the Floral Midi Dress Lavender variant (SKU-5002) which is also approaching reorder point. Third, the Merino Wool Overcoat and Ribbed Turtleneck are heading into off-season territory. Consider reducing forward buys on these items by 30-40% and reallocating that budget toward the spring heroes like the Wrap Sundress and Cotton Maxi Dress where demand is outpacing supply.",
  },
  {
    keywords: ["size", "variant", "sizing", "color", "colorway", "assortment", "mix"],
    response:
      "Analyzing your size and variant performance reveals some clear patterns. In denim, the size 32 consistently outsells other sizes by 35-40%, which is why the Slim Straight Denim in Indigo/32 is your fastest-moving denim SKU. I would recommend shifting your size curve to allocate more heavily toward 30-34 range and reducing 26 and 38 buys by about 15% each.\n\nFor color trends, black remains the dominant colorway across activewear with the Performance Legging Black outselling Navy by nearly 2x. In dresses, however, the story is more nuanced. The Floral Midi Dress Rose outsells Lavender but the gap is closing, and the Wrap Sundress in Terracotta is proving to be a standout color for spring. For outerwear, the Alpine Puffer Jacket Black/L is your top seller while the Navy/M has more moderate but consistent demand. I would suggest maintaining both colorways but increasing the Black allocation by 20% for the next buy cycle.",
  },
  {
    keywords: ["accessories", "accessory", "bag", "scarf", "belt", "crossbody"],
    response:
      "Accessories represent a smaller portion of total revenue but play an important strategic role in your mix. The Leather Crossbody Bag (SKU-7001) in Cognac has been your top accessory performer, with particularly strong sales when merchandised alongside spring dresses in both online and in-store displays. Current stock is at 12 units with a high-urgency reorder recommendation for 60 units through Artisan Leather Goods.\n\nThe Silk Scarf (SKU-7002) in Floral Print is showing interesting momentum with 8 days of supply remaining and demand projected at 120 units over the next month. The Woven Belt (SKU-7003) has a climbing attach rate with spring bottoms, making it a smart item to stock deeper as cargo pants and chinos gain traction. Milano Fabric Co. handles both the Silk Scarf and Woven Belt, so the draft PO-2026-011 which includes both items should be prioritized. The accessory attachment rate overall is running at 23% which is above the 18% industry average, suggesting your merchandising strategy is working well.",
  },
  {
    keywords: ["footwear", "shoe", "shoes", "boot", "boots", "sneaker", "sneakers"],
    response:
      "Footwear needs immediate attention. The Chelsea Ankle Boot in Tan/8 (SKU-6001) is your best-selling footwear item and is down to just 5 units, representing under 2 days of supply. The Black/9 variant (SKU-6002) is in better shape at 38 units and about 13 days of supply, but should still be on the reorder radar. Both come from Artisan Leather Goods which has a 12-day lead time, so any order placed today would not arrive until late April.\n\nThe Platform Sneaker situation is more concerning. The previous PO (PO-2026-013) was cancelled back in February, and current stock for the White/7 variant (SKU-6003) is at just 15 units. This is a trending silhouette with 110 units of projected 30-day demand. You need to create a new purchase order for Artisan Leather Goods covering both the Chelsea Ankle Boot replenishment and the Platform Sneaker gap. Given the supplier MOQ of 50 units, even a minimum order would make a meaningful difference. I would recommend ordering 100 Chelsea Boots across both variants and 80 Platform Sneakers to stabilize the footwear category.",
  },
  {
    keywords: ["budget", "cost", "spend", "spending", "money", "expense", "margin", "profit"],
    response:
      "Your current open purchase order pipeline totals approximately $174,780 across all submitted and in-transit POs. The two draft POs awaiting approval would add another $39,320 if submitted. The total reorder recommendations, if all were actioned today, would represent roughly $185,000 in additional procurement spend. However, I would prioritize the 10 high-urgency items first, which represent about $95,000 in spend and cover the most critical stockout risks.\n\nFrom a unit cost perspective, your most capital-intensive items are the Merino Wool Overcoat at $72.00 per unit and the Chelsea Ankle Boot at $55.00. On the other end, the Dry-Fit Training Tee at $9.50 and Oversized Graphic Tee at $10.50 offer the best volume-to-cost ratio. For margin optimization, I would note that the items with the strongest sell-through right now, particularly the Floral Midi Dress, Wrap Sundress, and Denim Trucker Jacket, likely support full-price selling, making their reorder spend highly productive. Conversely, any incremental spend on winter outerwear at this point carries markdown risk.",
  },
  {
    keywords: [],
    response:
      "I can help you with a wide range of inventory and forecasting questions. Based on your current data, here are some key highlights worth noting. You have 10 SKUs flagged as high urgency for reorder, with the Floral Midi Dress Rose/M and Chelsea Ankle Boot Tan/8 being the most critical at 1-2 days of supply remaining. Your activewear category is showing the strongest growth at 28% year over year, while denim remains your largest revenue contributor.\n\nThere are also 12 rebalancing opportunities across your four warehouses that could improve stock availability without additional purchasing. The spring-summer transition is well underway, and items like the Linen Blend Camp Shirt, Wrap Sundress, and Oversized Graphic Tee are seeing accelerating demand. You have $174,780 in open POs with deliveries expected between now and mid-April. Could you tell me more specifically what area you would like to explore? I can dive deeper into any category, specific SKU, supplier performance, warehouse utilization, or demand forecasting.",
  },
];
