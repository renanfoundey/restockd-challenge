"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chat", label: "AI Forecasting" },
  { href: "/skus", label: "SKU Inventory" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/reordering", label: "Reordering" },
  { href: "/rebalancing", label: "Rebalancing" },
  { href: "/parameters", label: "Parameters" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/30 min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <span className="text-lg font-semibold tracking-tight text-primary">Restockd</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-3 py-2 rounded-md text-sm",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
