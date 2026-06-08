"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─── Hook: detect dark mode from html.dark class ──────────────────────────────
function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// ─── Shared theme tokens ───────────────────────────────────────────────────────
function getThemeTokens(dark: boolean) {
  return {
    textColor: dark ? "#9ca3af" : "#6b7280",
    gridColor: dark ? "#1f2937" : "#f3f4f6",
    valueColor: dark ? "#f9fafb" : "#111827",
    bg: "transparent",
    apexTheme: dark ? ("dark" as const) : ("light" as const),
  };
}

// ─── Match Status Donut ────────────────────────────────────────────────────────
interface MatchStatusDonutProps {
  scheduled: number;
  ongoing: number;
  completed: number;
}

export function MatchStatusDonut({ scheduled, ongoing, completed }: MatchStatusDonutProps) {
  const dark = useDarkMode();
  const t = getThemeTokens(dark);
  const total = scheduled + ongoing + completed;
  const series = [completed, ongoing, scheduled];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      background: t.bg,
      animations: { enabled: true, speed: 600 },
    },
    labels: ["Selesai", "Berlangsung", "Dijadwalkan"],
    colors: ["#22c55e", "#f59e0b", "#6366f1"],
    legend: {
      position: "bottom",
      fontSize: "12px",
      labels: { colors: [t.textColor, t.textColor, t.textColor] },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "13px",
              color: t.textColor,
              formatter: () => String(total),
            },
            value: { fontSize: "26px", fontWeight: "700", color: t.valueColor },
          },
        },
      },
    },
    stroke: { width: 0 },
    tooltip: { theme: t.apexTheme },
    theme: { mode: t.apexTheme },
  };

  return (
    <div className="w-full">
      <ReactApexChart type="donut" series={series} options={options} height={260} />
    </div>
  );
}

// ─── Top Players Bar Chart ─────────────────────────────────────────────────────
interface TopPlayersBarProps {
  names: string[];
  points: number[];
}

export function TopPlayersBar({ names, points }: TopPlayersBarProps) {
  const dark = useDarkMode();
  const t = getThemeTokens(dark);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      background: t.bg,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: "60%",
        distributed: true,
      },
    },
    colors: ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#4f46e5", "#7c3aed", "#6d28d9"],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val} pts`,
      style: { fontSize: "11px", colors: ["#fff"] },
      offsetX: -4,
    },
    xaxis: {
      categories: names,
      labels: { style: { colors: Array(names.length).fill(t.textColor), fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: Array(names.length).fill(t.textColor), fontSize: "11px" },
        maxWidth: 150,
      },
    },
    legend: { show: false },
    grid: {
      borderColor: t.gridColor,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    tooltip: { theme: t.apexTheme, y: { formatter: (val: number) => `${val} poin` } },
    theme: { mode: t.apexTheme },
  };

  return (
    <div className="w-full">
      <ReactApexChart
        type="bar"
        series={[{ name: "Poin", data: points }]}
        options={options}
        height={Math.max(220, names.length * 40)}
      />
    </div>
  );
}

// ─── Matches Per Day Area Chart ────────────────────────────────────────────────
interface MatchesPerDayLineProps {
  dates: string[];
  counts: number[];
}

export function MatchesPerDayLine({ dates, counts }: MatchesPerDayLineProps) {
  const dark = useDarkMode();
  const t = getThemeTokens(dark);

  const options: ApexOptions = {
    chart: {
      type: "area",
      background: t.bg,
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: dark ? 0.25 : 0.35,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    colors: ["#6366f1"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: dates,
      labels: {
        style: { colors: t.textColor, fontSize: "11px" },
        rotate: -30,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: t.textColor, fontSize: "11px" },
        formatter: (v: number) => String(Math.round(v)),
      },
      min: 0,
    },
    grid: { borderColor: t.gridColor, strokeDashArray: 4 },
    tooltip: { theme: t.apexTheme, y: { formatter: (v: number) => `${v} pertandingan` } },
    markers: { size: 3, colors: ["#6366f1"], strokeWidth: 0 },
    theme: { mode: t.apexTheme },
  };

  return (
    <div className="w-full">
      <ReactApexChart
        type="area"
        series={[{ name: "Pertandingan", data: counts }]}
        options={options}
        height={230}
      />
    </div>
  );
}
