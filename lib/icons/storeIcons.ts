// Curated map of semantic store icon keys to Heroicons (outline + solid).
// 20 icons covering common store / category types.
import {
  ShoppingCartIcon as ShoppingCartOutline,
  BuildingStorefrontIcon as BuildingStorefrontOutline,
  HomeModernIcon as HomeModernOutline,
  BeakerIcon as BeakerOutline,
  TagIcon as TagOutline,
  GiftIcon as GiftOutline,
  CakeIcon as CakeOutline,
  SparklesIcon as SparklesOutline,
  TruckIcon as TruckOutline,
  WrenchScrewdriverIcon as WrenchScrewdriverOutline,
  ComputerDesktopIcon as ComputerDesktopOutline,
  DevicePhoneMobileIcon as DevicePhoneMobileOutline,
  BookOpenIcon as BookOpenOutline,
  MusicalNoteIcon as MusicalNoteOutline,
  HeartIcon as HeartOutline,
  ScissorsIcon as ScissorsOutline,
  SunIcon as SunOutline,
  BoltIcon as BoltOutline,
  ArchiveBoxIcon as ArchiveBoxOutline,
  ShoppingBagIcon as ShoppingBagOutline,
} from "@heroicons/react/24/outline";

import {
  ShoppingCartIcon as ShoppingCartSolid,
  BuildingStorefrontIcon as BuildingStorefrontSolid,
  HomeModernIcon as HomeModernSolid,
  BeakerIcon as BeakerSolid,
  TagIcon as TagSolid,
  GiftIcon as GiftSolid,
  CakeIcon as CakeSolid,
  SparklesIcon as SparklesSolid,
  TruckIcon as TruckSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverSolid,
  ComputerDesktopIcon as ComputerDesktopSolid,
  DevicePhoneMobileIcon as DevicePhoneMobileSolid,
  BookOpenIcon as BookOpenSolid,
  MusicalNoteIcon as MusicalNoteSolid,
  HeartIcon as HeartSolid,
  ScissorsIcon as ScissorsSolid,
  SunIcon as SunSolid,
  BoltIcon as BoltSolid,
  ArchiveBoxIcon as ArchiveBoxSolid,
  ShoppingBagIcon as ShoppingBagSolid,
} from "@heroicons/react/24/solid";

import type { ComponentType } from "react";

export interface StoreIconEntry {
  key: string;
  label: string;
  outline: ComponentType<{ className?: string }>;
  solid: ComponentType<{ className?: string }>;
}

export const STORE_ICONS: readonly StoreIconEntry[] = [
  {
    key: "shopping-cart",
    label: "Einkaufswagen",
    outline: ShoppingCartOutline,
    solid: ShoppingCartSolid,
  },
  {
    key: "building-storefront",
    label: "Geschäft",
    outline: BuildingStorefrontOutline,
    solid: BuildingStorefrontSolid,
  },
  {
    key: "home-modern",
    label: "Haus",
    outline: HomeModernOutline,
    solid: HomeModernSolid,
  },
  {
    key: "beaker",
    label: "Drogerie",
    outline: BeakerOutline,
    solid: BeakerSolid,
  },
  {
    key: "tag",
    label: "Angebot",
    outline: TagOutline,
    solid: TagSolid,
  },
  {
    key: "gift",
    label: "Geschenke",
    outline: GiftOutline,
    solid: GiftSolid,
  },
  {
    key: "cake",
    label: "Bäckerei",
    outline: CakeOutline,
    solid: CakeSolid,
  },
  {
    key: "sparkles",
    label: "Reinigung",
    outline: SparklesOutline,
    solid: SparklesSolid,
  },
  {
    key: "truck",
    label: "Lieferung",
    outline: TruckOutline,
    solid: TruckSolid,
  },
  {
    key: "wrench-screwdriver",
    label: "Baumarkt",
    outline: WrenchScrewdriverOutline,
    solid: WrenchScrewdriverSolid,
  },
  {
    key: "computer-desktop",
    label: "Elektronik",
    outline: ComputerDesktopOutline,
    solid: ComputerDesktopSolid,
  },
  {
    key: "device-phone-mobile",
    label: "Handy",
    outline: DevicePhoneMobileOutline,
    solid: DevicePhoneMobileSolid,
  },
  {
    key: "book-open",
    label: "Bücher",
    outline: BookOpenOutline,
    solid: BookOpenSolid,
  },
  {
    key: "musical-note",
    label: "Musik",
    outline: MusicalNoteOutline,
    solid: MusicalNoteSolid,
  },
  {
    key: "heart",
    label: "Apotheke",
    outline: HeartOutline,
    solid: HeartSolid,
  },
  {
    key: "scissors",
    label: "Friseur",
    outline: ScissorsOutline,
    solid: ScissorsSolid,
  },
  {
    key: "sun",
    label: "Garten",
    outline: SunOutline,
    solid: SunSolid,
  },
  {
    key: "bolt",
    label: "Tanken",
    outline: BoltOutline,
    solid: BoltSolid,
  },
  {
    key: "archive-box",
    label: "Lager",
    outline: ArchiveBoxOutline,
    solid: ArchiveBoxSolid,
  },
  {
    key: "shopping-bag",
    label: "Mode",
    outline: ShoppingBagOutline,
    solid: ShoppingBagSolid,
  },
] as const;

// Lookup by key — O(n) over 20 entries, acceptable for UI usage.
export function getStoreIcon(key: string): StoreIconEntry | undefined {
  return STORE_ICONS.find((icon) => icon.key === key);
}
