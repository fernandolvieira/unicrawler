/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal, Trash2, Cpu, FileClock } from 'lucide-react';
import { CrawlerLog } from '../types';

interface ConsoleLogsProps {
  logs: CrawlerLog[];
  onClearLogs: () => void;
}

export default function ConsoleLogs({ logs, onClearLogs }: ConsoleLogsProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[280px]">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950/75 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center relative">
            <span className="absolute animate-ping inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <Terminal className="w-4 h-4 text-emerald-400 relative" />
          </div>
          <span className="font-mono text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
            Console do Robô Crawl-Excavator 
            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono lower">v3.5l</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[10px] text-emerald-400 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI ENGINE ACTIVE</span>
          </div>
          <button
            onClick={onClearLogs}
            className="p-1 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer border border-slate-800"
            title="Limpar logs"
            type="button"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950/40">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 italic space-y-1">
            <FileClock className="w-8 h-8 opacity-40 mb-1" />
            <p>O console do robô está vazio.</p>
            <p className="text-[11px] opacity-70">Dispare uma escavação em algum vestibular para assistir o crawler operar em tempo real.</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const timestampStr = new Date(log.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            // Level styles
            let textClass = 'text-slate-300';
            let badgeClass = 'bg-slate-800 text-slate-400';
            let label = 'SYS';

            if (log.level === 'success') {
              textClass = 'text-emerald-400';
              badgeClass = 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40';
              label = 'OK';
            } else if (log.level === 'warn') {
              textClass = 'text-amber-400';
              badgeClass = 'bg-amber-950/50 text-amber-400 border border-amber-900/40';
              label = 'WARN';
            } else if (log.level === 'error') {
              textClass = 'text-rose-400';
              badgeClass = 'bg-rose-950/50 text-rose-400 border border-rose-900/40';
              label = 'FAIL';
            } else if (log.level === 'info') {
              textClass = 'text-sky-300';
              badgeClass = 'bg-sky-950/50 text-sky-400 border border-sky-800/40';
              label = 'INFO';
            }

            return (
              <div 
                key={index} 
                className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1 rounded transition"
              >
                {/* Timestamp */}
                <span className="text-slate-500 select-none flex-shrink-0">[{timestampStr}]</span>
                
                {/* Status Code badge */}
                <span className={`px-1 rounded text-[9px] font-bold tracking-wider flex-shrink-0 ${badgeClass}`}>
                  {label}
                </span>

                {/* Msg text */}
                <span className={`leading-relaxed whitespace-pre-wrap break-all ${textClass}`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
