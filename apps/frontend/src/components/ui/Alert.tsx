// apps/frontend/src/components/ui/Alert.tsx
// Phase 3d polish — refined alert primitive with hairline accent and inline
// icon. Tones: info, success, warn, danger.

import { Info, CheckCircle2, AlertTriangle, OctagonAlert } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export type AlertTone = "info" | "success" | "warn" | "danger";

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
}

const TONES: Record<AlertTone, { wrap: string; Icon: typeof Info }> = {
  info: { wrap: "bg-paper border-line text-ink", Icon: Info },
  success: { wrap: "bg-success/5 border-success/30 text-mute-strong", Icon: CheckCircle2 },
  warn: { wrap: "bg-warn/5 border-warn/30 text-mute-strong", Icon: AlertTriangle },
  danger: { wrap: "bg-danger/5 border-danger/30 text-mute-strong", Icon: OctagonAlert },
};

export function Alert({ tone = "info", title, children, className, ...rest }: AlertProps) {
  const { wrap, Icon } = TONES[tone];
  return (
    <div
      role={tone === "danger" || tone === "warn" ? "alert" : undefined}
      className={cn("flex items-start gap-3 border p-4", wrap, className)}
      {...rest}
    >
      <Icon aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 text-[14px] leading-relaxed">
        {title && <p className="font-medium text-ink">{title}</p>}
        {children && <div className={cn(title ? "mt-1 text-mute" : "")}>{children}</div>}
      </div>
    </div>
  );
}
