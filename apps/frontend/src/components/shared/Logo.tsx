// src/components/shared/Logo.tsx

import Image from "next/image";
import { cn } from "@/utils/cn";

interface LogoProps {
    height?: number;
    priority?: boolean;
    className?: string;
    }

const ASPECT = 1052 / 364; // width / height of the source lockup

export function Logo({ height = 32, priority = false, className }: LogoProps) {
  const width = Math.round(height * ASPECT);
  return (
    <Image
      src="/brand/logo.png"
      alt="StepNow — Taxi-Alternative"
      width={width}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      className={cn("h-auto w-auto", className)}
      style={{ height, width: "auto" }}
    />
  );
}
