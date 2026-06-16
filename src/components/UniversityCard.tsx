/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  FileText, 
  Calendar, 
  Users, 
  AlertCircle, 
  ArrowUpRight, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  School,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UniversityExam } from '../types';

interface UniversityCardProps {
  exam: UniversityExam;
  onCrawl: (id: string) => Promise<void>;
  isCrawling: boolean;
}

export default function UniversityCard({ exam, onCrawl, isCrawling }: UniversityCardProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents'>('timeline');
  const [docCategoryFilter, setDocCategoryFilter] = useState<'all' | 'general' | 'quota' | 'matricula'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Parse state name and color styles
  const getStateConfig = (state: 'SP' | 'RJ' | 'MG') => {
    switch (state) {
      case 'SP':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          indicator: 'bg-amber-400',
          gradient: 'from-amber-600 to-yellow-500'
        };
      case 'RJ':
        return {
          bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
          indicator: 'bg-sky-450',
          gradient: 'from-sky-600 to-cyan-500'
        };
      case 'MG':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          indicator: 'bg-emerald-400',
          gradient: 'from-emerald-600 to-teal-500'
        };
    }
  };

  const stateStyle = getStateConfig(exam.state);

  // Status mapping
  const getStatusLabelAndColor = (status: string) => {
    switch (status) {
      case 'open':
        return { label: 'Inscrições Abertas', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' };
      case 'announced':
        return { label: 'Anunciado', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' };
      case 'ongoing':
        return { label: 'Em Andamento', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' };
      case 'finished':
        return { label: 'Concluído', color: 'bg-slate-800/60 text-slate-400 border-slate-800/80 hover:bg-slate-800/80' };
      default:
        return { label: 'Indefinido', color: 'bg-slate-800/50 text-slate-400 border-slate-800' };
    }
  };

  const statusMeta = getStatusLabelAndColor(exam.status);

  // Timeline Event Status mapping
  const getEventStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          bg: 'bg-slate-950/40 border-slate-900', 
          text: 'text-slate-500 font-normal line-through', 
          dot: 'bg-slate-600' 
        };
      case 'ongoing':
        return { 
          bg: 'bg-emerald-950/20 border-emerald-900/60', 
          text: 'text-emerald-400 font-semibold', 
          dot: 'bg-emerald-500 animate-pulse' 
        };
      case 'critical':
        return { 
          bg: 'bg-rose-950/25 border-rose-900/65', 
          text: 'text-rose-400 font-bold', 
          dot: 'bg-rose-500 animate-bounce' 
        };
      case 'upcoming':
      default:
        return { 
          bg: 'bg-slate-950/50 border-slate-800', 
          text: 'text-slate-300', 
          dot: 'bg-indigo-500' 
        };
    }
  };

  const filteredDocs = exam.documents.filter(doc => {
    if (docCategoryFilter === 'all') return true;
    return doc.category === docCategoryFilter;
  });

  return (
    <div className="bg-slate-900 border border-slate-800/75 hover:border-slate-700/80 rounded-3xl overflow-hidden shadow-xl transition duration-300 flex flex-col flex-1 h-full min-h-[460px]">
      {/* Visual top border indicating state */}
      <div className={`h-2.5 w-full bg-gradient-to-r ${stateStyle.gradient}`} />

      {/* Main header block */}
      <div className="p-6 pb-2.5 space-y-4">
        {/* State + Type badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-tight uppercase flex items-center gap-1 ${stateStyle.bg}`}>
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{exam.state}</span>
            </span>
            
            <span className="px-2 py-0.5 rounded-full border border-slate-800 bg-slate-950 text-slate-300 text-[10px] font-bold uppercase flex items-center gap-1">
              <Compass className="w-3 h-3 flex-shrink-0" />
              <span>
                {exam.examType === 'seriado' 
                  ? 'Seriado' 
                  : exam.examType === 'enem-sisu' 
                  ? 'ENEM / SISU' 
                  : exam.examType === 'simplificado' 
                  ? 'Simplificado' 
                  : 'Regular'}
              </span>
            </span>

            <span className="px-2 py-0.5 rounded-full border border-slate-800/60 bg-slate-950 text-slate-405 text-slate-400 text-[10px] font-medium uppercase">
              {exam.category}
            </span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 ${statusMeta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stateStyle.indicator}`} />
            <span>{statusMeta.label}</span>
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-white text-lg leading-snug tracking-tight">
              {exam.examName}
            </h3>
            
            <button
              onClick={() => onCrawl(exam.id)}
              disabled={isCrawling}
              className={`flex-shrink-0 p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/35 border border-indigo-500/20 rounded-xl transition cursor-pointer disabled:opacity-40 flex items-center justify-center`}
              title="Acionar robô para verificar edital e datas na internet"
              type="button"
            >
              <RefreshCw className={`w-4 h-4 ${isCrawling ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-indigo-400/80 font-semibold flex items-center gap-1.5">
            <School className="w-3.5 h-3.5" />
            <span>{exam.universityName} ({exam.universityAcronym})</span>
          </p>
        </div>
      </div>

      {/* Tabs list (Timeline or required documents) */}
      <div className="px-6 flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2.5 font-semibold text-xs border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'timeline' 
              ? 'border-indigo-500 text-indigo-455 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
          type="button"
        >
          <Calendar className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
          <span>Cronograma</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${activeTab === 'timeline' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-950 text-slate-400'}`}>
            {exam.timeline.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2.5 font-semibold text-xs border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'documents' 
              ? 'border-indigo-500 text-indigo-455 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
          type="button"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Documentos</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${activeTab === 'documents' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-950 text-slate-400'}`}>
            {exam.documents.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        
        {activeTab === 'timeline' ? (
          /* Timeline Panel */
          <div className="space-y-3.5 flex-1 max-h-[290px] overflow-y-auto pr-1">
            {exam.timeline.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Sem cronogramas mapeados para este exame.</p>
            ) : (
              <div className="relative border-l border-slate-800 ml-2.5 pl-4 space-y-4 pt-1 pb-1">
                {exam.timeline.map((event) => {
                  const evStyle = getEventStyle(event.status);
                  return (
                    <div key={event.id} className="relative group text-left">
                      {/* Left indicator bubble */}
                      <span className={`absolute -left-[21.5px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ring-4 ring-slate-900/40 ${evStyle.dot}`} />
                      
                      <div className={`p-2.5 rounded-2xl border transition duration-200 ${evStyle.bg}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${evStyle.text}`}>
                            {event.label}
                          </span>
                          
                          {event.status === 'critical' && (
                            <span className="bg-rose-500/15 text-rose-300 border border-rose-500/20 text-[8px] font-bold uppercase px-1 rounded animate-pulse">
                              Rígido
                            </span>
                          )}
                          {event.status === 'ongoing' && (
                            <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-[8px] font-bold uppercase px-1 rounded">
                              Ativo
                            </span>
                          )}
                        </div>

                        <p className={`text-[11px] font-mono mt-1 ${event.status === 'completed' ? 'text-slate-500' : 'text-indigo-400 font-bold'}`}>
                          📅 {event.dateStr}
                        </p>

                        {event.details && (
                          <p className="text-[10px] text-slate-400 mt-1 italic leading-tight">
                            {event.details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Required Documents Panel with fast filters */
          <div className="space-y-3 flex-1 flex flex-col justify-start max-h-[290px] overflow-y-auto pr-1">
            <div className="flex items-center gap-1 scrollbar-none overflow-x-auto pb-1">
              <button
                onClick={() => setDocCategoryFilter('all')}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border transition duration-150 cursor-pointer ${
                  docCategoryFilter === 'all' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800/40'
                }`}
                type="button"
              >
                Todos
              </button>
              <button
                onClick={() => setDocCategoryFilter('general')}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border transition duration-150 cursor-pointer ${
                  docCategoryFilter === 'general' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800/40'
                }`}
                type="button"
              >
                Inscrição
              </button>
              <button
                onClick={() => setDocCategoryFilter('quota')}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border transition duration-150 cursor-pointer ${
                  docCategoryFilter === 'quota' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800/40'
                }`}
                type="button"
              >
                Cotas
              </button>
              <button
                onClick={() => setDocCategoryFilter('matricula')}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border transition duration-150 cursor-pointer ${
                  docCategoryFilter === 'matricula' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800/40'
                }`}
                type="button"
              >
                Matrícula
              </button>
            </div>

            <div className="space-y-2 flex-1">
              {filteredDocs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">Sem documentos correspondentes sob este filtro.</p>
              ) : (
                filteredDocs.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/60 rounded-xl space-y-1 relative text-left group transition">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-200 leading-normal">{doc.name}</p>
                      
                      <button
                        type="button"
                        onClick={() => setShowTooltip(showTooltip === doc.id ? null : doc.id)}
                        className="text-slate-400 hover:text-indigo-400 transition p-0.5"
                        title="Ver justificativa"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      doc.category === 'quota' ? 'bg-amber-950/40 text-amber-300 border border-amber-900/40' :
                      doc.category === 'matricula' ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/40' : 'text-slate-400 bg-slate-950 border border-slate-800/60'
                    }`}>
                      {doc.category === 'quota' ? 'Cotas' :
                       doc.category === 'matricula' ? 'Matrícula' : 'Geral'}
                    </span>

                    {/* Explanatory tooltip overlay */}
                    <AnimatePresence>
                      {(showTooltip === doc.id) && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute bottom-full left-0 right-0 z-10 p-3 bg-slate-950 text-slate-200 border border-slate-800 text-[10px] rounded-lg shadow-2xl mb-1 leading-normal"
                        >
                          <p className="font-semibold text-indigo-400 block mb-0.5">Critério do Edital:</p>
                          <p className="text-slate-300">{doc.description}</p>
                          <button
                            onClick={() => setShowTooltip(null)}
                            className="text-indigo-400 hover:text-indigo-200 font-bold block mt-1"
                            type="button"
                          >
                            Fechar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Collapsible Info Toggle & Website Links */}
        <div className="space-y-4 pt-4 border-t border-slate-800/60 text-left">
          {/* Important summary */}
          <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-2xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="text-[11px] leading-normal text-slate-300">
              <span className="font-bold text-amber-400 block mb-0.5">Nota de Auditoria:</span>
              <p className="line-clamp-2 hover:line-clamp-none transition text-slate-200">{exam.importantNotes}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={exam.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-[11px] rounded-xl transition text-center flex items-center justify-center gap-1"
            >
              <span>Site Oficial</span>
              <BookOpen className="w-3.5 h-3.5" />
            </a>

            {exam.editalUrl && exam.editalUrl.toLowerCase().includes('.pdf') && (
              <a
                href={exam.editalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 hover:text-red-300 font-semibold text-[11px] rounded-xl transition text-center flex items-center justify-center gap-1"
              >
                <span>Edital PDF</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Crawler Log date footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Última Varredura:</span>
            <span>
              {new Date(exam.lastCrawledAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(exam.lastCrawledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
