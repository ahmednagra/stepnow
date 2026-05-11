// src/components/admin/AdminPageHeader.tsx
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons). */
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-0.5">
        <h1 className="font-sans text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="text-[13px] text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
