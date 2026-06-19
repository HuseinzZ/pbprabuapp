/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { WheelSegment } from "../types";

interface WheelCanvasProps {
  segments: WheelSegment[];
  rotation: number;
  isSpinning?: boolean;
  onSpinComplete?: (winningSegment: WheelSegment) => void;
  onManualDragStart?: () => void;
  onManualDragSpin?: (targetRotation: number, velocity: number) => void;
  soundEnabled?: boolean;
}

export default function WheelCanvas({
  segments,
  rotation,
  isSpinning = false,
  onSpinComplete,
  onManualDragStart,
  onManualDragSpin,
  soundEnabled = false,
}: WheelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartAngle = useRef(0);
  const dragStartRotation = useRef(0);
  const lastAngle = useRef(0);
  const lastTime = useRef(0);
  const angularVelocity = useRef(0);
  const dragTrack = useRef<{ angle: number; time: number }[]>([]);

  // Ticker physical animation state
  const [pointerOffset, setPointerOffset] = useState(0); // in degrees
  const lastTickAngle = useRef(0);

  const totalWeight = segments.reduce((acc, s) => acc + s.weight, 0);

  // Play synthetic Mechanical click sound
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle";
      // High frequency pitch decay simulating standard ticker pin clicks
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (err) {
      // Ignored if browser blocks audio
    }
  };

  // Keep track of ticked segments as rotation advances.
  // We trigger a pointer visual flex and click sound when passing segment borders.
  useEffect(() => {
    if (segments.length === 0) return;

    // Center point of pointer is at top (-90 degrees, or 270 degrees)
    // To make calculations absolute, let's normalize the rotation value
    const normalizedRotation = rotation % 360;
    
    // Find current angular boundaries to check if a border crossed
    const totalSegments = segments.length;
    const sizePerSegment = 360 / totalSegments;

    // Let's compute which segment is currently directly at the pointer (-90 degrees relative to wheel top)
    // Formula: pointer position is at angle = -90. If wheel is rotated by R,
    // the slice at top starts at: (270 - R) % 360
    const pointerWheelAngle = (270 - normalizedRotation + 360) % 360;
    const currentSegmentIndex = Math.floor(pointerWheelAngle / sizePerSegment) % totalSegments;
    
    // Trigger tick sound if the current slice border is crossed
    if (Math.abs(rotation - lastTickAngle.current) >= sizePerSegment) {
      playTickSound();
      
      // Physical tick animation (spring wiggle)
      setPointerOffset(-15); // tilt in opposite direction of spin (spinning clock-wise vs counter-wise)
      setTimeout(() => setPointerOffset(0), 60);

      lastTickAngle.current = rotation;
    }
  }, [rotation, segments.length, soundEnabled]);

  // Helper: Get angle of contact relative to center of SVG element
  const getAngle = (clientX: number, clientY: number): number | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    // Angle in degrees from -180 to 180
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (isSpinning) return; // Prevent interference when actively spinning automatically
    const angle = getAngle(clientX, clientY);
    if (angle === null) return;

    setIsDragging(true);
    if (onManualDragStart) onManualDragStart();
    dragStartAngle.current = angle;
    dragStartRotation.current = rotation;
    lastAngle.current = angle;
    lastTime.current = Date.now();
    angularVelocity.current = 0;
    dragTrack.current = [{ angle, time: Date.now() }];
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const angle = getAngle(clientX, clientY);
    if (angle === null) return;

    const now = Date.now();
    // Compute angle difference relative to standard start
    let deltaAngle = angle - dragStartAngle.current;
    
    // Handle wrap-around transitions
    if (deltaAngle < -180) deltaAngle += 360;
    if (deltaAngle > 180) deltaAngle -= 360;

    const newRotation = dragStartRotation.current + deltaAngle;
    
    // Compute raw delta since last movement frame to calculate current velocity
    let frameDelta = angle - lastAngle.current;
    if (frameDelta < -180) frameDelta += 360;
    if (frameDelta > 180) frameDelta -= 360;

    const duration = now - lastTime.current;
    if (duration > 0) {
      angularVelocity.current = frameDelta / duration; // degrees per millisecond
    }

    // Keep track of moving touch points
    dragTrack.current.push({ angle, time: now });
    if (dragTrack.current.length > 5) {
      dragTrack.current.shift(); // keep sliding window of recent points
    }

    // Callback reporting manual drag position
    if (onManualDragSpin) onManualDragSpin(newRotation, angularVelocity.current);

    lastAngle.current = angle;
    lastTime.current = now;
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Calculate final velocity from sliding history window
    if (dragTrack.current.length >= 2) {
      const first = dragTrack.current[0];
      const last = dragTrack.current[dragTrack.current.length - 1];
      const timeDiff = last.time - first.time;
      if (timeDiff > 0) {
        let angleDiff = last.angle - first.angle;
        if (angleDiff < -180) angleDiff += 360;
        if (angleDiff > 180) angleDiff -= 360;

        const velocity = angleDiff / timeDiff; // degrees / ms
        const absVelocity = Math.abs(velocity);

        // Standard flick spin trigger if speed is sufficient
        if (absVelocity > 0.15) {
          // Trigger spin in swipe direction with scaling power
          const finalPower = Math.min(absVelocity * 3000, 7200); // Caps swipe spinning
          if (onManualDragSpin) onManualDragSpin(rotation + (velocity > 0 ? finalPower : -finalPower), velocity);
          return;
        }
      }
    }

    // Snaps cleanly to closest segment if swipe wasn't fast enough
    if (onManualDragSpin) onManualDragSpin(rotation, 0);
  };

  // Handle Event listeners to drag outside wheel bounding box nicely
  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    };

    const onGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    const onGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onGlobalTouchEnd = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    window.addEventListener("mousemove", onGlobalMouseMove, { passive: false });
    window.addEventListener("mouseup", onGlobalMouseUp);
    window.addEventListener("touchmove", onGlobalTouchMove, { passive: false });
    window.addEventListener("touchend", onGlobalTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
      window.removeEventListener("touchmove", onGlobalTouchMove);
      window.removeEventListener("touchend", onGlobalTouchEnd);
    };
  }, [isDragging, rotation]);

  // SVG Drawing Helpers
  const radius = 460;
  const cx = 500;
  const cy = 500;

  // Render SVG path representing slices
  const renderSlices = () => {
    let accumulatedAngle = 0;
    return segments.map((seg, i) => {
      const share = seg.weight / totalWeight;
      const angle = share * 360;
      
      const radStart = (accumulatedAngle * Math.PI) / 180;
      const radEnd = ((accumulatedAngle + angle) * Math.PI) / 180;

      // Outer point coordinates
      const x1 = cx + radius * Math.cos(radStart);
      const y1 = cy + radius * Math.sin(radStart);
      const x2 = cx + radius * Math.cos(radEnd);
      const y2 = cy + radius * Math.sin(radEnd);

      const largeArc = angle > 180 ? 1 : 0;

      // Draw SVG arc
      const pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        "Z"
      ].join(" ");

      const labelAngle = accumulatedAngle + angle / 2;

      accumulatedAngle += angle;

      return (
        <g key={seg.id} className="select-none pointer-events-none">
          {/* Inner slice bg */}
          <path
            d={pathData}
            fill={seg.color}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Text/Label layout inside slice - rotated outwards */}
          <g transform={`translate(${cx}, ${cy}) rotate(${labelAngle})`}>
            <text
              x={radius * 0.8}
              y={6}
              fill={seg.textColor}
              textAnchor="end"
              className="font-display font-bold select-none text-[32px] md:text-[36px]"
              style={{
                textShadow: "0px 1px 3px rgba(0,0,0,0.25)",
              }}
            >
              {seg.text}
            </text>
          </g>
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-sm sm:max-w-md md:max-w-lg aspect-square flex items-center justify-center p-3 select-none"
    >
      {/* Outer black circle background, shadow decoration, and glowing frame - matches size perfectly using absolute inset-3 */}
      <div className="absolute inset-3 rounded-full bg-slate-950 border border-slate-800/80 shadow-[0_0_60px_rgba(59,130,246,0.12)] wheel-glow pointer-events-none" />

      {/* Main Wheel Wrapper with interactive cursor */}
      <div
        className={`w-full h-full relative cursor-grab active:cursor-grabbing transform transition-transform duration-75 select-none touch-none`}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        id="wheel-interaction-surface"
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          className="w-full h-full drop-shadow-2xl select-none"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "",
          }}
        >
          {/* Slices of wheel */}
          <g>{renderSlices()}</g>

          {/* Core Center hub decoration */}
          <circle cx={cx} cy={cy} r="65" fill="#FFFFFF" className="filter drop-shadow-lg" />
          <circle cx={cx} cy={cy} r="50" fill="#1e293b" />
          <circle cx={cx} cy={cy} r="25" fill="#6366f1" />
          <circle cx={cx} cy={cy} r="10" fill="#FFFFFF" />

          {/* Outer edge border dots (authentic look and glow) */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          {segments.map((_, i) => {
            const dotAngle = (i * (360 / segments.length) * Math.PI) / 180;
            const dotX = cx + radius * Math.cos(dotAngle);
            const dotXNum = dotX;
            const dotY = cy + radius * Math.sin(dotAngle);
            return (
              <circle
                key={i}
                cx={dotXNum}
                cy={dotY}
                r="10"
                fill="#ffffff"
                stroke="#475569"
                strokeWidth="2"
                className="filter drop-shadow-sm select-none"
              />
            );
          })}
        </svg>
      </div>

      {/* PHYSICALLY-REACTIVE TICKER/POINTER (Top absolute pinned) */}
      <div
        className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none transition-transform duration-75"
        style={{
          transform: `translateX(-50%) rotate(${pointerOffset}deg)`,
          transformOrigin: "top center",
        }}
        id="wheel-picker-indicator"
      >
        <svg
          width="48"
          height="64"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-md"
        >
          {/* Outer Chrome bezel */}
          <path
            d="M50 120 L10 40 A 40 40 0 0 1 90 40 Z"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinejoin="bevel"
          />
          {/* Inner elegant core */}
          <path d="M50 100 L25 45 A 25 25 0 0 1 75 45 Z" fill="#b91c1c" />
          {/* Sparkle highlight */}
          <circle cx="50" cy="40" r="15" fill="#fca5a5" opacity="0.8" />
          <circle cx="50" cy="15" r="8" fill="#1e293b" />
        </svg>
      </div>
    </div>
  );
}
