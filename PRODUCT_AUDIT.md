# Restockd — Product Audit

**Audit date:** 2026-05-02
**Scope:** End-to-end review of the product as an inventory planning system, with operational, UX, and strategic lenses.
**Stance:** Constructively critical. The product is meaningfully strong; this document pressure-tests it for scale and long-term adoption. No new features are recommended — every suggestion below sharpens what already exists.

---

## TL;DR

Restockd has done the hardest part: it ships with a clean conceptual model (Replenishment → Reorder → Rebalance) and a marketplace that's been wired into the planning loop. The visual layer is above the bar for the category, the multi-warehouse / multi-store data model is correct, and the OTB + landed cost + supplier scorecard work in Marketplace is genuinely planner-grade.

The risks are concentrated in three places: (1) **trust in the AI** — the model is invisible, with no accuracy track record or confidence visible at decision time; (2) **operational friction at scale** — bulk actions, saved views, exception surfacing, and persistent filter state are all missing, which compounds quickly past 50 actions; (3) **the marketplace ↔ replenishment loop is half-wired** — Bought items show as on-order on the SKU chart, but the next Replenishment plan doesn't actually consume them, breaking the "no double-order" promise.

Closing those three gaps moves the product from "a really nice planning UI" to "a planning system a head of merchandise would defend at the board." None of them require a new screen.

---

## Where the product is genuinely strong

- **Conceptual clarity.** Replenishment / Reorder / Rebalance are crisply distinguished, including what each does *not* do. That clarity is rare in this category — most legacy tools blur these.
- **Many-to-many model.** Replenishment and Reorder both fan a single action across multiple warehouses + stores; Rebalance is store-to-store with no warehouse hop. The data model and UI agree end-to-end.
- **Marketplace as a planning surface.** OTB context, landed cost breakdown, forecast-fit indicator, supplier scorecard, buying window, and trend signal provenance are all present at the moment of decision. This is materially ahead of standalone B2B catalog tools.
- **"Why this was created" reasoning cards.** Every action explains itself in numbers that match the table beneath it. The profit forecast line is opinionated and defensible.
- **Status vocabulary.** The new Suggested → Ready to Send → Sent to Provider → Processing → Completed action ladder, paired with per-flow SKU lifecycles, is the right level of specificity. Inventory managers will recognize themselves in it immediately.
- **Send-to-integration with revert.** Small touch, but the Sent → Revert affordance is the kind of detail that separates "demo" from "operational tool."

---

## Inventory operations: pressure test

### Replenishment

The flow is solid. Many-to-many destinations, supplier scorecard surfaced at the supplier level, line items distributed across warehouses + stores, line statuses derived from action status with realistic per-row variance.

**Where it strains:**

1. **Bought items are on-order on the chart, but not in the next plan.** The SKU detail forecast subtracts marketplace pre-buys from the projected gap (good), but the next Replenishment plan generated for that category doesn't exclude them. A planner who buys 1,200 units of an Activewear item from Marketplace and then opens a Replenishment plan an hour later will see the same demand gap they already filled. **This is the single biggest credibility hole.** Wiring is one helper away — `getItems<BoughtRecord>` aggregated by category, subtracted from the Replenishment line item suggestion logic.
2. **No exception surfacing.** A Replenishment in "Sent to Provider" for 14 days with the supplier's stated lead time at 7d should be loud. Today it sits in the list looking identical to one that was sent yesterday.
3. **Supplier capacity is a data field but never a constraint.** `capacityRemainingUnits` exists on every marketplace item, but nothing checks it during Buy. A planner can commit to 5,000 units against a supplier with 800 units of remaining capacity. At minimum, the Buy dialog should show capacity and warn when crossing it.
4. **No rolled-up "in flight" view.** The planner can't see "across all open Replenishments, we've committed $4.2M and have 18,000 units arriving in the next 30 days." Each action is its own page; the network view is missing.

### Reorder

The Availability column is the right idea. "Ready today / In transit / In production" with source warehouse and on-hand coverage is closer to operational reality than most peers.

**Where it strains:**

1. **Coverage math is silently optimistic.** When a recommendation says "320 / 500 on hand at East DC" and the user is reordering to a single store, the implication is the planner needs to wait for the rest. The system never proposes splitting the source across multiple warehouses to cover the gap from existing stock today. Real reorder workflows look at *all* warehouses with stock, not just one source.
2. **The "Recommended" quantity doesn't account for the destination store's existing on-hand.** It's the supplier-MOQ-driven number. At reorder time, the system should be netting against the destination store's current stock to avoid over-shipping into stores that already have coverage.
3. **Urgency vs. availability are on different axes but presented side-by-side.** A "High urgency" line that's "Ready today" deserves a different visual treatment than a "High urgency" line that's "In production +18d" — today they look the same severity-wise but have radically different implications. The High urgency × needs-wait combination should escalate.

### Rebalance

The store-to-store model is honest. From/To Store labels, no warehouse references in the UI, status reflecting the operational reality (Reserved → In Transfer → Received).

**Where it strains:**

1. **Transfer cost is invisible.** Moving 200 units from Melrose to SoHo costs money — courier, packing labor, opportunity cost, sometimes inter-store accounting transfers. The Rebalance reasoning shows the move as if it were free. Real planners weigh transfer cost against the alternative (markdown at source vs. ship + sell at destination). Showing an estimated transfer cost per suggestion would change which suggestions get acted on.
2. **No source store confirmation flow.** Suggestions assume the source store has the units the system thinks it has. In practice cycle counts drift; sources sometimes can't fulfill. There's no place in the UI to record a partial fulfill.
3. **Store-to-store distance/lane patterns aren't surfaced.** A Top Drivers section by store-pair lane (e.g. "SoHo → Online accounts for 38% of all rebalance value this quarter") would tell the planner whether their network is structurally imbalanced — a higher-order signal than per-suggestion review.

### Marketplace ↔ Planning loop

The Bought-as-on-order story is the most interesting product bet in the system. It's also the most under-delivered.

**What works:** Marketplace cards show OTB-aware pricing, the Buy dialog refuses to over-commit, the Bought tab tracks lifecycle, and SKU forecasts visibly reduce the projected gap.

**What's broken:**

1. **The next Replenishment plan ignores the Bought queue.** (Already mentioned above — it deserves repeating because it's the entire thesis.)
2. **"Consider for replen" is a flag with no machinery behind it.** Toggling it on/off should change something downstream, today it doesn't.
3. **No way to see "Marketplace pre-buys by category" alongside OTB.** The OTB strip shows committed $ from Bought, but the planner can't drill in to see *which* Bought items make up that committed total.

### Forecasting preparation

The SKU detail chart is the strongest single screen in the product. 90 days actual + 30-day forecast + reorder reference + insight strip is the right composition.

**Where it strains:**

1. **No model accuracy.** The forecast line is a deterministic projection. Real planners need "the model was within ±X% over the last N forecasts." Without that, every recommendation is taken on faith and trust erodes the first time the model misses.
2. **No confidence interval.** A P10–P90 band around the forecast line would let planners distinguish low-uncertainty bets from coin flips. Today every projection looks equally confident.
3. **No per-store decomposition.** Daily sales is a single number. Allocation decisions (in Reorder and Replenishment) are uniform when they shouldn't be — SoHo and Melrose have different demographics, climate windows, and sell-through profiles.
4. **No comparison view.** "How does this season's first 30 days compare to last year's same period?" is the question merchandisers ask constantly. The chart shows current trajectory but not the YoY overlay.

### Day-to-day decisions

The product helps the planner *understand* an action well; it doesn't help them *get through* a day of actions efficiently.

- No bulk approval / bulk send across the action list.
- No saved views — "Critical SKUs in Activewear awaiting reorder" can't be pinned.
- No status grouping in the action list — Suggested actions sit interleaved with Completed ones.
- No global search (Cmd+K) to jump to a SKU, supplier, or action by id.
- Filter state doesn't persist when navigating into a detail page and back.

These are individually small, collectively enormous at the volume a real planner works through.

---

## User experience: pressure test

### Navigation & terminology

The grouped sidebar (Core / Tactical / Configure) is intuitive on first contact. The "AI Assistant" entry sets up an expectation the chat doesn't meet — it's a keyword-matched FAQ today. Either rename to something less ambitious ("Inventory Help") or accept the credibility tax.

The "Marketplace" placement under Core (next to Replenishment) is right — it's a buying surface, not a side feature. Good product instinct.

### Workflows

**Strong:**
- Creation modals (multi-select chips for warehouses + stores, category multi-select) are fast and operationally honest.
- The "Send to" → "Sent to" → "Revert" pattern is a model for how every irreversible-feeling action should work.
- Action detail pages have a consistent layout: header → metric cards → reasoning → drivers → table. Pattern recognition kicks in after one page.

**Weak:**
- No confirmations on accidental destructive actions other than the trash icon (which has confirm). Removing a Bought item, switching tabs mid-edit, etc. all silently lose state.
- No undo. The Marketplace Send → Revert is the only place this exists. Rebalance / Reorder / Replen removal should have it.
- The Reorder + Replen line item tables get heavy at 100+ rows. Pagination is there, but no inline filtering ("only show In Production / Lost / etc.").

### Terminology

The action vs. SKU status distinction (one global ladder vs. per-flow lifecycle stages) is correct but cognitively expensive. A planner sees "Sent to Provider" at the action level and "Sent to Provider" at the line level on Reorder — same words, different scope. Worth a tiny visual differentiator (action = solid pill, line = soft pill, or similar) so the eye doesn't have to re-parse.

"Lost" as a per-line status is right but currently exceptional and silent. When an action accumulates Lost lines past a threshold, the action header should reflect that — today it doesn't.

### States & visibility

Empty states are good. Loading states are missing — the dataset is small enough today that this isn't visible, but at real scale (5K+ SKUs, hundreds of actions) the lack of skeleton states will feel laggy.

The "Lifecycle timeline" on the marketplace Bought items is one shape (horizontal stepper). The per-line status badges on action detail pages are another (single pill). Both communicate position-in-lifecycle. They should probably feel related — at minimum share the same visual vocabulary so the planner doesn't have to learn two.

### Information density

The marketplace card shows: image, badges, supplier chip + on-time %, three reliability facts, forecast fit bar, trend signal pill, landed price + FOB, Buy button. That's a lot of pixels of information per card. On a 1440px-wide screen with 4 cols, each card is ~340px wide and feels well-balanced. On 1280px (a common laptop), 3 cols and the density tips into noisy.

The "Why this was created" reasoning card is a wall of running prose with embedded numbers. A planner reviewing 12 actions a day reads variations of the same paragraph 12 times. A two-line summary with a "see reasoning" disclosure would be lower friction.

### Confidence & control

The Send → Revert pattern is the best example of "you can take this action without fear." Extending the same emotional pattern to other irreversible actions would massively raise the floor.

The marketplace Buy dialog's OTB context (Available / This buy / After) is the single best example of "make the constraint visible at decision time." Replicating that pattern in Replenishment and Reorder creation flows (which today don't show OTB impact) would close the loop.

---

## Strategy & direction

### Differentiation

The bet is the **Marketplace ↔ Planning loop**. Every other table-stakes capability (forecast, reorder point, supplier dashboard, multi-warehouse) is achievable in 6 months by any well-resourced competitor. The marketplace as a *first-class planning input* — buy from anywhere, the planner's forecast immediately accounts for it — is the wedge. It maps to a real change in how brands buy: more curated, more reactive, less single-supplier-dependent. That story is differentiated.

To deliver on that wedge, the loop has to actually close: Buy → On Order → Forecast Update → Next Replenishment Excludes Already-Bought → Outcome Tracked. Today we have steps 1, 2, 3 visible and step 4, 5 absent. This is the single highest-leverage area to invest in, and importantly it's not a new feature — it's wiring.

### Positioning

"AI Forecasting" / "AI Assistant" labels set expectations the system doesn't yet meet. The chat is keyword-matched and the forecast model is invisible. Two safe paths:

1. **Tone down the AI claims** until there's accuracy data to back them. Rename "AI Assistant" to "Inventory Help" or similar.
2. **Make the AI visible.** Show forecast vs. actual residuals on the SKU chart. Show the model's stated confidence per recommendation. Show what features the model considered. Each of these is small UI work against existing surfaces.

Path 2 is the better bet because the entire competitive narrative depends on it. But it requires backing data, even if simulated convincingly for the demo.

### ICP clarity

The product is well-shaped for the **planner / merchandiser**. It speaks fluently to that role. It speaks less fluently to:

- The **CFO / finance partner** who cares about open commitments, working capital tied up in inventory, and aged-inventory exposure.
- The **ops director** who cares about exception throughput — how many actions are stuck, where, for how long.
- The **CEO / board reviewer** who wants a one-screen network view: "what's our inventory health by category, region, and lifecycle stage."

None of these need new features. They need the existing data sliced differently, at one level above the per-action detail. A single "Network view" surface — already-built data, new composition — would speak to all three.

### Long-term value capture

The lock-in mechanism is the marketplace + planning fusion. Every other surface is replaceable. Strengthening that loop, then adding a thin layer of accuracy / confidence telemetry, builds defensibility. Spreading attention across new flows or new integrations dilutes the wedge.

---

## Prioritized improvements (no new features)

Ranked by leverage. Every item below is a sharpening of existing surfaces.

| # | Improvement | Why it matters | Where it lives |
|---|---|---|---|
| 1 | Wire Bought items as on-order in the next Replenishment plan (not just in the SKU chart) | Closes the marketplace ↔ planning loop. The thesis. Without this the system contradicts itself — buys reduce the chart's gap but not the next plan's recommendations. | `replenishment/page.tsx` `handleCreate`, `recommendations.ts` filtering |
| 2 | Show forecast vs. actuals on the SKU chart (a "last forecast" ghost line) + per-category model accuracy stat | Single biggest credibility lift. Without it the forecast is taken on faith. | `skus/[id]/page.tsx` chart + a stat above |
| 3 | Bulk actions on the action list: select N rows, Send to / Mark sent / Remove | Operational efficiency at real volume. Today, 50 Suggested actions = 50 individual reviews. | `action-list-table.tsx` |
| 4 | Status-grouped action list (Suggested / In Flight / Done segments) with per-segment counts | Lets planners triage their day. Currently statuses are interleaved. | List pages, no new component needed |
| 5 | Persist filter + pagination state in URL on SKU Inventory + Marketplace + action lists | Drilling into a SKU and back resets context. Pure friction. | Each list page, `useState` → URL search params |
| 6 | Exception surfacing: badge actions whose ETA passed or status hasn't moved in N days | Turns the action list from a log into a workspace. | List page row decoration |
| 7 | Tighten the "Why this was created" reasoning to a 2-line summary by default, with a "see reasoning" disclosure for the long form | Same information, much lower repeated-reading cost | All three detail pages |
| 8 | Show capacity warning in Marketplace Buy dialog when crossing `capacityRemainingUnits` | The data already exists; this turns it from a stat into a constraint. | `BuyDialog` |
| 9 | Show OTB impact in Replenishment + Reorder creation modals (mirror the Marketplace pattern) | Single most operationally important constraint, currently missing on 2 of 3 flows. | `creation-modal.tsx` |
| 10 | Source-warehouse splitting on Reorder: "X units at East DC + Y units at West DC = full coverage" instead of single-warehouse coverage math | Removes silently-wrong gap signaling. | `reordering/[id]/page.tsx` Availability cell |
| 11 | Network view: a single screen that rolls up open commitments, in-flight units, on-order $ by category and supplier | Speaks to CFO + ops director + CEO. Uses existing data. Replaces the "AI Assistant" chat slot which is currently underwhelming. | New page wired into existing data — not a new feature, a re-aggregation |
| 12 | Confidence band (P10–P90) on the forecast line | Distinguishes high-confidence projections from coin flips. Honest about what the model knows. | Same chart, additional Area series |
| 13 | Tone down "AI Assistant" naming until model accuracy is shown, OR commit to making accuracy visible | Sets expectations the product can keep | Sidebar + chat header |

Items 1, 2, and 3 are the highest-leverage. If only those three shipped, the product would feel meaningfully different.

---

## What we should explicitly NOT do

Saying no is half the audit.

- **No mobile app.** Inventory planners work at desks with multiple monitors. Mobile is the wrong investment for this user.
- **No additional integrations** beyond the six already listed. Adding more sets up a maintenance burden without changing the wedge.
- **No reintroduction of an Approval gate.** Removing it was correct. Manual approval steps are friction every workflow above 10 actions/week.
- **No size matrix in the Buy dialog yet.** It's a real gap (apparel doesn't sell in flat units), but adding it now expands the dialog beyond what a confident first-time user can handle. Defer to a v2 of the buying surface once the loop is closed.
- **No new top-level nav entries.** Five workflow surfaces is already a lot. Strengthen what's there.
- **No model configuration UI.** Exposing forecast hyperparameters to planners is a category mistake — they're paying us to make those decisions. Show the *outputs* (accuracy, confidence) not the *inputs*.
- **No multi-tenant / white-label features.** Premature; the product hasn't found its first customers yet.

---

## Risks if we ship as-is

1. **The marketplace ↔ planning gap is discovered in week 1.** A planner buys, then opens Replenishment, and sees the same demand they already filled. The contradiction undermines the entire AI claim. **Severity: critical.**
2. **First failed forecast becomes a crisis of confidence.** With no accuracy track record visible, the first time the model misses materially, the operations team blames the system. With accuracy visible, they accept the variance. **Severity: high.**
3. **Operational friction past 50 active actions.** Without bulk operations, status grouping, or saved views, daily review becomes a slog. Adoption drops to once-per-week instead of daily. **Severity: high at scale, low pre-launch.**
4. **CFO doesn't see themselves in the product.** The OTB context is the right hook but lives only inside the Marketplace. CFO-level rollup of committed $ across all open actions is missing — and that's the screen that drives renewal conversations. **Severity: medium pre-launch, high at renewal.**
5. **The "AI Assistant" chat handles a real planner question badly.** A keyword-matched chat will be tested with ambiguous real questions immediately. Worth either (a) muting the chat's prominence until it's stronger, or (b) constraining it to a tighter promise (e.g., "Quick reference for inventory terms"). **Severity: medium reputational.**
6. **The 480-SKU mock dataset masks scale questions.** No real customer has 480 SKUs. Questions like "how does the SKU grid feel at 5,000 SKUs" or "does the action list scale to 200 actions" haven't been answered. **Severity: medium operational.**
7. **The status vocabulary doubles up between action and line.** Planners may briefly conflate "Sent to Provider (action)" with "Sent to Provider (line)". A small visual differentiator solves this; without it, the first onboarding sessions will surface confusion. **Severity: low.**

---

## Closing assessment

This is a strong product. The conceptual model is right, the multi-warehouse architecture is correct, the marketplace fusion is differentiated, and the Send → Revert / OTB / supplier scorecard work is materially ahead of the category. The risks are not in the architecture — they're in the connective tissue.

The single most important thing to ship before scale is **closing the marketplace ↔ replenishment loop**. The second is **making the forecast model's track record and confidence visible**. The third is **operational density** — bulk actions, saved views, exception surfacing.

None of those are new features. All three are sharpening of work already in the product.

If those three ship, the next conversation worth having is who buys this and why. The platform is ready for that conversation; it just needs another month of refinement against the operational realities of a 50-action day.
