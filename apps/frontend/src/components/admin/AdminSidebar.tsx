// apps/frontend/src/components/admin/AdminSidebar.tsx
// Refined sidebar with gold-rail active state, group dividers, optional badge counts.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Car,
  MessageSquareQuote,
  HelpCircle,
  Tags,
  Settings,
  CalendarCheck,
  Mail,
  FileText,
  Languages,
  AtSign,
  History,
  Users,
  ClipboardList,
  UserCheck,
  Contact,
  Receipt,
} from "lucide-react";
import { BrandMark } from "@/components/shared";
import { cn } from "@/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  group?: string;
  comingSoon?: boolean;
  badgeKey?: "bookings" | "messages";
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/services", label: "Services", icon: Briefcase, group: "Content" },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/pricing", label: "Pricing", icon: Tags },
  { href: "/admin/legal-pages", label: "Legal pages", icon: FileText },
  { href: "/admin/ui-strings", label: "UI strings", icon: Languages },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: CalendarCheck,
    group: "Operations",
    badgeKey: "bookings",
  },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Contact },
  { href: "/admin/drivers", label: "Drivers", icon: UserCheck },
  { href: "/admin/contact-messages", label: "Messages", icon: Mail, badgeKey: "messages" },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt, comingSoon: true },
  { href: "/admin/settings", label: "Business settings", icon: Settings, group: "System" },
  { href: "/admin/admin-users", label: "Admin users", icon: Users, comingSoon: true },
  { href: "/admin/email-logs", label: "Email logs", icon: AtSign, comingSoon: true },
  { href: "/admin/audit-log", label: "Audit log", icon: History },
];

interface AdminSidebarProps {
  counts?: { bookings?: number; messages?: number };
}

function AdminSidebarBase({ counts }: AdminSidebarProps) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="hidden h-full w-60 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-5">
        <BrandMark size={22} tone="dark" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.20em] text-slate-900">
          StepNow Admin
        </span>
      </div>
      <nav className="scrollbar-dark flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badge = item.badgeKey ? counts?.[item.badgeKey] : undefined;
          return (
            <div key={item.href}>
              {item.group && (
                <p className="mt-4 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
                  {item.group}
                </p>
              )}
              {item.comingSoon ? (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-[13px] text-slate-400">
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Soon
                  </span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-between gap-2 px-3 py-1.5 text-[13px] transition-colors",
                    isActive
                      ? "bg-[#F5F2EC] font-medium text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-0 top-1 w-[2px] bg-[#A8865A]"
                    />
                  )}
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={cn("h-4 w-4", isActive ? "text-[#A8865A]" : "text-slate-400")}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                  {badge != null && badge > 0 && (
                    <span
                      className={cn(
                        "min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums",
                        isActive ? "bg-[#A8865A] text-white" : "bg-slate-900 text-amber-200",
                      )}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        V0.1 · Phase A
      </div>
    </aside>
  );
}

export const AdminSidebar = memo(AdminSidebarBase);
