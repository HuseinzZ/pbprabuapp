"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";

interface ExportDropdownProps {
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  disabled?: boolean;
}

export default function ExportButtons({ onExportCSV, onExportPDF, disabled }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block print:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="w-3.5 h-3.5" />
        Download Laporan
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black/5 dark:ring-white/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {onExportCSV && (
            <button
              onClick={() => { onExportCSV(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
              Download CSV
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={() => { onExportPDF(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-t border-gray-100 dark:border-gray-800"
            >
              <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
              Download PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
