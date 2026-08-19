export type OfficialIdentityVariant =
  | "forest-green-vm"
  | "brushed-dark-silver-vm"
  | "iridescent-vm"
  | "gold-c-frame-cvm"
  | "utility-vm";

export type OfficialIdentityMode = "light" | "dark";

export const OFFICIAL_IDENTITY_VERSION = "2.0";

export const OFFICIAL_IDENTITY = {
  marks: {
    "forest-green-vm": "/brand/official-v2/marks/forest-green-vm.webp",
    "brushed-dark-silver-vm": "/brand/official-v2/marks/brushed-dark-silver-vm.webp",
    "iridescent-vm": "/brand/official-v2/marks/iridescent-vm.webp",
    "gold-c-frame-cvm": "/brand/official-v2/marks/gold-c-frame-cvm.webp",
  },
  utility: {
    light: "/brand/official-v2/utility/vm-mono-black.svg",
    dark: "/brand/official-v2/utility/vm-mono-white.svg",
  },
  collectiveUtility: {
    light: "/brand/official-v2/utility/cvm-mono-black.svg",
    dark: "/brand/official-v2/utility/cvm-mono-white.svg",
  },
  icons: {
    forest180: "/brand/official-v2/icons/forest-180.png",
    forest192: "/brand/official-v2/icons/forest-192.png",
    forest512: "/brand/official-v2/icons/forest-512.png",
    favicon: "/brand/official-v2/icons/forest-favicon.ico",
  },
  social: {
    forestOg: "/brand/official-v2/social/forest-og-1200x630.png",
  },
  watermarks: {
    primaryDiagonal: "/brand/official-v2/watermarks/VMW_A_Primary-Diagonal-VM_white.svg",
    balancedDiagonal: "/brand/official-v2/watermarks/VMW_B_Balanced-Diagonal-VM_white.svg",
    compactOverlay: "/brand/official-v2/watermarks/VMW_C_Compact-Overlay-VM_white.svg",
    collectiveOpen: "/brand/official-v2/watermarks/VMW_D_Primary-Collective-Open_white.svg",
    collectiveStacked: "/brand/official-v2/watermarks/VMW_E_Compact-Collective-Stacked_white.svg",
  },
} as const;

export function officialIdentitySource(
  variant: OfficialIdentityVariant,
  mode: OfficialIdentityMode = "light",
): string {
  return variant === "utility-vm"
    ? OFFICIAL_IDENTITY.utility[mode]
    : OFFICIAL_IDENTITY.marks[variant];
}
