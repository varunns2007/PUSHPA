import {
  LayoutGrid,
  TreePine,
  Satellite,
  ShieldAlert,
  FileBarChart,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type PageId =
  | "overview"
  | "forest-explorer"
  | "satellite-compare"
  | "threat-intel"
  | "reports-analytics"
  | "settings";

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

// Consolidated down to 6 sections (from 15) — each one groups related views
// behind tabs instead of a separate nav entry per screen.
export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "forest-explorer", label: "Forest Explorer", icon: TreePine },
  { id: "satellite-compare", label: "Satellite Compare", icon: Satellite },
  { id: "threat-intel", label: "Threat Intel", icon: ShieldAlert },
  { id: "reports-analytics", label: "Reports & Analytics", icon: FileBarChart },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];
