"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { SendIcon, CheckIcon, Undo2Icon } from "lucide-react";
import { toast } from "sonner";

const INTEGRATIONS = [
  { id: "shopify", name: "Shopify" },
  { id: "amazon", name: "Amazon Seller Central" },
  { id: "netsuite", name: "NetSuite" },
  { id: "sap", name: "SAP S/4HANA" },
  { id: "edi", name: "EDI 850 (PO export)" },
  { id: "csv", name: "CSV / spreadsheet" },
];

export function SendToIntegration({
  actionName,
  noun,
}: {
  actionName: string;
  noun: string;
}) {
  const [target, setTarget] = useState<string>("");
  const [sentTo, setSentTo] = useState<{ id: string; name: string } | null>(
    null
  );

  const handleSend = () => {
    if (!target) return;
    const integration = INTEGRATIONS.find((i) => i.id === target);
    if (!integration) return;
    setSentTo(integration);
    toast.success(`Sent ${actionName} to ${integration.name}`, {
      description: `Pushing ${noun} payload to the destination system.`,
    });
    setTarget("");
  };

  const handleRevert = () => {
    if (!sentTo) return;
    toast.success(`Reverted send to ${sentTo.name}`, {
      description: `${actionName} is back in your queue and not yet pushed.`,
    });
    setSentTo(null);
  };

  if (sentTo) {
    return (
      <div className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success-soft/40 overflow-hidden">
        <span className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-success-foreground">
          <CheckIcon className="size-3.5" />
          Sent to {sentTo.name}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRevert}
          className="rounded-none border-l border-success/30 h-8 text-success-foreground hover:bg-success-soft"
        >
          <Undo2Icon /> Revert
        </Button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card overflow-hidden">
      <Select value={target} onValueChange={(v) => v && setTarget(v)}>
        <SelectTrigger className="h-8 border-0 bg-transparent rounded-none focus-visible:ring-0 text-xs w-44">
          <SelectValue placeholder="Send to..." />
        </SelectTrigger>
        <SelectContent>
          {INTEGRATIONS.map((i) => (
            <SelectItem key={i.id} value={i.id}>
              {i.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSend}
        disabled={!target}
        className="rounded-none border-l border-border h-8"
      >
        <SendIcon /> Send
      </Button>
    </div>
  );
}
