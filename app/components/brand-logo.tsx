import Image from "next/image";

const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 1024;

type BrandLogoProps = {
  height?: number;
  width?: number;
  variant?: "default" | "splash";
  className?: string;
  priority?: boolean;
};

const VARIANT_HEIGHT = {
  default: 60,
  splash: 200,
} as const;

export function BrandLogo({
  height,
  width,
  variant = "default",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const resolvedHeight = height ?? VARIANT_HEIGHT[variant];

  return (
    <Image
      src="/logo.png"
      alt="Gold Value LK"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      quality={100}
      priority={priority}
      sizes={variant === "splash" ? "(max-width: 556px) 320px, 360px" : "(max-width: 556px) 180px, 220px"}
      className={`block h-auto max-w-full ${className}`}
      style={width != null ? { width, height: "auto" } : { height: resolvedHeight, width: "auto" }}
    />
  );
}
