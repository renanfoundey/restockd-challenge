"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { toast } from "sonner";
import {
  MessageSquareIcon,
  PackageIcon,
  TruckIcon,
  RotateCcwIcon,
  ShuffleIcon,
  SlidersHorizontalIcon,
  SettingsIcon,
  MoreHorizontalIcon,
  UserIcon,
  LogOutIcon,
  StoreIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/chat", label: "AI Assistant", icon: MessageSquareIcon },
      { href: "/skus", label: "SKU Inventory", icon: PackageIcon },
    ],
  },
  {
    label: "Core",
    items: [
      { href: "/replenishment", label: "Replenishment", icon: TruckIcon },
      { href: "/store", label: "Marketplace", icon: StoreIcon },
    ],
  },
  {
    label: "Tactical",
    items: [
      { href: "/reordering", label: "Reordering", icon: RotateCcwIcon },
      { href: "/rebalancing", label: "Rebalancing", icon: ShuffleIcon },
    ],
  },
  {
    label: "Configure",
    items: [
      { href: "/parameters", label: "Parameters", icon: SlidersHorizontalIcon },
      { href: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const currentUser = {
  name: "General User",
  email: "general@foundey.com",
  initials: "GU",
};

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    toast.success("Signed out", { description: "See you next time." });
  };

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 flex flex-col">
      <div className="px-4 py-4 flex items-center gap-2">
        <BrandMark />
        <span className="text-base font-semibold tracking-tight text-foreground">
          Restockd
        </span>
      </div>

      <nav className="flex-1 px-2 pb-4 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi} className={cn(gi === 0 ? "mt-1" : "mt-4")}>
            {group.label && (
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150",
                      active
                        ? "bg-sidebar-accent text-foreground font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Popover.Root>
          <Popover.Trigger
            className={cn(
              "w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left",
              "hover:bg-sidebar-accent/60 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            )}
          >
            <span className="size-8 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
              {currentUser.initials}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-foreground truncate">
                {currentUser.name}
              </span>
              <span className="block text-xs text-muted-foreground truncate">
                {currentUser.email}
              </span>
            </span>
            <MoreHorizontalIcon className="size-4 text-muted-foreground shrink-0" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="top" align="start" sideOffset={6}>
              <Popover.Popup
                className={cn(
                  "w-56 rounded-lg bg-popover text-popover-foreground p-1",
                  "ring-1 ring-foreground/10 shadow-md outline-none",
                  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                  "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
                )}
              >
                <Popover.Close
                  render={
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                      <UserIcon className="size-4 text-muted-foreground" />
                      Account settings
                    </Link>
                  }
                />
                <div className="my-1 h-px bg-border" />
                <Popover.Close
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive-soft cursor-pointer text-left"
                >
                  <LogOutIcon className="size-4" />
                  Log out
                </Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <span className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
      R
    </span>
  );
}
