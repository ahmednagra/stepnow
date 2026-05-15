// apps/frontend/src/components/admin/dashboard/RevenueChart.tsx
// Isolated client component: Chart.js bar+line combo. Re-renders only on prop change.

"use client";

import { useEffect, useRef, memo } from "react";
import {
  Chart, BarController, LineController, BarElement, PointElement, LineElement,
  CategoryScale, LinearScale, Tooltip, Filler,
} from "chart.js";

Chart.register(BarController, LineController, BarElement, PointElement, LineElement, CategoryScale, LinearScale, Tooltip, Filler);

export interface RevenuePoint {
  label: string;
  bookings: number;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenuePoint[];
  height?: number;
}

function RevenueChartBase({ data, height = 260 }: RevenueChartProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            type: "bar" as const,
            label: "Bookings",
            data: data.map((d) => d.bookings),
            backgroundColor: "#A8865A",
            borderRadius: 0,
            yAxisID: "y1",
            barPercentage: 0.55,
            categoryPercentage: 0.85,
          },
          {
            type: "line" as const,
            label: "Revenue",
            data: data.map((d) => d.revenue),
            borderColor: "#0F1115",
            backgroundColor: "rgba(15,17,21,0.04)",
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: "#0F1115",
            yAxisID: "y",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0F1115",
            titleColor: "#F5F2EC",
            bodyColor: "#F5F2EC",
            borderColor: "#A8865A",
            borderWidth: 1,
            padding: 10,
            cornerRadius: 0,
            titleFont: { size: 11, weight: 600 },
            bodyFont: { size: 12 },
            callbacks: {
              label: (ctx) => ctx.dataset.label === "Revenue"
                ? `  Revenue  €${Number(ctx.parsed.y).toLocaleString()}`
                : `  Bookings  ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8, font: { size: 10 }, color: "#9A968D" },
            border: { color: "#EAE7E0" },
          },
          y: {
            position: "left",
            grid: { color: "#F0EDE5", drawTicks: false },
            ticks: {
              font: { size: 10 }, color: "#9A968D",
              callback: (v) => "€" + (Number(v) / 1000).toFixed(1) + "k",
            },
            border: { display: false },
          },
          y1: {
            position: "right",
            grid: { display: false },
            ticks: { font: { size: 10 }, color: "#9A968D" },
            border: { display: false },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [data]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={ref} role="img" aria-label="Bar and line chart of revenue and bookings">
        Revenue and bookings trend over the selected period.
      </canvas>
    </div>
  );
}

export const RevenueChart = memo(RevenueChartBase);
