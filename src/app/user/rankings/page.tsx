import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranking – PB Prabu Bandung",
};

const rankings = [
  { rank: 1, name: "Ahmad Sulaiman", category: "Tunggal Putra", points: 2480, wins: 24, losses: 3 },
  { rank: 2, name: "Budi Raharjo", category: "Ganda Putra", points: 2310, wins: 22, losses: 5 },
  { rank: 3, name: "Citra Nurdiani", category: "Tunggal Putri", points: 2150, wins: 20, losses: 4 },
  { rank: 4, name: "Deni Kusuma", category: "Ganda Putra", points: 1980, wins: 19, losses: 6 },
  { rank: 5, name: "Eka Putra", category: "Tunggal Putra", points: 1860, wins: 17, losses: 7 },
  { rank: 6, name: "Fitriani", category: "Tunggal Putri", points: 1740, wins: 16, losses: 6 },
  { rank: 7, name: "Gunawan", category: "Ganda Campuran", points: 1620, wins: 15, losses: 8 },
  { rank: 8, name: "Hendra Saputra", category: "Ganda Putra", points: 1520, wins: 14, losses: 7 },
  { rank: 9, name: "Indriani", category: "Ganda Putri", points: 1420, wins: 13, losses: 9 },
  { rank: 10, name: "Joko Santoso", category: "Tunggal Putra", points: 1380, wins: 13, losses: 10 },
  { rank: 11, name: "Kartini", category: "Ganda Putri", points: 1290, wins: 12, losses: 8 },
  { rank: 12, name: "Anda (Pengguna)", category: "Tunggal Putra", points: 1240, wins: 8, losses: 4, isCurrentUser: true },
];

export default function UserRankingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ranking Pemain</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Klasemen poin keseluruhan pemain PB Prabu Bandung.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {["Semua", "Tunggal Putra", "Tunggal Putri", "Ganda Putra", "Ganda Putri", "Ganda Campuran"].map((c) => (
          <button
            key={c}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              c === "Semua"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Rankings table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-14">
                  #
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pemain
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Kategori
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Poin
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Menang
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Kalah
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rankings.map((r) => (
                <tr
                  key={r.rank}
                  className={`transition-colors ${
                    r.isCurrentUser
                      ? "bg-indigo-50 dark:bg-indigo-900/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {r.rank <= 3 ? (
                        <span className="text-lg">
                          {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                          {r.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-semibold ${r.isCurrentUser ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                          {r.name}
                          {r.isCurrentUser && (
                            <span className="ml-2 text-xs font-normal text-indigo-500 dark:text-indigo-400">(Anda)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap hidden md:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{r.category}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{r.points.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right hidden sm:table-cell">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{r.wins}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right hidden sm:table-cell">
                    <span className="text-rose-500 dark:text-rose-400 font-medium">{r.losses}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
