import {
  LayoutGrid,
  TreePine,
  Satellite,
  Radar,
  ShieldAlert,
  Bot,
  FileBarChart,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type PageId =
  | "overview"
  | "multi-agent"
  | "range-detector"
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

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "multi-agent", label: "Multi-Agent AI", icon: Bot },
  { id: "range-detector", label: "Range Scanner", icon: Radar },
  { id: "forest-explorer", label: "Forest Explorer", icon: TreePine },
  { id: "satellite-compare", label: "Satellite Compare", icon: Satellite },
  { id: "threat-intel", label: "Threat Intel", icon: ShieldAlert },
  { id: "reports-analytics", label: "Reports & Analytics", icon: FileBarChart },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];


