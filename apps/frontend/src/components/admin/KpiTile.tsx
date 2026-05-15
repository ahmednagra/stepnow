// apps/frontend/src/components/admin/KpiTile.tsx
// KPI tile with serif numeral, accent rail, optional sparkline & delta.

import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/utils/cn";

type Accent = "gold" | "ink" | "gold-deep" | "mute";

interface KpiTileProps {
  label: string;
  value: ReactNode;
  context?: string;
  icon?: ReactNode;
  accent?: Accent;
  delta?: { value: number; direction: "up" | "down" | "flat" };
  sparkline?: number[];
  className?: string;
}

const ACCENT_BG: Record<Accent, string> = {
  gold: "bg-[#A8865A]",
  ink: "bg-[#0F1115]",
  "gold-deep": "bg-[#86683F]",
  mute: "bg-[#5A5A5A]",
};
const ACCENT_TEXT: Record<Accent, string> = {
  gold: "text-[#A8865A]",
  ink: "text-[#0F1115]",
  "gold-deep": "text-[#86683F]",
  mute: "text-[#5A5A5A]",
};

function Sparkline({ data, accent }: { data: number[]; accent: Accent }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 24 - ((v - min) / range) * 22 - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const colorMap = { gold: "#A8865A", ink: "#0F1115", "gold-deep": "#86683F", mute: "#5A5A5A" };
  const stroke = colorMap[accent];
  return (
    <svg viewBox="0 0 100 24" className="mt-2.5 h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={`${points} 100,24 0,24`} fill={stroke} fillOpacity="0.08" />
      <polyline points={points} stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiTile({
  label, value, context, icon, accent = "gold", delta, sparkline, className,
}: KpiTileProps) {
  const DeltaIcon = delta?.direction === "up" ? TrendingUp : delta?.direction === "down" ? TrendingDown : Minus;
  const deltaColor = delta?.direction === "up"
    ? "text-emerald-700"
    : delta?.direction === "down"
      ? "text-amber-700"
      : "text-slate-500";

  return (
    <div className={cn(
      "relative overflow-hidden border border-slate-200 bg-white p-5 transition-shadow hover:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]",
      className,
    )}>
      <span aria-hidden="true" className={cn("absolute left-0 top-0 h-full w-[3px]", ACCENT_BG[accent])} />
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-500">{label}</p>
        {icon && <span className={cn("shrink-0", ACCENT_TEXT[accent])} aria-hidden="true">{icon}</span>}
      </div>
      <p className="mt-3 font-serif text-[30px] font-medium leading-none tracking-tight tabular-nums text-slate-900">
        {value}
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {context && <span className="text-[11.5px] text-slate-500">{context}</span>}
        {delta && (
          <span className={cn("flex items-center gap-1 text-[11px] font-semibold tabular-nums", deltaColor)}>
            <DeltaIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            {delta.direction === "down" ? "−" : delta.direction === "up" ? "+" : ""}{Math.abs(delta.value)}%
          </span>
        )}
      </div>
      {sparkline && <Sparkline data={sparkline} accent={accent} />}
    </div>
  );
}
