import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Turnamen – PB Prabu Bandung",
};

const tournaments = [
  {
    id: 1,
    name: "Open Tournament Seri A",
    category: "Ganda Putra / Ganda Putri",
    status: "Pendaftaran Dibuka",
    statusStyle: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    date: "15 Juli 2026",
    deadline: "10 Juli 2026",
    participants: "32/64 Pasang",
    fee: "Rp 150.000",
    registered: false,
  },
  {
    id: 2,
    name: "Prabu Cup Seri B",
    category: "Tunggal Putra / Tunggal Putri",
    status: "Terdaftar",
    statusStyle: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
    date: "22 Juli 2026",
    deadline: "17 Juli 2026",
    participants: "48/64 Pemain",
    fee: "Rp 100.000",
    registered: true,
  },
  {
    id: 3,
    name: "Ganda Campuran Prabu",
    category: "Ganda Campuran",
    status: "Sedang Berlangsung",
    statusStyle: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    date: "10 Juni 2026",
    deadline: "-",
    participants: "24/24 Pasang",
    fee: "Rp 200.000",
    registered: true,
  },
  {
    id: 4,
    name: "Turnamen Junior",
    category: "U-17 Tunggal",
    status: "Selesai",
    statusStyle: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    date: "1 Juni 2026",
    deadline: "-",
    participants: "32/32",
    fee: "Rp 75.000",
    registered: true,
  },
];

export default function UserTournamentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Turnamen</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Lihat dan daftar turnamen yang tersedia.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {["Semua", "Aktif", "Terdaftar", "Selesai"].map((f) => (
          <button
            key={f}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              f === "Semua"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.name}</h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${t.statusStyle}`}>
                {t.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.category}</p>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400 mb-5">
              <div>
                <span className="block text-gray-400 mb-0.5">Tanggal</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t.date}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-0.5">Deadline</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t.deadline}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-0.5">Peserta</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t.participants}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-0.5">Biaya</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t.fee}</span>
              </div>
            </div>

            {t.registered ? (
              <button
                disabled
                className="w-full h-10 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              >
                {t.status === "Selesai" ? "Selesai" : "Sudah Terdaftar"}
              </button>
            ) : (
              <button className="w-full h-10 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition">
                Daftar Sekarang
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
