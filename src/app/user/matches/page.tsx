import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pertandingan – PB Prabu Bandung",
};

const matches = [
  {
    id: 1,
    opponent: "Budi Raharjo",
    tournament: "Open Tournament Seri A",
    category: "Ganda Putra",
    date: "15 Juli 2026",
    time: "09:00 WIB",
    court: "Lapangan 2",
    status: "Akan Datang",
    result: null,
    score: null,
  },
  {
    id: 2,
    opponent: "Ahmad Sulaiman",
    tournament: "Prabu Cup Seri B",
    category: "Tunggal Putra",
    date: "22 Juli 2026",
    time: "14:00 WIB",
    court: "Lapangan 1",
    status: "Akan Datang",
    result: null,
    score: null,
  },
  {
    id: 3,
    opponent: "Deni Kusuma",
    tournament: "Prabu Cup Seri A",
    category: "Tunggal Putra",
    date: "5 Juni 2026",
    time: "10:00 WIB",
    court: "Lapangan 3",
    status: "Selesai",
    result: "Menang",
    score: "21-15, 21-18",
  },
  {
    id: 4,
    opponent: "Reza Pratama",
    tournament: "Open Tournament",
    category: "Tunggal Putra",
    date: "2 Juni 2026",
    time: "15:00 WIB",
    court: "Lapangan 1",
    status: "Selesai",
    result: "Menang",
    score: "21-19, 18-21, 21-17",
  },
  {
    id: 5,
    opponent: "Hendra Saputra",
    tournament: "Prabu Cup Seri A",
    category: "Tunggal Putra",
    date: "29 Mei 2026",
    time: "11:00 WIB",
    court: "Lapangan 2",
    status: "Selesai",
    result: "Kalah",
    score: "15-21, 12-21",
  },
];

export default function UserMatchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pertandingan</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Jadwal dan hasil pertandingan Anda.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["Semua", "Akan Datang", "Selesai"].map((f) => (
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

      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Status badge */}
              <div className="sm:w-28 shrink-0">
                {m.status === "Akan Datang" ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    Akan Datang
                  </span>
                ) : m.result === "Menang" ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Menang
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-900/30 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Kalah
                  </span>
                )}
              </div>

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  vs <span className="text-indigo-600 dark:text-indigo-400">{m.opponent}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {m.tournament} · {m.category}
                </p>
                {m.score && (
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                    Skor: <span className="text-indigo-600 dark:text-indigo-400">{m.score}</span>
                  </p>
                )}
              </div>

              {/* Date/Time */}
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.date}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {m.time}
                  {m.court && ` · ${m.court}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
