"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trophy, Users, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface SpinWheelProps {
  items: { id: string; name: string }[];
  onWinner?: (winner: { id: string; name: string }) => void;
}

const COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
];

export default function SpinWheel({ items, onWinner }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null);

  const spinDuration = 5000; // ms

  const handleSpin = () => {
    if (items.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    // Calculate a random slice to land on
    const sliceAngle = 360 / items.length;
    const randomIndex = Math.floor(Math.random() * items.length);

    // We want the slice to land at the TOP (270 degrees in standard SVG math, or 0 degrees if we rotate the whole wheel so top is 0).
    // Let's assume the pointer is at the TOP (0 degrees or 270 degrees visually).
    // Actually, in CSS `rotate`, 0 deg means top if we start at top, but our SVG paths start at right (0 deg in math).
    // So the pointer is at the Right (90 deg visually). Let's put pointer at the right.
    // If pointer is at RIGHT, we want the center of the random slice to be at 0 degrees.
    // The center of slice i is `i * sliceAngle + sliceAngle / 2`.
    // We need to rotate by `360 * spins - (centerOfSlice)`.
    
    // We put the pointer at the TOP. In CSS `rotate`, rotating the container shifts things clockwise.
    // The SVG paths are drawn starting from the top (-90 degrees visually) and going clockwise.
    // Actually, let's write the SVG mathematically starting from top.

    const spins = 5 + Math.random() * 3; // 5 to 8 full spins
    const targetAngle = 360 * spins - (randomIndex * sliceAngle + sliceAngle / 2);

    setRotation((prev) => prev + targetAngle - (prev % 360));

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(items[randomIndex]);
      if (onWinner) onWinner(items[randomIndex]);
      toast.success(`Selamat kepada ${items[randomIndex].name}!`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }, spinDuration);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <Users className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Tidak ada peserta</p>
        <p className="text-xs mt-1 text-gray-400">
          Pilih turnamen dengan peserta terkonfirmasi untuk menggunakan Spin Wheel.
        </p>
      </div>
    );
  }

  // Draw the SVG slices
  const radius = 50;
  const cx = 50;
  const cy = 50;
  
  let currentAngle = -90; // Start at top
  const sliceAngle = 360 / items.length;

  const getCoordinatesForAngle = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  return (
    <div className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
      
      {/* The Wheel Container */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96">
        {/* Pointer (at top) */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-brand-500" />
        </div>

        {/* The SVG Wheel */}
        <div
          className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${spinDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`,
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {items.map((item, i) => {
              // Path calculation
              const startAngle = -90 + i * sliceAngle;
              const endAngle = startAngle + sliceAngle;
              
              const start = getCoordinatesForAngle(startAngle);
              const end = getCoordinatesForAngle(endAngle);
              const largeArcFlag = sliceAngle > 180 ? 1 : 0;

              // If it's a single item, draw a full circle
              if (items.length === 1) {
                return (
                  <circle
                    key={item.id}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={COLORS[i % COLORS.length]}
                  />
                );
              }

              const pathData = [
                `M ${cx} ${cy}`,
                `L ${start.x} ${start.y}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
                "Z",
              ].join(" ");

              // Label placement
              const textAngle = startAngle + sliceAngle / 2;
              const textPos = getCoordinatesForAngle(textAngle);
              // Move text inward a bit
              const labelRadius = 35;
              const labelRad = (textAngle * Math.PI) / 180;
              const lx = cx + labelRadius * Math.cos(labelRad);
              const ly = cy + labelRadius * Math.sin(labelRad);

              return (
                <g key={item.id}>
                  <path d={pathData} fill={COLORS[i % COLORS.length]} />
                  <text
                    x={lx}
                    y={ly}
                    fill="#ffffff"
                    fontSize={items.length > 20 ? "3" : "4"}
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${textAngle + 90}, ${lx}, ${ly})`}
                    className="drop-shadow-sm pointer-events-none"
                  >
                    {item.name.substring(0, items.length > 20 ? 10 : 15)}
                    {item.name.length > (items.length > 20 ? 10 : 15) ? "..." : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Center Dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-md z-10 border-2 border-brand-500" />
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={handleSpin}
          disabled={isSpinning || items.length === 0}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-base font-bold shadow-lg shadow-brand-500/30 transition-all hover:scale-105 active:scale-95 uppercase tracking-wide"
        >
          {isSpinning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Memutar...
            </>
          ) : (
            "Putar Roda!"
          )}
        </button>

        {winner && !isSpinning && (
          <div className="mt-4 px-6 py-4 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-center animate-in fade-in zoom-in duration-300">
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-1">
              Pemenang:
            </p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {winner.name}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
