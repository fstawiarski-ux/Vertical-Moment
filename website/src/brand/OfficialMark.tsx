import type { CSSProperties } from "react";
import {
  officialIdentitySource,
  type OfficialIdentityMode,
  type OfficialIdentityVariant,
} from "./officialIdentity";

type Props = {
  variant?: OfficialIdentityVariant;
  mode?: OfficialIdentityMode;
  size?: number | string;
  animated?: boolean;
  className?: string;
  alt?: string;
  decorative?: boolean;
  priority?: boolean;
};

export function OfficialMark({
  variant = "forest-green-vm",
  mode = "light",
  size = 48,
  animated = false,
  className = "",
  alt = "Vertical Moment",
  decorative = false,
  priority = false,
}: Props) {
  const style: CSSProperties = { width: size, height: size };

  return (
    <img
      className={`vm-official-mark${animated ? " vm-official-mark--animated" : ""}${className ? ` ${className}` : ""}`}
      src={officialIdentitySource(variant, mode)}
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      style={style}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? true : undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
