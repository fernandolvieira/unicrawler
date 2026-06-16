/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Send, Bell, Flame, Check, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationSettings, SystemNotification } from '../types';

interface NotificationPanelProps {
  settings: NotificationSettings;
  notifications: SystemNotification[];
  onSaveSettings: (settings: NotificationSettings) => Promise<void>;
  onTestNotification: (type: 'email' | 'telegram', data: any) => Promise<void>;
  isLoading: boolean;
}

export default function NotificationPanel({
  settings,
  notifications,
  onSaveSettings,
  onTestNotification,
  isLoading
}: NotificationPanelProps) {
  const [email, setEmail] = useState(settings.email);
  const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled);
  const [telegramBotToken, setTelegramBotToken] = useState(settings.telegramBotToken);
  const [telegramChatId, setTelegramChatId] = useState(settings.telegramChatId);
  const [telegramEnabled, setTelegramEnabled] = useState(settings.telegramEnabled);
  
  const [isSaving, setIsSaving] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testTelegramLoading, setTestTelegramLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await onSaveSettings({
        email,
        emailEnabled,
        telegramBotToken,
        telegramChatId,
        telegramEnabled
      });
      setSuccessMessage('Configurações armazenadas com sucesso no servidor do robô!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const testEmail = async () => {
    setTestEmailLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await onTestNotification('email', { email });
      setSuccessMessage('Disparado e-mail simulado de auditoria! Verifique o log abaixo.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro no envio do e-mail de teste.');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const testTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      setErrorMessage('Para testar o Telegram, preencha o Token do Bot e o Chat ID.');
      return;
    }
    setTestTelegramLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await onTestNotification('telegram', { telegramBotToken, telegramChatId });
      setSuccessMessage('Notificação de teste entregue no seu Telegram!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha na conexão do Telegram. Verifique os dados fornecidos.');
    } finally {
      setTestTelegramLoading(false);
    }
  };

  return (
    <div id="notif-panel-root" className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden h-full flex flex-col bento-glow-indigo">
      <div className="p-5 border-b border-slate-800/50 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Bell className="w-5 h-5 animate-pulse" id="bell-icon" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm" id="notif-panel-title">Central de Alertas</h2>
            <p className="text-[10px] text-slate-404 text-slate-400">Notificações automáticas de novos editais</p>
          </div>
        </div>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="Ajuda para configurar o Telegram"
          type="button"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-indigo-950/20 border border-indigo-900/50 text-indigo-300 rounded-xl text-xs space-y-2 text-left"
          >
            <p className="font-bold text-indigo-200">Como configurar alertas via Telegram:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Crie um bot no Telegram falando com o <span className="font-mono bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-indigo-400">@BotFather</span>. Ele fornecerá seu <strong>Token do Bot</strong>.</li>
              <li>Inicie o bot enviando uma mensagem para ele no Telegram.</li>
              <li>Consiga seu <strong>Chat ID</strong> usando o bot <span className="font-mono bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-indigo-400">@userinfobot</span> ou similar.</li>
              <li>Preencha os campos abaixo, ative o switch e clique em <strong className="text-indigo-400 font-bold">Testar Telegram</strong>!</li>
            </ol>
          </motion.div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Email Settings */}
          <div className="space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Notificações por E-mail</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailEnabled} 
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-850 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Ex: fernandolvieira@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!emailEnabled}
                className="flex-1 px-3 py-2 text-xs bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition"
              />
              <button
                type="button"
                onClick={testEmail}
                disabled={!emailEnabled || testEmailLoading}
                className="px-3 py-2 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 rounded-xl border border-indigo-500/20 disabled:opacity-40 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {testEmailLoading ? 'Enviando...' : 'Testar'}
              </button>
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* Telegram Settings */}
          <div className="space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-sky-400 fill-sky-950" />
                <span>Notificações por Telegram</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={telegramEnabled} 
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-850 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            <div className="space-y-2" style={{ opacity: telegramEnabled ? 1 : 0.4 }}>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Token API do Bot</span>
                <input
                  type="text"
                  placeholder="Ex: 583921048:AAF92jcOa_H..."
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  disabled={!telegramEnabled}
                  className="w-full px-3 py-2 text-xs bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-50 transition"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Seu Chat ID do Telegram</span>
                <input
                  type="text"
                  placeholder="Ex: 120485930"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  disabled={!telegramEnabled}
                  className="w-full px-3 py-2 text-xs bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-50 transition"
                />
              </div>

              <button
                type="button"
                onClick={testTelegram}
                disabled={!telegramEnabled || testTelegramLoading || !telegramBotToken || !telegramChatId}
                className="w-full mt-1 py-2 text-xs font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 border border-sky-500/20 rounded-xl disabled:opacity-40 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-sky-450" />
                {testTelegramLoading ? 'Conectando...' : 'Testar Conexão Telegram'}
              </button>
            </div>
          </div>

          {/* Feedback logs inside form */}
          {successMessage && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-450 text-emerald-400 rounded-xl text-[11px] flex items-start gap-2 text-left"
            >
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-450 text-rose-400 rounded-xl text-[11px] flex items-start gap-2 text-left"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 px-4 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configuração do Robô'}
          </button>
        </form>

        {/* Historic logs of notifications */}
        <div className="space-y-3 pt-2 text-left">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Histórico de Alertas</h3>
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-505 text-slate-500 italic text-center py-4 bg-slate-950/40 border border-slate-800/40 rounded-xl">Sem disparos efetuados.</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-2.5 bg-slate-950/45 rounded-xl border border-slate-850 hover:border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate max-w-[140px]">{notif.title}</span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-normal">{notif.message}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-850/60">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      notif.type === 'telegram' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' :
                      notif.type === 'email' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-850 text-slate-400'
                    }`}>
                      {notif.type}
                    </span>
                    <span className={`font-semibold ${
                      notif.status === 'sent' ? 'text-emerald-450 text-emerald-400' :
                      notif.status === 'failed' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {notif.status === 'sent' ? '• Enviado' :
                       notif.status === 'failed' ? '• Falhou' : '• Simulado'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
