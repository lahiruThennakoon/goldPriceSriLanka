import Image from "next/image";

const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 1024;

type BrandLogoProps = {
  /** Visible height of the full lockup artwork. */
  height?: number;
  width?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  height = 58,
  width,
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Gold Value LK"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      quality={100}
      priority={priority}
      sizes="(max-width: 556px) 180px, 220px"
      className={`block h-auto max-w-full ${className}`}
      style={width != null ? { width, height: "auto" } : { height, width: "auto" }}
    />
  );
}
