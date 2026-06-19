/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActivityLog } from '@/app/admin/users/types';
import { Terminal, Clock, RefreshCw, PlusCircle, Trash, ToggleLeft } from 'lucide-react';

interface ActivityLogsProps {
  logs: ActivityLog[];
  onClear: () => void;
}

export default function ActivityLogs({ logs, onClear }: ActivityLogsProps) {
  
  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'create':
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'update':
        return <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />;
      case 'delete':
        return <Trash className="w-3.5 h-3.5 text-red-600" />;
      case 'status_toggle':
        return <ToggleLeft className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  const getLogBadgeStyle = (type: ActivityLog['type']) => {
    switch (type) {
      case 'create':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'update':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'delete':
        return 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'status_toggle':
        return 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    }
    return 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div 
      id="activity-logs-panel"
      className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col max-h-[350px]"
    >
      <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500 dark:text-gray-400" />
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">LOG AKTIVITAS SESI</h4>
        </div>
        {logs.length > 0 && (
          <button
            id="clear-logs-btn"
            onClick={onClear}
            className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-all cursor-pointer uppercase tracking-wider"
          >
            Bersihkan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 dark:text-gray-600" />
            <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">Belum ada aktivitas di sesi ini.</p>
          </div>
        ) : (
          [...logs].reverse().map((log) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 transition-all text-xs"
            >
              <div className={`p-2 rounded-lg shrink-0 ${getLogBadgeStyle(log.type)}`}>
                {getLogIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 dark:text-gray-300 leading-normal font-medium">{log.action}</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 dark:text-gray-500 font-mono">
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
