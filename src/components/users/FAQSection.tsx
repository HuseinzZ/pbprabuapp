"use client";

import { useState } from "react";

const FAQData = [
  {
    question: "Siapa saja yang bisa mendaftar di PB Prabu Bandung?",
    answer:
      "Siapa saja yang memiliki minat dan passion terhadap olahraga badminton dapat mendaftar. Platform ini terbuka untuk semua kalangan, baik pemula maupun pemain berpengalaman yang ingin bergabung dalam komunitas dan turnamen.",
  },
  {
    question: "Apakah pendaftaran akun gratis?",
    answer:
      "Ya, pendaftaran akun di platform PB Prabu Bandung sepenuhnya gratis. Anda dapat melihat informasi turnamen, jadwal, dan galeri tanpa biaya. Untuk mengikuti turnamen tertentu, mungkin ada biaya pendaftaran yang bervariasi tergantung kategori.",
  },
  {
    question: "Bagaimana sistem ranking poin bekerja?",
    answer:
      "Poin dikumpulkan berdasarkan performa di setiap turnamen yang diikuti. Semakin tinggi pencapaian Anda (juara 1, 2, 3, dst.), semakin banyak poin yang Anda dapatkan. Total poin menentukan posisi Anda di leaderboard komunitas.",
  },
  {
    question: "Bagaimana cara mendaftar turnamen?",
    answer:
      "Setelah memiliki akun yang terverifikasi, masuk ke bagian Turnamen, pilih turnamen yang tersedia, pilih kategori yang sesuai, dan ikuti proses pendaftaran. Admin akan mengkonfirmasi pendaftaran Anda sebelum turnamen dimulai.",
  },
  {
    question: "Apakah ada fitur untuk melihat jadwal pertandingan secara langsung?",
    answer:
      "Ya! Platform ini dilengkapi kalender interaktif yang menampilkan seluruh jadwal pertandingan. Anda dapat menyaring berdasarkan turnamen, kategori, atau tanggal tertentu untuk memudahkan pemantauan.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white dark:bg-gray-900 w-full pt-8 lg:pt-12 pb-24 lg:pb-32">
      <div className="mx-auto w-11/12 px-4 md:w-4/5 lg:max-w-4xl">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            Ada Pertanyaan?
          </span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight md:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div className="space-y-3">
          {FAQData.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-indigo-500/30 bg-indigo-500/5"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-white/15"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  id={`faq-header-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-base font-semibold text-gray-900 dark:text-white pr-4">{item.question}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-indigo-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-header-${index}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
