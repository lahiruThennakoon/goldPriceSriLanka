import { BrandLogo } from "@/components/brand-logo";

export function HomeBrandHeader() {
  return (
    <header className="flex flex-col items-center pt-2 pb-1">
      <BrandLogo width={176} priority className="drop-shadow-sm" />
      <p className="mt-2 text-center text-xs tracking-wide" style={{ color: "var(--ink-secondary)" }}>
        Live gold prices for Sri Lanka
      </p>
    </header>
  );
}
