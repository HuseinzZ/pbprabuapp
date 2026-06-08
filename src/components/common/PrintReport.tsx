"use client";

import React from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PrintColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface PrintGroup {
  /** Nama kelompok / kategori (misal: "Utama", "Grup A") */
  name: string;
  rows: Record<string, string | number | null | undefined>[];
  /** Label subtotal. Jika undefined, tidak tampil subtotal */
  subtotalCells?: Partial<Record<string, string | number>>;
}

export interface PrintReportProps {
  /** Judul laporan utama */
  title: string;
  /** Subjudul (misal: rentang tanggal / nama turnamen) */
  subtitle?: string;
  /** Nama organisasi */
  orgName?: string;
  /** Kolom tabel */
  columns: PrintColumn[];
  /** Data yang sudah dikelompokkan */
  groups: PrintGroup[];
  /** Label grand total (misal: "Grand Total") */
  grandTotalLabel?: string;
  /** Nilai grand total per kolom */
  grandTotalCells?: Partial<Record<string, string | number>>;
  /** ID print section — harus unik per halaman */
  printId?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PrintReport({
  title,
  subtitle,
  orgName = "PB Prabu Bandung",
  columns,
  groups,
  grandTotalLabel,
  grandTotalCells,
  printId = "print-report",
}: PrintReportProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* ── Hidden on screen, visible on print ─────────────────────────── */}
      <div id={printId} className="hidden print:block w-[800px] max-w-none bg-white text-black p-12 mx-auto print:w-full print:m-0 print:p-0">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div suppressHydrationWarning style={{ fontSize: 11, color: "#555", textAlign: "left", marginBottom: 12 }}>
            {timeStr} &nbsp;&bull;&nbsp; {dateStr}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>
            {orgName}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e40af", marginBottom: 6 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 500 }}>{subtitle}</div>
          )}
        </div>

        <hr style={{ borderTop: "1.5px solid #ddd", margin: "12px 0 20px" }} />

        {/* Groups */}
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 24, breakInside: "avoid" }}>
            {/* Group title */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#1e40af",
                marginBottom: 4,
                paddingBottom: 3,
                borderBottom: "1px solid #93c5fd",
              }}
            >
              {group.name}
            </div>

            {/* Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
                padding: 3,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        textAlign: col.align || "left",
                        padding: "5px 8px",
                        border: "1px solid #cbd5e1",
                        fontWeight: 700,
                        color: "#374151",
                        whiteSpace: "nowrap",
                        width: col.width,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{ backgroundColor: ri % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align || "left",
                          padding: "4px 8px",
                          border: "1px solid #e2e8f0",
                          color: "#1f2937",
                        }}
                      >
                        {row[col.key] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* Subtotal row */}
              {group.subtotalCells && (
                <tfoot>
                  <tr style={{ backgroundColor: "#e2e8f0" }}>
                    {columns.map((col, ci) => {
                      const val = group.subtotalCells![col.key];
                      const isFirst = ci === 0;
                      return (
                        <td
                          key={col.key}
                          style={{
                            textAlign: col.align || (isFirst ? "right" : "left"),
                            padding: "5px 8px",
                            border: "1px solid #cbd5e1",
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {isFirst ? "Total" : val !== undefined ? val : ""}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ))}

        {/* Grand Total */}
        {/* {grandTotalCells && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11,
              marginTop: 8,
              breakInside: "avoid"
            }}
          >
            <tbody>
              <tr style={{ backgroundColor: "#dbeafe" }}>
                {columns.map((col, ci) => {
                  const val = grandTotalCells![col.key];
                  return (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align || (ci === 0 ? "right" : "left"),
                        padding: "6px 8px",
                        border: "1px solid #93c5fd",
                        fontWeight: 800,
                        color: "#1e3a8a",
                      }}
                    >
                      {ci === 0 ? (grandTotalLabel || "Grand Total :") : val !== undefined ? val : ""}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        )} */}

        {/* Footer */}
        {/* <div
          style={{
            marginTop: 32,
            paddingTop: 8,
            borderTop: "1px solid #e5e7eb",
            fontSize: 10,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Dicetak pada {dateStr} pukul {timeStr} &mdash; {orgName}
        </div> */}
      </div>

      {/* ── Print CSS ──────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          /* Tampilkan hanya print section */
          body {
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1cm; size: A4; }
          
          /* Hide Sidebar and other layout elements that usually have sidebar class or specific tags */
          aside, header, nav, footer, [data-sidebar], [class*="sidebar"] {
            display: none !important;
          }
          
          /* To ensure main content takes full width */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
        }
      `}</style>
    </>
  );
}
