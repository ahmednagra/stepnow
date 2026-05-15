// apps/frontend/src/components/admin/dashboard/ServiceMixDonut.tsx
// Service mix donut. Memoised; redraws only when slices change.

"use client";

import { useEffect, useRef, memo } from "react";
import { Chart, DoughnutController, ArcElement, Tooltip } from "chart.js";

Chart.register(DoughnutController, ArcElement, Tooltip);

export interface MixSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: MixSlice[];
  height?: number;
}

function ServiceMixDonutBase({ slices, height = 180 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: slices.map((s) => s.label),
        datasets: [{
          data: slices.map((s) => s.value),
          backgroundColor: slices.map((s) => s.color),
          borderColor: "#fff",
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0F1115",
            titleColor: "#F5F2EC",
            bodyColor: "#F5F2EC",
            borderColor: "#A8865A",
            borderWidth: 1,
            cornerRadius: 0,
            padding: 10,
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [slices]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={ref} role="img" aria-label="Donut chart of bookings by service category">
        Bookings split by service category.
      </canvas>
    </div>
  );
}

export const ServiceMixDonut = memo(ServiceMixDonutBase);
