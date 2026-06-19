import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  type: string;
}

interface Props {
  logs: ActivityLog[];
}

export default function SecurityAndAuditPanel({ logs }: Props) {
  const getLogColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'create':
        return 'text-emerald-600';
      case 'update':
        return 'text-indigo-600';
      case 'delete':
        return 'text-red-600';
      default:
        return 'text-slate-500';
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
      
      {/* PROTOKOL KEAMANAN (KIRI) */}
      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-500" />
          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
            PROTOKOL KEAMANAN VALIDASI & PENGAMANAN DATA
          </h4>
        </div>
        
        <div className="space-y-4 text-[11px] text-slate-700 dark:text-gray-300 leading-relaxed">
          <p className="font-medium text-slate-800 dark:text-gray-200">
            Sistem turnamen dibentengi dengan kerangka proteksi solid guna menjamin netralitas data input:
          </p>
          
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong className="text-emerald-700 dark:text-emerald-500">XSS Safe-Zone:</strong> Semua elemen nama turnamen, deskripsi pelengkap, nama tim sponsor, dan e-mail dijalankan lewat runtime sanitizer string untuk mencegah injeksi kode binary.
            </li>
            <li>
              <strong className="text-emerald-700 dark:text-emerald-500">Strict Date Sequence Checklist:</strong> Tanggal rilis turnamen diverifikasi secara algoritmik. Mengurangi resiko kelalaian logis seperti tanggal akhir turnamen yang mendahului tanggal mulai turnamen.
            </li>
            <li>
              <strong className="text-emerald-700 dark:text-emerald-500">Validation Seed Limitation:</strong> Nilai unggulan (seed) dibatasi ketat berkisar dinosaurus seed (1 s/d 64) guna menjaga kejujuran struktur turnamen resmi.
            </li>
          </ul>
        </div>
      </div>

      {/* LOG AUDIT (KANAN) */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 md:p-6 shadow-sm flex flex-col h-full max-h-[350px]">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600 dark:text-gray-400" />
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-gray-200 uppercase tracking-widest">
              LOG AUDIT OPERASI TURNAMEN
            </h4>
          </div>
          <span className="text-[9px] font-extrabold bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded uppercase tracking-widest">
            LIVE AUDITS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-gray-500 text-[10px]">
              Belum ada log aktivitas sesi ini.
            </div>
          ) : (
            [...logs].reverse().map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 text-[10px]">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono text-slate-400 dark:text-gray-500 shrink-0 mt-0.5">
                    {formatTime(log.timestamp)}
                  </span>
                  <p className="text-slate-600 dark:text-gray-400 truncate w-full" title={log.action}>
                    {log.action}
                  </p>
                </div>
                <span className={`font-extrabold uppercase shrink-0 ${getLogColor(log.type)}`}>
                  {log.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
