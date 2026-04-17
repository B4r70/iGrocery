"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/",
    label: "Home",
    Icon: HomeIcon,
    IconActive: HomeIconSolid,
  },
  {
    href: "/stats",
    label: "Statistik",
    Icon: ChartBarIcon,
    IconActive: ChartBarIconSolid,
  },
  {
    href: "/settings",
    label: "Einstellungen",
    Icon: Cog6ToothIcon,
    IconActive: Cog6ToothIconSolid,
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur"
    >
      <ul className="flex">
        {tabs.map(({ href, label, Icon, IconActive }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 min-h-[56px] justify-center w-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive ? (
                  <IconActive className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Icon className="h-6 w-6" aria-hidden="true" />
                )}
                <span className="text-xs font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
