"use client";
import React, { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Indonesian } from "flatpickr/dist/l10n/id.js";

interface DatePickerProps {
  id?: string;
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  maxDate?: string;
  className?: string;
}

const INPUT_CLASS = "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  maxDate,
  className,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    fpRef.current = flatpickr(inputRef.current, {
      locale: Indonesian,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d F Y",
      altInputClass: className || INPUT_CLASS,
      defaultDate: value || undefined,
      maxDate,
      allowInput: false,
      disableMobile: true,
      onChange: (selectedDates) => {
        if (selectedDates[0]) {
          const y = selectedDates[0].getFullYear();
          const m = String(selectedDates[0].getMonth() + 1).padStart(2, "0");
          const d = String(selectedDates[0].getDate()).padStart(2, "0");
          onChange?.(`${y}-${m}-${d}`);
        }
      },
    });

    return () => {
      fpRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (fpRef.current && value) {
      fpRef.current.setDate(value, false);
    }
  }, [value]);

  return (
    <div className="relative w-full">
      {/* Input asli — flatpickr akan menyembunyikannya dan menampilkan altInput */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        readOnly
        placeholder={placeholder}
        className="hidden"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </span>
    </div>
  );
}
