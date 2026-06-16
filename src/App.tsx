/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Search, 
  Map, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Database, 
  FileCheck,
  Zap, 
  Bot, 
  HelpCircle,
  FileClock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Mail,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UniversityExam, CrawlerLog, SystemNotification, NotificationSettings } from './types';
import UniversityCard from './components/UniversityCard';
import ConsoleLogs from './components/ConsoleLogs';
import NotificationPanel from './components/NotificationPanel';
import FreiSeraficoLogo from './components/FreiSeraficoLogo';
import DeadlinesHeatmap from './components/DeadlinesHeatmap';

export default function App() {
  const [exams, setExams] = useState<UniversityExam[]>([]);
  const [logs, setLogs] = useState<CrawlerLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: 'fernandolvieira@gmail.com',
    emailEnabled: true,
    telegramBotToken: '',
    telegramChatId: '',
    telegramEnabled: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [crawlingIds, setCrawlingIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom filter states
  const [statesFilter, setStatesFilter] = useState({ SP: true, RJ: true, MG: true });
  const [typesFilter, setTypesFilter] = useState({ 
    regular: true, 
    seriado: true, 
    'enem-sisu': true, 
    simplificado: true 
  });
  const [categoriesFilter, setCategoriesFilter] = useState({ federal: true, estadual: true, privada: true });
  
  // Simulated overlay alert
  const [showKeyHint, setShowKeyHint] = useState(true);
  const [triggerCount, setTriggerCount] = useState(0);

  // Load backend variables on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/exams');
      if (!res.ok) throw new Error('Falha ao conectar com o robô crawler.');
      const data = await res.json();
      setExams(data.exams || []);
      setLogs(data.logs || []);
      setNotifications(data.notifications || []);
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Erro ao consumir as APIs do servidora:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle filter properties
  const toggleStateFilter = (key: 'SP' | 'RJ' | 'MG') => {
    setStatesFilter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTypeFilter = (key: 'regular' | 'seriado' | 'enem-sisu' | 'simplificado') => {
    setTypesFilter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategoryFilter = (key: 'federal' | 'estadual' | 'privada') => {
    setCategoriesFilter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Run crawls
  const handleCrawlExam = async (id: string) => {
    if (crawlingIds.includes(id)) return;
    setCrawlingIds(prev => [...prev, id]);
    
    try {
      const res = await fetch(`/api/exams/crawl/${id}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Falha na comunicação de rastreamento do portal.');
      
      const data = await res.json();
      
      // Update individual exam in listing
      setExams(prev => prev.map(exam => exam.id === id ? data.exam : exam));
      setLogs(data.logs);
      setNotifications(data.notifications);
      setTriggerCount(p => p + 1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCrawlingIds(prev => prev.filter(x => x !== id));
    }
  };

  // Bulk crawl all matching exams
  const handleCrawlAllFiltered = async () => {
    const toCrawl = filteredExams.map(x => x.id);
    for (const id of toCrawl) {
      await handleCrawlExam(id);
    }
  };

  // Save changes on form Settings
  const handleSaveSettings = async (updatedSettings: NotificationSettings) => {
    try {
      const res = await fetch('/api/exams/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      throw new Error('Falha ao registrar configurações no painel.');
    }
  };

  // Send Test triggers
  const handleTestNotification = async (type: 'email' | 'telegram', additionalData: any) => {
    try {
      const res = await fetch('/api/exams/notify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...additionalData })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details);
      }
      const data = await res.json();
      setNotifications(data.notifications);
    } catch (err: any) {
      throw new Error(err.message || 'Falha ao testar canais de disparo.');
    }
  };

  // Reset Console Logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Filter application items
  const filteredExams = exams.filter(exam => {
    // 1. Text filter
    const matchesSearch = 
      exam.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.universityAcronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.universityName.toLowerCase().includes(searchQuery.toLowerCase());
      
    // 2. State filter
    const matchesState = statesFilter[exam.state];
    
    // 3. Type filter
    const matchesType = typesFilter[exam.examType];
    
    // 4. Category filter
    const matchesCategory = categoriesFilter[exam.category];

    return matchesSearch && matchesState && matchesType && matchesCategory;
  });

  // Calculate top-bar numeric states
  const totalUniversities = exams.length;
  const activeOpenExams = exams.filter(x => x.status === 'open' || x.status === 'ongoing').length;
  const totalDocumentsRequired = exams.reduce((sum, exam) => sum + exam.documents.length, 0);
  const totalAlertsFired = notifications.length;

  return (
    <div id="full-dashboard-layout" className="min-h-screen bg-[#0d0d0f] text-slate-100 selection:bg-brand-red selection:text-white font-sans antialiased pb-12">
      {/* Upper Status Banner with dark style / bento integration */}
      {showKeyHint && (
        <div className="bg-gradient-to-r from-red-950/20 via-[#121214] to-red-950/20 border-b border-red-950/40 text-slate-300 px-6 py-3.5 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-red"></span>
            </span>
            <p className="font-medium text-slate-300">
              💡 <span className="text-white font-semibold flex-shrink-0">Mecanismo Frei Seráfico:</span> Rastreamento de editais sob demanda com suporte a <span className="text-red-400 font-bold">AI Google Grounding</span> em tempo real. Identifica vestibulares regulares, seriados, ENEM/SISU e processos seletivos simplificados de <strong className="text-red-300">MG, RJ e SP</strong>.
            </p>
          </div>
          <button 
            onClick={() => setShowKeyHint(false)}
            className="text-slate-400 hover:text-white font-bold px-2 py-0.5 rounded-md hover:bg-slate-800 transition cursor-pointer text-sm"
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Page Title Header styled as a beautiful bento component with brand style */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-slate-900/40 border border-red-950/20 p-6 rounded-3xl bento-glow-crimson relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none translate-x-12 -translate-y-12">
            <FreiSeraficoLogo className="w-64 h-64" />
          </div>
          <div className="space-y-1 select-none z-10">
            <div className="flex items-center gap-3">
              <div className="relative p-1 bg-white rounded-xl border border-brand-red shadow-lg shadow-red-950/20">
                <FreiSeraficoLogo className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  UniCrawler <span className="text-xs font-mono font-bold bg-brand-red text-white px-2.5 py-0.5 rounded-full border border-red-700 tracking-normal uppercase">PORTAL ACADÊMICO</span>
                </h1>
                <p className="text-xs text-red-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  Gabinete de Estudo Frei Seráfico
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap z-10">
            <button
              onClick={handleCrawlAllFiltered}
              disabled={filteredExams.length === 0 || crawlingIds.length > 0}
              className="px-4.5 py-2.5 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition duration-250 flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Disparar crawler para varrer todos os vestibulares filtrados ao mesmo tempo"
              type="button"
            >
              <Zap className="w-4 h-4 fill-white text-white" />
              <span>Varredura Geral Sob Demanda</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-xl transition cursor-pointer"
              title="Atualizar painel"
              type="button"
            >
              <RefreshCw className="w-4 h-4 text-slate-400 hover:rotate-180 transition duration-500" />
            </button>
          </div>
        </header>

        {/* Dashboard Top Stats Indicators as sleek Bento compartments */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          
          <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4 transition duration-300 hover:border-brand-red/20 shadow-md">
            <div className="p-3 bg-brand-red/10 text-red-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Universidades</span>
              <span className="text-lg font-black text-white block">{totalUniversities} integradas</span>
            </div>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4 transition duration-300 hover:border-brand-red/20 shadow-md">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Editais Abertos</span>
              <span className="text-lg font-black text-red-400 block">{activeOpenExams} editais livres</span>
            </div>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4 transition duration-300 hover:border-amber-500/20">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Documentos</span>
              <span className="text-lg font-black text-slate-200 block">{totalDocumentsRequired} arquivos</span>
            </div>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4 transition duration-300 hover:border-rose-500/20">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Alertas Emitidos</span>
              <span className="text-lg font-black text-rose-400 block">{totalAlertsFired} disparos</span>
            </div>
          </div>

        </div>

        {/* Left and Central Main Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: Filters + Notifications panel */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* 1. Interactive Filters Block in sleeker dark Bento view */}
            <div className="bg-[#151518]/90 border border-red-950/15 rounded-3xl p-6 shadow-xl space-y-5 text-left bento-glow-crimson">
              <div>
                <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-4 bg-brand-red rounded-full"></span>
                  📚 Motores de Filtro
                </h3>
                <p className="text-xs text-slate-400">Refine a escavação por localização e tipo de vestibular</p>
              </div>

              {/* Text Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Pesquisar sigla, nome, USP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/80 transition text-slate-200 placeholder-slate-500"
                />
              </div>

              {/* States Toggles (SP, RJ, MG) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estados Alvo</span>
                <div className="flex gap-2">
                  {(['SP', 'RJ', 'MG'] as const).map((st) => {
                    const active = statesFilter[st];
                    return (
                      <button
                        key={st}
                        onClick={() => toggleStateFilter(st)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          active 
                            ? 'bg-brand-red border-red-700 text-white shadow-md' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        }`}
                        type="button"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-cyan-300 animate-pulse' : 'bg-slate-700'}`} />
                        <span>{st}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exam types Toggles with all 4 categories requested */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Método de Ingresso</span>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'regular', label: 'Regular (Vest)' },
                    { id: 'seriado', label: 'Seriado' },
                    { id: 'enem-sisu', label: 'ENEM / SISU' },
                    { id: 'simplificado', label: 'Simplificado' }
                  ] as const).map((tp) => {
                    const active = typesFilter[tp.id];
                    return (
                      <button
                        key={tp.id}
                        onClick={() => toggleTypeFilter(tp.id)}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                          active 
                            ? 'bg-brand-red/20 border-brand-red text-red-300 shadow-sm' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        }`}
                        type="button"
                      >
                        <span>{tp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Administration Category */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dependência Administrativa</span>
                <div className="flex gap-2">
                  {(['federal', 'estadual', 'privada'] as const).map((cat) => {
                    const active = categoriesFilter[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategoryFilter(cat)}
                        className={`flex-1 py-2 border text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
                          active 
                            ? 'bg-slate-850 border-slate-700 text-red-300 font-bold' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        }`}
                        type="button"
                      >
                        <span className="capitalize">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Counts filter status alert */}
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl flex items-center justify-between border border-slate-800/60 font-mono">
                <span>Filtrados / Total:</span>
                <span className="font-bold text-red-400 text-xs">{filteredExams.length} de {totalUniversities}</span>
              </div>
            </div>

            {/* 2. Notification Config Panel */}
            <NotificationPanel
              settings={settings}
              notifications={notifications}
              onSaveSettings={handleSaveSettings}
              onTestNotification={handleTestNotification}
              isLoading={isLoading}
            />

          </aside>

          {/* Central Panel: Database of Universities and Real-time Console Logs */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* 1. Interactive Heatmap of deadlines */}
            <DeadlinesHeatmap exams={exams} filteredExams={filteredExams} />
            
            {/* Universities Grid list with transition */}
            <div>
              {isLoading ? (
                <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-medium text-sm">Carregando cronogramas do robô do plano de fundo...</p>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
                  <FileClock className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-slate-200 font-bold text-sm">Nenhum vestibular correspondente encontrado.</p>
                    <p className="text-slate-400 text-xs text-slate-500">Ajuste os filtros de estados ou tipo de ingresso para recarregar.</p>
                  </div>
                  <button
                    onClick={() => {
                      setStatesFilter({ SP: true, RJ: true, MG: true });
                      setTypesFilter({ regular: true, seriado: true, 'enem-sisu': true, simplificado: true });
                      setCategoriesFilter({ federal: true, estadual: true, privada: true });
                      setSearchQuery('');
                    }}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                    type="button"
                  >
                    Resetar Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredExams.map((exam) => (
                      <motion.div
                        key={exam.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <UniversityCard
                          exam={exam}
                          onCrawl={handleCrawlExam}
                          isCrawling={crawlingIds.includes(exam.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Hacker style System Console logs */}
            <ConsoleLogs
              logs={logs}
              onClearLogs={handleClearLogs}
            />

          </main>

        </div>

      </div>
    </div>
  );
}
