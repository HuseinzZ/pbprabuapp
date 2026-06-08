/**
 * Export utilities — CSV & PDF (print) untuk halaman admin PB Prabu
 */

import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

/** Download data sebagai file CSV */
export function exportCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const bom = "\uFEFF";
  const csv =
    bom +
    [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 
 * Export elemen HTML menjadi PDF secara otomatis
 * @param elementId ID dari elemen HTML yang akan dirender (misal 'print-pemain')
 * @param filename Nama file PDF (misal 'Laporan Pemain.pdf')
 */
export async function exportPDF(elementId: string, filename: string = "download.pdf") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemen dengan ID ${elementId} tidak ditemukan.`);
    return;
  }

  // Hapus class hidden sementara agar html2canvas bisa merendernya
  const hasHiddenClass = element.classList.contains("hidden");
  if (hasHiddenClass) {
    element.classList.remove("hidden");
  }

  const originalCssText = element.style.cssText;
  // Set position fixed to escape any parent overflow constraints during render
  element.style.cssText += "position: fixed !important; top: 0 !important; left: 0 !important; z-index: -9999 !important;";

  try {
    const imgData = await toPng(element, { 
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("Gagal membuat PDF:", error);
  } finally {
    // Kembalikan class hidden dan style awal
    if (hasHiddenClass) {
      element.classList.add("hidden");
    }
    element.style.cssText = originalCssText;
  }
}
