// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { BrandMark } from "@/components/shared";
import { cn } from "@/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Section divider above this item. */
  group?: string;
  /** Marked as "coming in 5b/5c" — still rendered but disabled visually. */
  comingSoon?: boolean;
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

  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck, group: "Operations" },
  { href: "/admin/contact-messages", label: "Contact messages", icon: Mail },

  { href: "/admin/settings", label: "Business settings", icon: Settings, group: "System" },
  { href: "/admin/admin-users", label: "Admin users", icon: Users, comingSoon: true },
  { href: "/admin/email-logs", label: "Email logs", icon: AtSign, comingSoon: true },
  { href: "/admin/audit-log", label: "Audit log", icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="hidden h-full w-60 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-5">
        <BrandMark size={22} tone="dark" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-900">
          StepNow Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <div key={item.href}>
              {item.group && (
                <p className="mt-3 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.group}
                </p>
              )}
              {item.comingSoon ? (
                <span
                  aria-disabled="true"
                  className="group flex cursor-not-allowed items-center gap-2.5 rounded px-2 py-1.5 text-[13px] text-slate-400"
                  title="Coming soon"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-slate-300">soon</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded px-2 py-1.5 text-[13px] transition-colors",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">v0.5 · Phase 5c</p>
      </div>
    </aside>
  );
}
