"use client";

import { Badge } from "@/components/ui/badge";
import type { InventoryAction } from "@/lib/types";

// Per-line SKU status. Each flow has its own vocabulary that reflects how
// inventory physically moves through that workflow:
//   Replenishment: manufacturer → warehouse → store
//   Reorder:       warehouse → store, may depend on inbound replenishment
//   Rebalance:     store → store, internal transfer
// We derive the line-level state from the parent action's global status,
// with a small per-row variance so the table reflects the reality that some
// units move ahead of others within the same action.

export type FlowKind = "replenishment" | "reorder" | "rebalance";

const REPLEN_STAGES = [
  "Suggested",
  "Allocated",
  "In Fulfillment",
  "In Transit",
  "Received",
  "Lost",
] as const;

const REORDER_STAGES = [
  "Suggested",
  "Sent to Provider",
  "In Production",
  "In Transit",
  "Received",
  "Lost",
] as const;

const REBALANCE_STAGES = [
  "Suggested",
  "Reserved",
  "In Transfer",
  "Received",
  "Lost",
] as const;

// Floor index into the flow-specific stage array, by parent action status.
// "Lost" is exceptional — never the floor; surfaced for a small share of
// completed lines to reflect real-world shrinkage / damage.
const FLOOR_BY_STATUS: Record<
  InventoryAction["status"],
  Record<FlowKind, number>
> = {
  Suggested: { replenishment: 0, reorder: 0, rebalance: 0 },
  "Ready to Send": { replenishment: 1, reorder: 0, rebalance: 1 },
  "Sent to Provider": { replenishment: 2, reorder: 1, rebalance: 1 },
  Processing: { replenishment: 3, reorder: 2, rebalance: 2 },
  Completed: { replenishment: 4, reorder: 4, rebalance: 3 },
};

function variantFor(stage: string): "outline" | "info" | "warning" | "success" | "destructive" {
  if (stage === "Lost") return "destructive";
  if (stage === "Received") return "success";
  if (stage === "Suggested") return "outline";
  if (stage === "In Production" || stage === "In Fulfillment")
    return "warning";
  // Allocated / Reserved / Sent to Provider / In Transit / In Transfer
  return "info";
}

export function SkuLineStatusBadge({
  status,
  flow,
  idx,
}: {
  status: InventoryAction["status"];
  flow: FlowKind;
  idx: number;
}) {
  const stages =
    flow === "replenishment"
      ? REPLEN_STAGES
      : flow === "reorder"
      ? REORDER_STAGES
      : REBALANCE_STAGES;
  const floor = FLOOR_BY_STATUS[status][flow];
  // Variance: most rows at floor, some +1 (advanced), few -1 (lagging),
  // and a small "Lost" slice for Completed actions.
  let stageIdx = floor;
  if (idx % 5 === 0) stageIdx = Math.min(stages.length - 2, floor + 1); // advanced
  else if (idx % 9 === 0) stageIdx = Math.max(0, floor - 1); // lagging
  if (status === "Completed" && idx % 47 === 3) {
    stageIdx = stages.length - 1; // Lost — small share of completed lines
  }
  const stage = stages[stageIdx];
  return <Badge variant={variantFor(stage)}>{stage}</Badge>;
}
