"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/calculator", label: "Calculator", icon: "∑" },
  { href: "/my-gold", label: "My Gold", icon: "◆" },
  { href: "/history", label: "History", icon: "⤳" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-border-hairline bg-surface-raised"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-xs"
                style={{ color: active ? "var(--accent-gold)" : "var(--ink-secondary)" }}
                aria-current={active ? "page" : undefined}
              >
                <span aria-hidden className="text-lg leading-none">
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
