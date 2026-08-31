import Image from "next/image";

type BrandLogoProps = {
  /** Width in pixels; height scales automatically. */
  width?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ width = 168, className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Gold Value LK"
      width={width}
      height={Math.round(width * 1.05)}
      priority={priority}
      className={`h-auto w-auto max-w-full ${className}`}
      style={{ width, height: "auto" }}
    />
  );
}
