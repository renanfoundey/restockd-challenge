"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getItems, setItems, getObject, setObject } from "@/lib/storage";
import { toast } from "sonner";
import { UploadIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import type { SKU } from "@/lib/types";

interface Connection {
  id: string;
  platform: string;
  connected: boolean;
  lastSync: string | null;
}

const defaultConnections: Connection[] = [
  { id: "conn-1", platform: "Shopify", connected: true, lastSync: "2026-04-08" },
  { id: "conn-2", platform: "WooCommerce", connected: false, lastSync: null },
  { id: "conn-3", platform: "Amazon Seller Central", connected: true, lastSync: "2026-04-07" },
  { id: "conn-4", platform: "Etsy", connected: false, lastSync: null },
];

const categories = [
  "Outerwear", "Tops", "Bottoms", "Dresses",
  "Activewear", "Accessories", "Footwear", "Denim",
];

function computeStatus(daysOfSupply: number): SKU["status"] {
  if (daysOfSupply === 0) return "Out of Stock";
  if (daysOfSupply <= 4) return "Critical";
  if (daysOfSupply <= 14) return "Low Stock";
  return "In Stock";
}

export default function ParametersPage() {
  const [forecastHorizon, setForecastHorizon] = useState("30");
  const [seasonalityWeight, setSeasonalityWeight] = useState("0.7");
  const [trendSensitivity, setTrendSensitivity] = useState("0.5");
  const [safetyStockDays, setSafetyStockDays] = useState("7");
  const [leadTimeBuffer, setLeadTimeBuffer] = useState("3");
  const [moqRounding, setMoqRounding] = useState("round-up");

  const [overrides, setOverrides] = useState(
    categories.map((cat) => ({
      category: cat,
      safetyMultiplier: "1.0",
      reorderFrequency: "Weekly",
    }))
  );

  // Store connections
  const [connections, setConnections] = useState<Connection[]>(defaultConnections);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Data upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const stored = getItems<Connection>("restockd_connections");
    if (stored.length) setConnections(stored);
  }, []);

  const updateOverride = (index: number, field: string, value: string) => {
    setOverrides((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o))
    );
  };

  const toggleConnection = (id: string) => {
    setTogglingId(id);
    setTimeout(() => {
      setConnections((prev) => {
        const updated = prev.map((c) =>
          c.id === id
            ? {
                ...c,
                connected: !c.connected,
                lastSync: !c.connected ? new Date().toISOString().split("T")[0] : c.lastSync,
              }
            : c
        );
        setItems("restockd_connections", updated);
        const conn = updated.find((c) => c.id === id)!;
        toast.success(`${conn.platform} ${conn.connected ? "connected" : "disconnected"}`);
        return updated;
      });
      setTogglingId(null);
    }, 500);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n").map((l) => l.split(",").map((c) => c.trim()));
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      setCsvHeaders(lines[0]);
      setCsvPreview(lines.slice(1, 11));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!csvPreview.length) return;

    const idIdx = csvHeaders.indexOf("id");
    const nameIdx = csvHeaders.indexOf("productName");
    const varIdx = csvHeaders.indexOf("variant");
    const catIdx = csvHeaders.indexOf("category");
    const stockIdx = csvHeaders.indexOf("currentStock");
    const salesIdx = csvHeaders.indexOf("avgDailySales");
    const costIdx = csvHeaders.indexOf("unitCost");
    const leadIdx = csvHeaders.indexOf("leadTimeDays");
    const supIdIdx = csvHeaders.indexOf("supplierId");
    const supNameIdx = csvHeaders.indexOf("supplierName");

    if (idIdx === -1 || nameIdx === -1) {
      toast.error("CSV must include at least 'id' and 'productName' columns");
      return;
    }

    const newSkus: SKU[] = csvPreview.map((row) => {
      const currentStock = parseInt(row[stockIdx] || "0") || 0;
      const avgDailySales = parseInt(row[salesIdx] || "0") || 0;
      const daysOfSupply = avgDailySales === 0 ? 0 : Math.floor(currentStock / avgDailySales);
      const leadTimeDays = parseInt(row[leadIdx] || "7") || 7;
      return {
        id: row[idIdx] || `UPLOAD-${Math.random().toString(36).slice(2, 8)}`,
        productName: row[nameIdx] || "Unknown Product",
        variant: row[varIdx] || "Default",
        category: row[catIdx] || "Accessories",
        currentStock,
        avgDailySales,
        daysOfSupply,
        reorderPoint: Math.round(avgDailySales * leadTimeDays * 1.5),
        status: computeStatus(daysOfSupply),
        supplierId: row[supIdIdx] || "SUP-001",
        supplierName: row[supNameIdx] || "Unknown Supplier",
        unitCost: parseFloat(row[costIdx] || "0") || 0,
        leadTimeDays,
        imageUrl: `https://loremflickr.com/400/600/clothing?lock=${Math.floor(Math.random() * 200)}`,
      };
    });

    const existing = getItems<SKU>("restockd_uploaded_skus");
    setItems("restockd_uploaded_skus", [...newSkus, ...existing]);
    toast.success(`${newSkus.length} SKUs imported successfully`);
    setCsvPreview([]);
    setCsvHeaders([]);
  };

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold">Parameters</h1>
        <p className="text-sm text-muted-foreground">
          Configure forecasting, reorder parameters, store connections, and data imports
        </p>
      </div>

      {/* Store Connections */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Store Connections</h2>
        <p className="text-xs text-muted-foreground">Connect your sales channels to sync inventory data automatically.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Synced</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((conn) => (
              <TableRow key={conn.id}>
                <TableCell className="font-medium">{conn.platform}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs">
                    {conn.connected ? (
                      <><CheckCircleIcon className="h-3.5 w-3.5 text-green-600" /> Connected</>
                    ) : (
                      <><XCircleIcon className="h-3.5 w-3.5 text-muted-foreground" /> Disconnected</>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {conn.lastSync || "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={conn.connected}
                    onCheckedChange={() => toggleConnection(conn.id)}
                    disabled={togglingId === conn.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Data Upload */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Data Upload</h2>
        <p className="text-xs text-muted-foreground">
          Upload a CSV file with columns: id, productName, variant, category, currentStock, avgDailySales, unitCost, leadTimeDays, supplierId, supplierName
        </p>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag & drop a CSV file here, or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {csvPreview.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Preview ({csvPreview.length} rows)</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvHeaders.map((h, i) => (
                      <TableHead key={i} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreview.map((row, ri) => (
                    <TableRow key={ri}>
                      {row.map((cell, ci) => (
                        <TableCell key={ci} className="text-xs">{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImport}>Import {csvPreview.length} SKUs</Button>
              <Button variant="outline" onClick={() => { setCsvPreview([]); setCsvHeaders([]); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Forecast Settings */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Forecast Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm mb-1.5">Forecast Horizon (days)</Label>
            <Input
              type="number"
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm mb-1.5">Seasonality Weight (0-1)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={seasonalityWeight}
              onChange={(e) => setSeasonalityWeight(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm mb-1.5">Trend Sensitivity (0-1)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={trendSensitivity}
              onChange={(e) => setTrendSensitivity(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Reorder Settings */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Reorder Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm mb-1.5">Safety Stock (days)</Label>
            <Input
              type="number"
              value={safetyStockDays}
              onChange={(e) => setSafetyStockDays(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm mb-1.5">Lead Time Buffer (days)</Label>
            <Input
              type="number"
              value={leadTimeBuffer}
              onChange={(e) => setLeadTimeBuffer(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm mb-1.5">MOQ Rounding</Label>
            <Select value={moqRounding} onValueChange={(v) => v && setMoqRounding(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round-up">Round Up</SelectItem>
                <SelectItem value="round-down">Round Down</SelectItem>
                <SelectItem value="nearest">Nearest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Per-Category Overrides */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Per-Category Overrides</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Safety Stock Multiplier</TableHead>
              <TableHead>Reorder Frequency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overrides.map((o, i) => (
              <TableRow key={o.category}>
                <TableCell className="font-medium">{o.category}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    value={o.safetyMultiplier}
                    onChange={(e) => updateOverride(i, "safetyMultiplier", e.target.value)}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={o.reorderFrequency}
                    onValueChange={(v) => v && updateOverride(i, "reorderFrequency", v)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button onClick={() => { toast.success("Parameters saved"); }}>
        Save Parameters
      </Button>
    </div>
  );
}
