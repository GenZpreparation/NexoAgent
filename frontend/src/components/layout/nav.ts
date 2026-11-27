import {
  BarChart3,
  Code2,
  Contact,
  CreditCard,
  Home,
  Megaphone,
  MessagesSquare,
  PhoneIncoming,
  Radio,
  Settings,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Custom active matcher (defaults to prefix match). */
  match?: (pathname: string) => boolean;
  keywords?: string;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { label: null, items: [{ label: "Home", href: "/", icon: Home, match: (p) => p === "/", keywords: "dashboard overview" }] },
  {
    label: "AI employees",
    items: [
      {
        label: "Your team",
        href: "/employees",
        icon: Users,
        match: (p) => p === "/employees" || (/^\/employees\/[^/]+$/.test(p) && !p.startsWith("/employees/new") && !p.startsWith("/employees/templates")),
        keywords: "agents staff",
      },
      { label: "Hire an AI employee", href: "/employees/new", icon: UserPlus, match: (p) => p.startsWith("/employees/new") || p.startsWith("/employees/templates"), keywords: "create new agent wizard templates" },
    ],
  },
  {
    label: "Results",
    items: [
      { label: "Leads", href: "/leads", icon: Contact, keywords: "crm contacts pipeline" },
      { label: "Conversations", href: "/conversations", icon: MessagesSquare, keywords: "calls transcripts recordings history" },
      { label: "Performance", href: "/performance", icon: BarChart3, keywords: "analytics charts metrics" },
    ],
  },
  {
    label: "Calling",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Megaphone, keywords: "bulk outbound list csv" },
      { label: "Instant leads", href: "/instant-leads", icon: Zap, keywords: "speed to lead meta ads sources" },
      { label: "Incoming calls", href: "/incoming-calls", icon: PhoneIncoming, keywords: "inbound reception" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Numbers & channels", href: "/channels", icon: Radio, keywords: "phone numbers telephony did" },
      { label: "Credits & billing", href: "/billing", icon: CreditCard, keywords: "wallet balance payments invoices" },
      { label: "Settings", href: "/settings", icon: Settings, keywords: "profile team members preferences security" },
      { label: "Developers", href: "/developers", icon: Code2, keywords: "api keys webhooks docs" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
