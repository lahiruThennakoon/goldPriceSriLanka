"use client";

import { BrandLogo } from "@/components/brand-logo";

const SPLASH_NAVY = "#0a1528";

export function AppSplash({ fading }: { fading: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ease-out"
      style={{
        background: SPLASH_NAVY,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="img"
      aria-label="Gold Value LK"
    >
      <BrandLogo height={120} priority />
    </div>
  );
}
