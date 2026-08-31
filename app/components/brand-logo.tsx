import Image from "next/image";

const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 1024;

type BrandLogoProps = {
  width?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ width = 120, className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Gold Value LK"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={`h-auto max-w-full ${className}`}
      style={{ width, height: "auto" }}
    />
  );
}
