import React from 'react';
import { GalleryActivityLog } from '@/app/admin/gallery/types';
import { 
  Terminal, Clock, PlusCircle, RefreshCw, Trash2, Shield 
} from 'lucide-react';

interface ActivityLogsProps {
  logs: GalleryActivityLog[];
  onClear: () => void;
}

export default function ActivityLogs({ logs, onClear }: ActivityLogsProps) {
  
  const getLogIcon = (type: GalleryActivityLog['type']) => {
    switch (type) {
      case 'create':
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'update':
        return <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />;
      case 'delete':
        return <Trash2 className="w-3.5 h-3.5 text-red-600" />;
      case 'access_toggle':
        return <Shield className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  const getLogBadgeStyle = (type: GalleryActivityLog['type']) => {
    return 'bg-slate-100 border border-slate-200';
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div 
      id="activity-logs-panel"
      className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col max-h-[350px]"
    >
      <div className="p-4 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500 dark:text-gray-400" />
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">LOG AKTIVITAS GALERI</h4>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] font-bold text-red-650 hover:text-red-700 hover:underline transition-all cursor-pointer uppercase tracking-wider"
          >
            Bersihkan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-gray-500 space-y-1.5">
            <Clock className="w-5 h-5 mx-auto opacity-40 animate-pulse" />
            <p className="text-xs font-medium">Belum ada aktivitas terekam.</p>
          </div>
        ) : (
          [...logs].reverse().map((log) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 p-3 rounded bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 transition-all text-xs"
            >
              <div className={`p-1.5 rounded shrink-0 ${getLogBadgeStyle(log.type)} dark:bg-gray-800 dark:border-gray-700`}>
                {getLogIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 dark:text-gray-300 leading-normal font-medium">{log.action}</p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 dark:text-gray-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(log.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
