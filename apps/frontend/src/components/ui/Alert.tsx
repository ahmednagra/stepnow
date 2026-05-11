// src/components/ui/Alert.tsx
import { type HTMLAttributes, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/utils/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: AlertTone;
  title?: ReactNode;
  icon?: ReactNode;
}

const TONES: Record<AlertTone, { container: string; iconColor: string; defaultIcon: ReactNode }> = {
  info: {
    container: "bg-cream border-line text-ink",
    iconColor: "text-mute",
    defaultIcon: <Info className="h-5 w-5" aria-hidden="true" />,
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-900",
    iconColor: "text-green-600",
    defaultIcon: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-900",
    iconColor: "text-yellow-700",
    defaultIcon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
  },
  danger: {
    container: "bg-red-50 border-red-200 text-red-900",
    iconColor: "text-red-700",
    defaultIcon: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
  },
};

export function Alert({
  tone = "info",
  title,
  icon,
  className,
  children,
  role = "status",
  ...rest
}: AlertProps) {
  const { container, iconColor, defaultIcon } = TONES[tone];
  return (
    <div
      role={role}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      className={cn("flex items-start gap-3 border px-4 py-3 text-sm", container, className)}
      {...rest}
    >
      <span className={cn("mt-0.5 shrink-0", iconColor)}>{icon ?? defaultIcon}</span>
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-1" : ""}>{children}</div>}
      </div>
    </div>
  );
}
