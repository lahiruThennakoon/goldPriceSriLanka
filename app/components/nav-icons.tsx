import type { ComponentType } from "react";

type NavIconProps = {
  className?: string;
};

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function NavIconHome({ className }: NavIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function NavIconCalculator({ className }: NavIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h2" />
      <path d="M11 11h2" />
      <path d="M14 11h2" />
      <path d="M8 14h2" />
      <path d="M11 14h2" />
      <path d="M14 14h2" />
      <path d="M8 17h8" />
    </svg>
  );
}

export function NavIconMyGold({ className }: NavIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 3 4 8v8l8 5 8-5V8l-8-5Z" />
      <path d="m4 8 8 5 8-5" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function NavIconHistory({ className }: NavIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3-3 3 2 4-5" />
    </svg>
  );
}

export function NavIconSettings({ className }: NavIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </svg>
  );
}

export type NavIconName = "home" | "calculator" | "my-gold" | "history" | "settings";

const NAV_ICONS: Record<NavIconName, ComponentType<NavIconProps>> = {
  home: NavIconHome,
  calculator: NavIconCalculator,
  "my-gold": NavIconMyGold,
  history: NavIconHistory,
  settings: NavIconSettings,
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = NAV_ICONS[name];
  return <Icon className={className} />;
}
