/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimelineEvent {
  id: string;
  label: string; // e.g., "Inscrições", "Isenção", "Provas - Fase 1", "Resultado"
  dateStr: string; // e.g., "01/08/2026 a 31/08/2026"
  status: 'upcoming' | 'ongoing' | 'completed' | 'critical';
  details?: string;
}

export interface RequiredDocument {
  id: string;
  name: string; // e.g., "Documento de Identidade (RG)"
  category: 'general' | 'quota' | 'matricula';
  description: string;
}

export interface UniversityExam {
  id: string;
  universityName: string;
  universityAcronym: string;
  state: 'SP' | 'RJ' | 'MG';
  category: 'federal' | 'estadual' | 'privada';
  examType: 'regular' | 'seriado' | 'enem-sisu' | 'simplificado';
  examName: string; // e.g., "FUVEST 2026", "Vestibular UNICAMP 2026", "PISM I, II e III"
  officialWebsite: string;
  editalUrl: string;
  status: 'announced' | 'open' | 'ongoing' | 'finished' | 'draft';
  lastCrawledAt: string;
  timeline: TimelineEvent[];
  documents: RequiredDocument[];
  importantNotes: string;
}

export interface CrawlerLog {
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'error';
  message: string;
  examId?: string;
}

export interface NotificationSettings {
  email: string;
  emailEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramEnabled: boolean;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'email' | 'telegram' | 'system';
  status: 'sent' | 'failed' | 'simulated';
}
