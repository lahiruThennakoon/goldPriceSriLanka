"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "@/components/nav-icons";

const TABS: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/calculator", label: "Calculator", icon: "calculator" },
  { href: "/my-gold", label: "My Gold", icon: "my-gold" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-hairline bg-surface-raised/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md px-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium"
                style={{ color: active ? "var(--accent-gold)" : "var(--ink-secondary)" }}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className="flex h-8 w-10 items-center justify-center rounded-md transition-colors"
                  style={{
                    background: active
                      ? "color-mix(in srgb, var(--accent-gold) 16%, transparent)"
                      : "transparent",
                  }}
                >
                  <NavIcon name={tab.icon} />
                </span>
                <span className="leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
