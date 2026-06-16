/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Calendar, Flame, ChevronRight, Info, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UniversityExam, TimelineEvent } from '../types';

interface DeadlinesHeatmapProps {
  exams: UniversityExam[];
  filteredExams: UniversityExam[];
}

interface DeadlineItem {
  id: string; // combination of exam.id + event.id
  examId: string;
  universityAcronym: string;
  universityName: string;
  examName: string;
  state: 'SP' | 'RJ' | 'MG';
  category: 'federal' | 'estadual' | 'privada';
  eventLabel: string;
  dateStr: string;
  day: number;
  month: number; // 1-12
  year: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'critical';
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function DeadlinesHeatmap({ exams, filteredExams }: DeadlinesHeatmapProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'filtered'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1); // Select current month by default

  // Helper function to extract days, months and years from date string
  const parseDatesFromStr = (str: string): { day: number; month: number; year: number }[] => {
    const regex = /(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/g;
    const results: { day: number; month: number; year: number }[] = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const yearStr = match[3] ? match[3] : '2026'; // default to current system year
      let year = parseInt(yearStr);
      if (year < 100) year = 2000 + year;
      results.push({ day, month, year });
    }
    return results;
  };

  // Extract and process all registration deadlines based on selected filter mode
  const deadlines = useMemo<DeadlineItem[]>(() => {
    const targetExams = filterMode === 'all' ? exams : filteredExams;
    const items: DeadlineItem[] = [];

    targetExams.forEach(exam => {
      // Analyze timeline events to find registration-related ones
      exam.timeline.forEach(event => {
        const labelLower = event.label.toLowerCase();
        const detailsLower = (event.details || '').toLowerCase();
        
        // Define filters for registration dates/deadlines
        const isRegistration = 
          labelLower.includes('inscri') || 
          labelLower.includes('cadastro') || 
          labelLower.includes('matrícula') ||
          labelLower.includes('isenção') || 
          detailsLower.includes('inscri') ||
          detailsLower.includes('cadastro');

        if (isRegistration) {
          const parsed = parseDatesFromStr(event.dateStr);
          if (parsed.length > 0) {
            // For range dates (e.g. "10/05 to 15/06"), the deadline/limit is the last date
            // For single dates, it is the only parsed date
            const targetDate = parsed[parsed.length - 1];
            
            items.push({
              id: `${exam.id}-${event.id}`,
              examId: exam.id,
              universityAcronym: exam.universityAcronym,
              universityName: exam.universityName,
              examName: exam.examName,
              state: exam.state,
              category: exam.category,
              eventLabel: event.label,
              dateStr: event.dateStr,
              day: targetDate.day,
              month: targetDate.month,
              year: targetDate.year,
              status: event.status
            });
          }
        }
      });
    });

    // Sort by Month, Day, Year
    return items.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [exams, filteredExams, filterMode]);

  // Aggregate deadline counts by month (1 to 12)
  const monthStats = useMemo(() => {
    const counts = Array(13).fill(0); // index 1 to 12
    deadlines.forEach(d => {
      if (d.month >= 1 && d.month <= 12) {
        counts[d.month]++;
      }
    });

    const maxCount = Math.max(...counts, 1);

    return { counts, maxCount };
  }, [deadlines]);

  // Styling helper for heat intensity
  const getIntensityClass = (count: number, maxCount: number) => {
    if (count === 0) {
      return 'bg-slate-950/40 border-slate-900/60 text-slate-500 hover:border-slate-800';
    }
    
    const percentage = count / maxCount;
    
    if (percentage <= 0.3) {
      // Low concentration
      return 'bg-rose-950/15 border-rose-900/25 text-rose-300/90 hover:bg-rose-950/25 hover:border-rose-900/40';
    } else if (percentage <= 0.6) {
      // Medium concentration
      return 'bg-red-950/35 border-red-900/40 text-red-300 hover:bg-red-950/50 hover:border-red-900/60';
    } else {
      // High concentration (Hot!)
      return 'bg-red-900/40 border-red-500/35 text-white shadow-lg shadow-red-950/20 hover:bg-red-900/65 hover:border-red-500/60';
    }
  };

  // Get active items in the clicked month
  const activeMonthDeadlines = useMemo(() => {
    if (!selectedMonth) return [];
    return deadlines.filter(d => d.month === selectedMonth);
  }, [deadlines, selectedMonth]);

  // Config per state badges
  const getStateColor = (state: 'SP' | 'RJ' | 'MG') => {
    switch (state) {
      case 'SP': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'RJ': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'MG': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div id="deadlines-heatmap" className="bg-[#151518]/90 border border-red-950/15 rounded-3xl p-6 shadow-xl space-y-6 bento-glow-crimson relative overflow-hidden">
      
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-950/[0.04] rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header section with toggle and summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
            <span className="p-1 px-1.5 bg-brand-red/10 text-brand-red rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
            <span>Calendário de Prazos de Inscrição</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Visualização de densidade por meses para organizar vestibulares e datas-limite
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex bg-slate-950 p-1 border border-slate-800/80 rounded-xl max-w-fit">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
              filterMode === 'all' 
                ? 'bg-brand-red text-white' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Todos os Editais
          </button>
          <button
            onClick={() => setFilterMode('filtered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
              filterMode === 'filtered' 
                ? 'bg-brand-red text-white' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Filtros Ativos
          </button>
        </div>
      </div>

      {/* Interactive 12-Month Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {MONTH_NAMES.map((name, index) => {
          const monthNum = index + 1;
          const count = monthStats.counts[monthNum] || 0;
          const isSelected = selectedMonth === monthNum;
          const intensityClass = getIntensityClass(count, monthStats.maxCount);

          return (
            <button
              key={name}
              onClick={() => setSelectedMonth(selectedMonth === monthNum ? null : monthNum)}
              className={`p-3.5 border rounded-2xl flex flex-col items-center justify-between gap-1.5 text-center transition-all duration-300 relative cursor-pointer group ${intensityClass} ${
                isSelected 
                  ? 'ring-2 ring-brand-red/50 scale-[1.03] border-brand-red/70 shadow-lg shadow-red-950/30' 
                  : 'hover:scale-[1.01]'
              }`}
              type="button"
            >
              {/* Highlight flame for highly concentrated months */}
              {count > 0 && count >= monthStats.maxCount * 0.7 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-[9px] font-black px-1.5 py-0.5 rounded-full text-white flex items-center gap-0.5 shadow-md animate-pulse">
                  <Flame className="w-2.5 h-2.5 fill-white" />
                  QUENTE
                </span>
              )}

              <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75 group-hover:opacity-100">
                {name.substring(0, 3)}
              </span>

              <span className="text-xl font-black block leading-none">
                {count}
              </span>

              <span className="text-[9px] font-medium opacity-60 block truncate">
                {count === 1 ? 'prazo ativo' : 'prazos ativos'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Month Timeline Details */}
      <AnimatePresence mode="wait">
        {selectedMonth && (
          <motion.div
            key={`details-${selectedMonth}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-800/60 pt-5 mt-3"
          >
            <div className="bg-slate-950/40 border border-slate-800/70 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-brand-red/15 text-brand-red px-2 py-0.5 rounded-md">
                    {MONTH_NAMES[selectedMonth - 1].toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Prazos Finais &amp; Encerradores de Inscrição
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {activeMonthDeadlines.length} {activeMonthDeadlines.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                </span>
              </div>

              {activeMonthDeadlines.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <Info className="w-6 h-6 text-slate-700" />
                  <p>Sem prazos de inscrição mapeados para {MONTH_NAMES[selectedMonth - 1]} neste filtro.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeMonthDeadlines.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700/60 rounded-xl p-3.5 space-y-2.5 transition duration-150 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getStateColor(item.state)}`}>
                              {item.state}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                              {item.category}
                            </span>
                            <span className="text-xs font-black text-slate-100">
                              {item.universityAcronym}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                            {item.eventLabel} ({item.examName})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40">
                        <div className="flex items-center gap-1.5 text-[11px] text-red-300 font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'ongoing' ? 'bg-emerald-400 animate-pulse' :
                            item.status === 'critical' ? 'bg-rose-500 animate-bounce' : 'bg-slate-500'
                          }`} />
                          <span>{item.dateStr}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 capitalize">
                          {item.status === 'ongoing' ? 'Em andamento' :
                           item.status === 'critical' ? 'Prazo crítico!' :
                           item.status === 'completed' ? 'Finalizado' : 'Aguardando'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend guide */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/20">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>O algoritmo filtra de forma proativa as datas de início e fim que cercam as matrículas e inscrições.</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span>Densidade:</span>
          <span className="w-3 h-3 bg-slate-950 border border-slate-900 rounded" title="Sem prazos" />
          <span className="w-3 h-3 bg-rose-950/30 border border-rose-900/40 rounded" title="Densidade Baixa" />
          <span className="w-3 h-3 bg-red-950/50 border border-red-900/60 rounded" title="Densidade Média" />
          <span className="w-3 h-3 bg-red-900/50 border border-red-500/55 rounded" title="Densidade Alta (Quente)" />
        </div>
      </div>

    </div>
  );
}
