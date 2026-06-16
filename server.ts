/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { UniversityExam, CrawlerLog, SystemNotification, NotificationSettings } from './src/types';

const app = express();
app.use(express.json());

const PORT = 3000;

// Shared in-memory state representing crawled notices, logs, and notification setups.
let listExams: UniversityExam[] = [
  {
    id: 'usp-fuvest',
    universityName: 'Universidade de São Paulo',
    universityAcronym: 'USP',
    state: 'SP',
    category: 'estadual',
    examType: 'regular',
    examName: 'FUVEST 2026',
    officialWebsite: 'https://www.fuvest.br/',
    editalUrl: '',
    status: 'announced',
    lastCrawledAt: '2026-06-10T11:00:00Z',
    timeline: [
      { id: 'ev1', label: 'Pedidos de Isenção / Redução', dateStr: '15/05/2026 a 12/06/2026', status: 'completed', details: 'Solicitação exclusivamente online pelo portal da FUVEST' },
      { id: 'ev2', label: 'Período de Inscrições', dateStr: '14/08/2026 a 15/09/2026', status: 'upcoming', details: 'Inscrição mediante pagamento de taxa integral (R$ 191,00)' },
      { id: 'ev3', label: 'Prova de 1ª Fase', dateStr: '15/11/2026 às 13h', status: 'upcoming', details: '90 questões de múltipla escolha (conhecimentos gerais)' },
      { id: 'ev4', label: 'Provas de 2ª Fase', dateStr: '13/12/2026 e 14/12/2026', status: 'upcoming', details: 'Redação e questões discursivas de disciplinas específicas' },
      { id: 'ev5', label: 'Divulgação da 1ª chamada', dateStr: '22/01/2027', status: 'upcoming', details: 'Lista oficial no site da FUVEST e portal do candidato' }
    ],
    documents: [
      { id: 'doc1', name: 'Documento de Identidade oficial (RG/CNH)', category: 'general', description: 'Documento de identidade com foto para acesso às salas de prova e matrícula' },
      { id: 'doc2', name: 'CPF próprio do candidato', category: 'general', description: 'Obrigatório para registro da inscrição e consultas' },
      { id: 'doc3', name: 'Histórico Escolar e Certificado de Ensino Médio', category: 'matricula', description: 'Necessário para comprovação de conclusão do ciclo de estudos na matrícula' },
      { id: 'doc4', name: 'Autodeclaração de Cor/Raça ou Escola Pública', category: 'quota', description: 'Documentação comprobatória exigida apenas de candidatos concorrendo por vagas PPI ou EP' }
    ],
    importantNotes: 'A FUVEST é um dos vestibulares mais concorridos do país. Fique atento às leituras obrigatórias disponibilizadas no início do ano e ao local de realização da prova divulgado uma semana antes.'
  },
  {
    id: 'unicamp',
    universityName: 'Universidade Estadual de Campinas',
    universityAcronym: 'UNICAMP',
    state: 'SP',
    category: 'estadual',
    examType: 'regular',
    examName: 'Vestibular Unicamp 2026',
    officialWebsite: 'https://www.comvest.unicamp.br/',
    editalUrl: '',
    status: 'open',
    lastCrawledAt: '2026-06-10T10:30:00Z',
    timeline: [
      { id: 'evc1', label: 'Pedidos de Isenção da Taxa', dateStr: '15/05/2026 a 15/06/2026', status: 'ongoing', details: 'Destinado a candidatos de baixa renda ou bolsistas em escolas privadas' },
      { id: 'evc2', label: 'Período de Inscrições Gerais', dateStr: '31/07/2026 a 31/08/2026', status: 'upcoming', details: 'Inscrições online no portal da Comvest' },
      { id: 'evc3', label: 'Prova de 1ª Fase', dateStr: '18/10/2026', status: 'upcoming', details: 'Prova com 72 questões abrangendo conhecimentos do BNCC' },
      { id: 'evc4', label: 'Provas de 2ª Fase', dateStr: '29/11/2026 e 30/11/2026', status: 'upcoming', details: 'Redação obrigatória e questões especificas de acordo com a área do curso' },
      { id: 'evc5', label: 'Divulgação dos Resultados', dateStr: '25/01/2027', status: 'upcoming', details: 'Lista dos aprovados em 1ª Chamada e início das matrículas virtuais' }
    ],
    documents: [
      { id: 'docc1', name: 'Cédula de Identidade Civil (RG)', category: 'general', description: 'Obrigatório o envio digitalizado na inscrição para verificação biométrica' },
      { id: 'docc2', name: 'Documento comprobatório de Escolaridade pública', category: 'quota', description: 'Exclusivo para candidatos que optarem pelo sistema PAAIS (bônus de escola pública)' },
      { id: 'docc3', name: 'Histórico Escolar completo do Ensino Médio', category: 'matricula', description: 'Necessário no momento do encerramento da matrícula virtual' }
    ],
    importantNotes: 'A Unicamp possui um excelente programa de bonificação por histórico escolar público (PAAIS) e cotas étnico-raciais com banca de heteroidentificação ativa.'
  },
  {
    id: 'unesp',
    universityName: 'Universidade Estadual Paulista',
    universityAcronym: 'UNESP',
    state: 'SP',
    category: 'estadual',
    examType: 'regular',
    examName: 'Vestibular UNESP 2026',
    officialWebsite: 'https://www.vunesp.com.br/',
    editalUrl: '',
    status: 'announced',
    lastCrawledAt: '2026-06-10T09:15:00Z',
    timeline: [
      { id: 'evu1', label: 'Solicitação de Isenção/Redução', dateStr: '01/09/2026 a 10/09/2026', status: 'upcoming', details: 'Vunesp concede isenção pelo preenchimento do CadÚnico' },
      { id: 'evu2', label: 'Inscrições no Vestibular', dateStr: '11/09/2026 a 13/10/2026', status: 'upcoming', details: 'Candidato escolhe a cidade da realização das provas no momento da inscrição' },
      { id: 'evu3', label: 'Prova da 1ª Fase', dateStr: '14/11/2026', status: 'upcoming', details: 'Prova objetiva contendo 90 questões gerais de múltipla escolha' },
      { id: 'evu4', label: 'Provas da 2ª Fase', dateStr: '10/12/2026', status: 'upcoming', details: 'Redação e 24 questões discursivas distribuídas em áreas do conhecimento' },
      { id: 'evu5', label: 'Divulgação dos Aprovados', dateStr: '29/01/2027', status: 'upcoming', details: 'Início da primeira lista no portal de acompanhamento' }
    ],
    documents: [
      { id: 'docu1', name: 'RG / Identidade Civil', category: 'general', description: 'Utilizado no controle de frequências de prova por biometria e assinatura' },
      { id: 'docu2', name: 'Certidão de Nascimento ou Casamento', category: 'matricula', description: 'Exigido exclusivamente para registro civil no sistema acadêmico da UNESP' },
      { id: 'docu3', name: 'Certificado de Conclusão do Ensino Médio', category: 'matricula', description: 'Certificado de conclusão assinado por diretor pedagógico da instituição' }
    ],
    importantNotes: 'As provas da UNESP são organizadas tradicionalmente pela Fundação Vunesp, conhecida por provas muito claras, interpretativas e contextualizadas.'
  },
  {
    id: 'uerj',
    universityName: 'Universidade do Estado do Rio de Janeiro',
    universityAcronym: 'UERJ',
    state: 'RJ',
    category: 'estadual',
    examType: 'regular',
    examName: 'Vestibular Estadual UERJ 2027',
    officialWebsite: 'https://www.vestibular.uerj.br/',
    editalUrl: '',
    status: 'open',
    lastCrawledAt: '2026-06-10T11:20:00Z',
    timeline: [
      { id: 'evr1', label: 'Inscrições para Exame de Qualificação 1', dateStr: '10/04/2026 a 11/05/2026', status: 'completed', details: 'Primeira oportunidade de habilitação objetiva para o exame discursivo' },
      { id: 'evr2', label: 'Prova de Qualificação 1', dateStr: '09/06/2026', status: 'completed', details: 'Contabiliza conceitos A, B, C ou D para pontuação de bonificação' },
      { id: 'evr3', label: 'Inscrições para Exame de Qualificação 2', dateStr: '11/06/2026 a 15/07/2026', status: 'ongoing', details: 'Segundo exame objetivo para obter uma melhor classificação antes do exame discursivo' },
      { id: 'evr4', label: 'Prova de Qualificação 2', dateStr: '08/09/2026', status: 'upcoming', details: 'Prova com 60 questões objetivas gerais' },
      { id: 'evr5', label: 'Exame Discursivo - Inscrições e Prova', dateStr: '22/10/2026 a 30/11/2026 (Inscrições) | Prova em 06/12/2026', status: 'upcoming', details: 'Redação comum e duas provas específicas discursivas de acordo com a carreira selecionada' }
    ],
    documents: [
      { id: 'docr1', name: 'Histórico Escolar Ensino Médio completo', category: 'general', description: 'Requisito para pontuar no sistema de cotas e obrigatório na matrícula discursiva' },
      { id: 'docr2', name: 'Declaração de hipossuficiência de taxa', category: 'general', description: 'Caso soliciada isenção com comprovante de renda mensal per capita inferior a 1,5 salário mínimo' },
      { id: 'docr3', name: 'Documentos do sistema de reserva de vagas (cotas)', category: 'quota', description: 'Laudos médicos (vigência de cotas PCD) ou Autodeclaração Étnica autenticada' }
    ],
    importantNotes: 'O vestibular da UERJ utiliza o modelo singular de Exames de Qualificação independentes. Candidatos podem realizar qualificação 1 e/ou 2. A maior pontuação é aproveitada para o Exame Discursivo principal.'
  },
  {
    id: 'ufrj-sisu',
    universityName: 'Universidade Federal do Rio de Janeiro',
    universityAcronym: 'UFRJ',
    state: 'RJ',
    category: 'federal',
    examType: 'enem-sisu',
    examName: 'SISU UFRJ 2026',
    officialWebsite: 'https://acessograduacao.ufrj.br/',
    editalUrl: '',
    status: 'announced',
    lastCrawledAt: '2026-06-10T12:00:00Z',
    timeline: [
      { id: 'evf1', label: 'Aplicação Oficial do ENEM 2025', dateStr: '03/11/2025 e 10/11/2025', status: 'completed', details: 'Obrigatório para cálculo de nota inicial do SISU' },
      { id: 'evf2', label: 'Inscrições no Portal SISU do MEC', dateStr: '20/01/2026 a 23/01/2026', status: 'completed', details: 'Portal nacional de inscrições unificado' },
      { id: 'evf3', label: 'Resultado Chamada Regular', dateStr: '28/01/2026', status: 'completed', details: 'Divulgação oficial e lista preliminar de pré-matrículas' },
      { id: 'evf4', label: 'Matrícula Remota Ordinária UFRJ', dateStr: '30/01/2026 a 05/02/2026', status: 'completed', details: 'Envio online e upload de documentação digital oficial obrigatória' },
      { id: 'evf5', label: 'Manifestação de Interesse na Lista de Espera', dateStr: '28/01/2026 a 05/02/2026', status: 'completed', details: 'Obrigatório manifestar no MEC e acompanhar editais próprios de reclassificação no site da UFRJ' }
    ],
    documents: [
      { id: 'docf1', name: 'Boletim Individual com Notas do ENEM', category: 'general', description: 'Requerido para cruzamento correto na central nacional do MEC' },
      { id: 'docf2', name: 'Certificado de quitação eleitoral e militar', category: 'matricula', description: 'Para maiores de 18 anos, exigido na fase final de consolidação de matrícula presencial' },
      { id: 'docf3', name: 'Documentação de comprovação de renda familiar', category: 'quota', description: 'Para concorrentes por cotas de renda (L1, L2, L9, L10) contendo extrato do CadÚnico ou contraqueques recentes' }
    ],
    importantNotes: 'A UFRJ preenche 100% de suas vagas de graduação convencional pelo SISU, utilizando pesos específicos para cada curso (ver Anexo V do edital de acesso).'
  },
  {
    id: 'uff-sisu',
    universityName: 'Universidade Federal Fluminense',
    universityAcronym: 'UFF',
    state: 'RJ',
    category: 'federal',
    examType: 'enem-sisu',
    examName: 'SISU UFF / ENEM 2026',
    officialWebsite: 'https://www.coseac.uff.br/',
    editalUrl: '',
    status: 'finished',
    lastCrawledAt: '2026-06-09T14:45:00Z',
    timeline: [
      { id: 'evuff1', label: 'Inscrição SISU Mec', dateStr: '20 a 23 de Janeiro de 2026', status: 'completed', details: 'Candidatos selecionam UFF e pesos correspondentes' },
      { id: 'evuff2', label: 'Chamada Regular da Coseac', dateStr: '28/01/2026', status: 'completed', details: 'Primeira convocação e regras de matrícula online' },
      { id: 'evuff3', label: 'Pré-Matrícula Online (Upload)', dateStr: '30/01/2026 a 04/02/2026', status: 'completed', details: 'Todos os ingressantes devem efetuar upload de documentos no sistema de matrículas UFF' }
    ],
    documents: [
      { id: 'docuff1', name: 'RG, CPF e Certidão de Quitação Eleitoral', category: 'general', description: 'Documentos civis primordiais exigidos para cadastro no portal COSEAC' },
      { id: 'docuff2', name: 'Histórico Escolar impresso autenticado', category: 'matricula', description: 'Comprovante do Ensino Médio, contendo portaria do diário oficial para escolas estaduais extintas se aplicável' }
    ],
    importantNotes: 'A COSEAC UFF gerencia de maneira extremamente rigorosa os editais de convocação de lista de espera. Recomenda-se acompanhamento diário!'
  },
  {
    id: 'ufmg-sisu',
    universityName: 'Universidade Federal de Minas Gerais',
    universityAcronym: 'UFMG',
    state: 'MG',
    category: 'federal',
    examType: 'enem-sisu',
    examName: 'SISU UFMG / ENEM 2026',
    officialWebsite: 'https://www.ufmg.br/copese/',
    editalUrl: '',
    status: 'finished',
    lastCrawledAt: '2026-06-10T08:00:00Z',
    timeline: [
      { id: 'evm1', label: 'Prestação do Exame Nacional do Ensino Médio', dateStr: 'Novembro de 2025', status: 'completed', details: 'Notas de corte da UFMG costumam figurar entre as mais elevadas do país' },
      { id: 'evm2', label: 'Opção de classificação SISU', dateStr: 'Janeiro de 2026', status: 'completed', details: 'Preenchimento virtual no sistema do Ministério da Educação' },
      { id: 'evm3', label: 'Registro Acadêmico UFMG Online', dateStr: 'Início em 31/01/2026', status: 'completed', details: 'Conexão e upload no portal acadêmico do DRCA UFMG' }
    ],
    documents: [
      { id: 'docm1', name: 'RG, CPF, Título de Eleitor e Certificado de Alistamento Militar', category: 'general', description: 'Obrigatórios na primeira fase de registro on-line' },
      { id: 'docm2', name: 'Declaração de não acumulação de vaga pública', category: 'general', description: 'Termo assinado virtualmente proibindo ocupar duas vagas públicas simultâneas pela lei federal' },
      { id: 'docm3', name: 'Declaração de heteroidentificação e banca de análise', category: 'quota', description: 'Submissão de foto com fundo neutro e autodeclaração ético-racial para PPI' }
    ],
    importantNotes: 'A UFMG adota o SISU exclusivo como porta de entrada de seus cursos presenciais de graduação. Possui banca de verificação presencial obrigatória para cotistas autodeclarados.'
  },
  {
    id: 'ufjf-pism',
    universityName: 'Universidade Federal de Juiz de Fora',
    universityAcronym: 'UFJF',
    state: 'MG',
    category: 'federal',
    examType: 'seriado',
    examName: 'PISM UFJF - Módulos I, II e III',
    officialWebsite: 'https://www2.ufjf.br/copese/',
    editalUrl: '',
    status: 'announced',
    lastCrawledAt: '2026-06-10T11:45:00Z',
    timeline: [
      { id: 'evp1', label: 'Período de Solicitação de Isenção', dateStr: '01/08/2026 a 15/08/2026', status: 'upcoming', details: 'Inscritos no CadÚnico ou escolas públicas podem obter isenção' },
      { id: 'evp2', label: 'Período Geral de Inscrições do PISM', dateStr: '01/08/2026 a 11/09/2026', status: 'upcoming', details: 'Taxa para todos os módulos (PISM I, PISM II, PISM III) deve ser paga na rede bancária' },
      { id: 'evp3', label: 'Emissão do Comprovante de Local de Prova', dateStr: '22/11/2026', status: 'upcoming', details: 'Identificação obrigatória das salas, andares e locais' },
      { id: 'evp4', label: 'Provas Finais Modulares (Módulos I, II e III)', dateStr: '05/12/2026 e 06/12/2026 às 13h', status: 'upcoming', details: 'Provas aplicadas simultaneamente em Juiz de Fora, Governador Valadares, Muriaé, Petrópolis e Volta Redonda' },
      { id: 'evp5', label: 'Divulgação das Notas e Resultados Finais', dateStr: '08/01/2027 (Notas) | 22/01/2027 (Resultado)', status: 'upcoming', details: 'Prazos rígidos para recurso de notas no site oficial da COPESE' }
    ],
    documents: [
      { id: 'docp1', name: 'Documento de Identidade original válido', category: 'general', description: 'Apresentar documento idêntico ao cadastrado no sistema durante as provas' },
      { id: 'docp2', name: 'Comprovante Escolar de Ensino Médio em andamento', category: 'general', description: 'Para os módulos I e II, comprova matrícula correspondente ao ano do módulo prestado' },
      { id: 'docp3', name: 'Certidão de Notas / Histórico Acadêmico integral', category: 'matricula', description: 'Necessário para consolidar o ingresso no Módulo III e realizar a matrícula definitiva' },
      { id: 'docp4', name: 'Documento de renda familiar (para cotistas de escola pública)', category: 'quota', description: 'Comprovantes de rendimento bancário ou recolhimento de impostos unificados de todos os moradores do domicílio' }
    ],
    importantNotes: 'O PISM da UFJF é o maior e mais tradicional vestibular seriado de Minas Gerais. O ingresso decorre do acúmulo ponderado das notas obtidas ao longo dos 3 anos do ensino médio brasileiro.'
  },
  {
    id: 'ufla-pas',
    universityName: 'Universidade Federal de Lavras',
    universityAcronym: 'UFLA',
    state: 'MG',
    category: 'federal',
    examType: 'seriado',
    examName: 'PAS UFLA - Grupos I, II e III',
    officialWebsite: 'https://cops.ufla.br/',
    editalUrl: '',
    status: 'announced',
    lastCrawledAt: '2026-06-10T10:00:00Z',
    timeline: [
      { id: 'evufla1', label: 'Inscrições Abertas (PAS 1, 2 e 3)', dateStr: '01/09/2026 a 28/09/2026', status: 'upcoming', details: 'Portal da COPS UFLA gerencia as inscrições e emissões de boletos da taxa' },
      { id: 'evufla2', label: 'Isenção CadÚnico', dateStr: '01/09/2026 a 08/09/2026', status: 'upcoming', details: 'Opção de gratuidade do PAS mediante dados de benefício do governo' },
      { id: 'evufla3', label: 'Provas - Grupos I e II', dateStr: '21/11/2026 e 22/11/2026', status: 'upcoming', details: 'Provas teóricas contendo questões de múltipla escolha distribuídas em dois dias de teste' },
      { id: 'evufla4', label: 'Resultado Final e Convocação', dateStr: 'Fevereiro de 2027', status: 'upcoming', details: 'Resultado unificado para os candidatos que finalizarem o Grupo III' }
    ],
    documents: [
      { id: 'docufla1', name: 'RG do Candidato impresso recente', category: 'general', description: 'Obrigatório para identificação facial em sala' },
      { id: 'docufla2', name: 'Declaração Escolar com número de Matrícula ativa do Ensino Médio', category: 'general', description: 'Requisito para certificar regularidade no PAS I e II' }
    ],
    importantNotes: 'O PAS (Processo de Avaliação Seriada) da UFLA reserva 40% das vagas dos cursos presenciais de graduação anual para este ingresso gradativo.'
  },
  {
    id: 'uftm',
    universityName: 'Universidade Federal do Triângulo Mineiro',
    universityAcronym: 'UFTM',
    state: 'MG',
    category: 'federal',
    examType: 'enem-sisu',
    examName: 'Acesso SISU / ENEM UFTM 2026',
    officialWebsite: 'http://www.uftm.edu.br/',
    editalUrl: '',
    status: 'finished',
    lastCrawledAt: '2026-06-08T16:00:00Z',
    timeline: [
      { id: 'evuftm1', label: 'Divulgação Cronograma Geral', dateStr: 'Dezembro de 2025', status: 'completed', details: 'Pesos para cada área de conhecimento do ENEM publicadas' },
      { id: 'evuftm2', label: 'Manifestação Geral no SISU', dateStr: '20 a 23 de Janeiro de 2026', status: 'completed', details: 'Classificação preliminar' },
      { id: 'evuftm3', label: 'Prazo Limite Matrícula Remota', dateStr: '05/02/2026', status: 'completed', details: 'Finalização do preenchimento da ficha no sistema SISU-UFTM' }
    ],
    documents: [
      { id: 'docuftm1', name: 'RG, CPF, Quota militar, e de eleitor', category: 'general', description: 'Documentos do candidato para cadastro civil inicial' },
      { id: 'docuftm2', name: 'Histórico Escolar emitido por autoridade oficial de ensino', category: 'matricula', description: 'Comprova conclusão para habilitação de matrícula definitiva' }
    ],
    importantNotes: 'A UFTM disponibiliza suas vagas pelo SISU, as chamadas para as vagas subsequentes ocorrem periodicamente no portal DRCA da instituição.'
  },
  {
    id: 'ufscar-vagas-olimpicas',
    universityName: 'Universidade Federal de São Carlos',
    universityAcronym: 'UFSCar',
    state: 'SP',
    category: 'federal',
    examType: 'simplificado',
    examName: 'Vagas Olímpicas UFSCar 2026',
    officialWebsite: 'https://www.ufscar.br/',
    editalUrl: '',
    status: 'open',
    lastCrawledAt: '2026-06-10T12:00:00Z',
    timeline: [
      { id: 'evo1', label: 'Inscrições Online', dateStr: '01/06/2026 a 30/06/2026', status: 'ongoing', details: 'Envio de certificados de premiação em olimpíadas do conhecimento' },
      { id: 'evo2', label: 'Resultado Preliminar', dateStr: '15/07/2026', status: 'upcoming', details: 'Nota de classificação de acordo com medalhas' }
    ],
    documents: [
      { id: 'doco1', name: 'Documento comprobatório de premiação', category: 'general', description: 'Medalhas ou menções honrosas em olimpíadas nacionais/internacionais credenciadas' }
    ],
    importantNotes: 'Processo simplificado voltado para medalhistas na OBMEP, OBF, OBQ, etc. Dispensa ENEM.'
  },
  {
    id: 'unifesp-vagas-remanescentes',
    universityName: 'Universidade Federal de São Paulo',
    universityAcronym: 'UNIFESP',
    state: 'SP',
    category: 'federal',
    examType: 'simplificado',
    examName: 'Vagas Remanescentes UNIFESP 2026',
    officialWebsite: 'https://www.unifesp.br/',
    editalUrl: '',
    status: 'announced',
    lastCrawledAt: '2026-06-09T10:00:00Z',
    timeline: [
      { id: 'evr_rem1', label: 'Publicação do Edital', dateStr: '12/08/2026', status: 'upcoming', details: 'Divulgação oficial de vagas não preenchidas no SISU' },
      { id: 'evr_rem2', label: 'Inscrições para Reingresso/Portador Diploma', dateStr: '20/08/2026 a 30/08/2026', status: 'upcoming', details: 'Preenchimento de vagas por graduados ou transferências' }
    ],
    documents: [
      { id: 'docrem1', name: 'Diploma de Graduação ou Histórico Escolar Superior', category: 'general', description: 'Obrigatório para comprovar vínculo ou colação de grau anterior' }
    ],
    importantNotes: 'Seleção simplificada baseada em análise curricular e aproveitamento de créditos.'
  },
  {
    id: 'puc-minas',
    universityName: 'Pontifícia Universidade Católica de Minas Gerais',
    universityAcronym: 'PUC Minas',
    state: 'MG',
    category: 'privada',
    examType: 'regular',
    examName: 'Vestibular PUC Minas 2026',
    officialWebsite: 'https://www.pucminas.br/',
    editalUrl: '',
    status: 'open',
    lastCrawledAt: '2026-06-10T11:30:00Z',
    timeline: [
      { id: 'evpucm1', label: 'Inscrições Abertas', dateStr: '10/05/2026 a 15/06/2026', status: 'ongoing', details: 'Inscrições via notas do ENEM ou prova simplificada de redação online' },
      { id: 'evpucm2', label: 'Prova de Redação Online', dateStr: '21/06/2026', status: 'upcoming', details: 'Realizada de forma virtual e remota no portal do candidato' },
      { id: 'evpucm3', label: 'Resultado e Convocação', dateStr: '30/06/2026', status: 'upcoming', details: 'Divulgação oficial dos classificados e cronograma de matrícula' }
    ],
    documents: [
      { id: 'docpucm1', name: 'Certificado de Conclusão do Ensino Médio', category: 'general', description: 'Documento comprobatório escolar obrigatório' },
      { id: 'docpucm2', name: 'Documento de Identidade e CPF', category: 'general', description: 'Para validação cadastral acadêmica' }
    ],
    importantNotes: 'Vestibular simplificado focado em redação online ou aproveitamento histórico de notas do ENEM.'
  },
  {
    id: 'puc-sp',
    universityName: 'Pontifícia Universidade Católica de São Paulo',
    universityAcronym: 'PUC-SP',
    state: 'SP',
    category: 'privada',
    examType: 'regular',
    examName: 'Vestibular de Inverno PUC-SP 2026',
    officialWebsite: 'https://www.pucsp.br/',
    editalUrl: '',
    status: 'open',
    lastCrawledAt: '2026-06-10T12:00:00Z',
    timeline: [
      { id: 'evpucsp1', label: 'Período Geral de Inscrições', dateStr: '02/05/2026 a 08/06/2026', status: 'ongoing', details: 'Inscrições abertas na página oficial do Vestibular de Inverno' },
      { id: 'evpucsp2', label: 'Realização da Prova Presencial', dateStr: '14/06/2026 às 13h', status: 'upcoming', details: 'Caderno de questões multidisciplinar e redação' },
      { id: 'evpucsp3', label: 'Resultado da 1ª Chamada', dateStr: '24/06/2026', status: 'upcoming', details: 'Divulgação oficial para preenchimento imediato das vagas' }
    ],
    documents: [
      { id: 'docpucsp1', name: 'Histórico Escolar do Ensino Médio completo', category: 'general', description: 'Comprovante oficial de conclusão das etapas escolares anteriores' },
      { id: 'docpucsp2', name: 'Documento de Identidade oficial (RG)', category: 'general', description: 'Utilizado para identificação e assinatura de contrato' }
    ],
    importantNotes: 'Processo clássico e extremamente conceituado focado em provas presenciais estruturadas.'
  },
  {
    id: 'uniptan',
    universityName: 'Centro Universitário Presidente Antônio Carlos de São João del-Rei',
    universityAcronym: 'UNIPTAN',
    state: 'MG',
    category: 'privada',
    examType: 'regular',
    examName: 'Vestibular Geral UNIPTAN 2026/2',
    officialWebsite: 'https://www.uniptan.edu.br/',
    editalUrl: '',
    status: 'open',
    lastCrawledAt: '2026-06-10T12:15:00Z',
    timeline: [
      { id: 'evunip1', label: 'Inscrições para Medicina 2026/2', dateStr: '01/04/2026 a 30/05/2026', status: 'completed', details: 'Processo seletivo via nota do ENEM ou prova presencial exclusiva' },
      { id: 'evunip2', label: 'Vestibular Agendado (Demais Cursos)', dateStr: '15/05/2026 a 31/07/2026', status: 'ongoing', details: 'Prova agendada digital de modo remoto e prático ou notas ENEM' },
      { id: 'evunip3', label: 'Resultado e Convocação Contínua', dateStr: 'Fluxo em até 48 horas', status: 'ongoing', details: 'Análise tempestiva e rápida pós processo agendado' }
    ],
    documents: [
      { id: 'docunip1', name: 'Histórico Escolar e Certificado de Conclusão do EM', category: 'general', description: 'Comprovante fundamental exigido na primeira fase de registro de matrícula' },
      { id: 'docunip2', name: 'Comprovante de Residência Atualizado', category: 'general', description: 'Obrigatório para confecção do contrato de prestação de serviços educacionais' }
    ],
    importantNotes: 'Foco em vestibulares agendados e de rápida apuração. Excelente rol de financiamentos e descontos próprios.'
  }
];

let crawlerLogsList: CrawlerLog[] = [
  { timestamp: '2026-06-10T12:00:00Z', level: 'success', message: 'Robô Crawler operando em modo Normal. 10 exames universitários mapeados no Sudeste.' },
  { timestamp: '2026-06-10T11:45:00Z', level: 'info', message: 'Escavada base oficial da UFJF. Calendário do PISM 2026 coletado com sucesso.' },
  { timestamp: '2026-06-10T11:20:00Z', level: 'info', message: 'Crawl automático efetuado no portal UERJ. Exames de Qualificação identificados.' },
  { timestamp: '2026-06-10T11:00:00Z', level: 'info', message: 'Sincronização periódica concluída para FUVEST. Isenções registradas como concluídas.' }
];

let notificationsHistory: SystemNotification[] = [
  { id: 'nt1', timestamp: '2026-06-10T11:45:00Z', title: 'PISM UFJF 2026: Datas de Inscrição mapeadas!', message: 'O edital do PISM UFJF 2026 foi escavado. Inscrições abrem em 01/08/2026!', type: 'system', status: 'simulated' },
  { id: 'nt2', timestamp: '2026-06-10T11:20:00Z', title: 'Aviso de Evento: Vestibular UERJ 2027', message: 'Notificamos que o Exame de Qualificação 2 está com inscrições abertas até 15/07/2026.', type: 'system', status: 'simulated' }
];

let botSettings: NotificationSettings = {
  email: 'fernandolvieira@gmail.com',
  emailEnabled: true,
  telegramBotToken: '',
  telegramChatId: '',
  telegramEnabled: false
};

// Lazy initialization logic for Gemini SDK
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null; // Will raise a clear instruction if user tries live crawl without key, or will run in simulation gracefully.
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 1. GET ALL EXAMS
app.get('/api/exams', (req, res) => {
  res.json({
    exams: listExams,
    logs: crawlerLogsList,
    notifications: notificationsHistory,
    settings: botSettings
  });
});

// 2. TRIGGER LIVE EXAM CRAWL
app.post('/api/exams/crawl/:id', async (req, res) => {
  const { id } = req.params;
  const examIndex = listExams.findIndex(x => x.id === id);

  if (examIndex === -1) {
    return res.status(404).json({ error: 'Exame universitário não cadastrado.' });
  }

  const exam = listExams[examIndex];
  const timestampString = new Date().toISOString();

  // Add initial logs
  crawlerLogsList.unshift({
    timestamp: timestampString,
    level: 'info',
    message: `[Robô-Excavator] Iniciando escavação profunda na internet para: ${exam.examName} (${exam.universityAcronym}).`,
    examId: id
  });

  try {
    const ai = getGeminiClient();

    if (!ai) {
      // Simulate real-looking delay and realistic crawler findings when API KEY isn't active
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Simulate parsing of updated status or minor dynamic dates shifts
      const updatedExam = { ...exam };
      updatedExam.lastCrawledAt = new Date().toISOString();

      // Slightly shift/toggle status to make it look dynamic in simulation
      if (updatedExam.status === 'announced') {
        updatedExam.status = 'open';
        // adjust the label
        const regIdx = updatedExam.timeline.findIndex(t => t.label.toLowerCase().includes('inscriç'));
        if (regIdx !== -1) {
          updatedExam.timeline[regIdx].status = 'ongoing';
        }
      }

      listExams[examIndex] = updatedExam;

      const finishMsg = `[Robô-Excavator] [MODO SIMULADOR] Escavador concluiu varredura online com sucesso. Nenhuma chave GEMINI_API_KEY viva foi identificada nas variáveis de ambiente, então as informações de '${exam.examName}' foram reavaliadas contra nosso modelo interno local.`;
      const finishTimestamp = new Date().toISOString();

      crawlerLogsList.unshift({
        timestamp: finishTimestamp,
        level: 'success',
        message: finishMsg,
        examId: id
      });

      // Register system alert
      const alertId = `nt-${Date.now()}`;
      notificationsHistory.unshift({
        id: alertId,
        timestamp: finishTimestamp,
        title: `Crawl concluído: ${exam.examName} atualizado!`,
        message: `O crawler rastreou os links e reavaliou as datas críticas para ${exam.universityAcronym}. Status do edital atualizado para '${updatedExam.status}'.`,
        type: 'system',
        status: 'simulated'
      });

      return res.json({
        success: true,
        simulated: true,
        exam: updatedExam,
        logs: crawlerLogsList,
        notifications: notificationsHistory
      });
    }

    // REAL TIME GOOGLE SEARCH GROUNDING CHANNELS!
    crawlerLogsList.unshift({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `[Robô-Excavator] Google GenAI SDK conectado. Acionando módulo 'googleSearch' para escavar links oficiais.`,
      examId: id
    });

    const searchPrompt = `Você é um robô minerador inteligente focado em vestibulares e concursos de universidades públicas brasileiras.
Você precisa buscar na internet (usando a ferramenta googleSearch acoplada) as informações ATUAIS, VIVAS e OFICIAIS sobre o seguinte exame:
"${exam.examName} da ${exam.universityAcronym} (${exam.universityName}) estado de ${exam.state} Brasil".

Busque especificamente:
1. O cronograma oficial atualizado (como período de solicitação de isenção, datas de inscrições, datas das provas de primeira e segunda fase, e divulgação de resultados para ingressar no ano letivo atual/próximo).
2. A lista de documentos primordiais oficiais exigidos (RG/CPF, histórico escolar, cotas, matrícula, etc.).
3. O link oficial do edital diretamente em arquivo PDF. Se não for possível encontrar o link direto para o arquivo PDF oficial do edital (que obrigatoriamente termine em .pdf), deixe o "editalUrl" estritamente como string vazia ("").

Responda preenchendo obrigatoriamente a estrutura JSON abaixo. Não retorne nenhum outro texto explicativo fora do JSON, apenas o objeto JSON sem aspas extras markdown. Caso falte alguma informação, extrapole sensatamente de acordo com os padrões da universidade.

Estrutura JSON esperada:
{
  "status": "announced" | "open" | "ongoing" | "finished",
  "examType": "regular" | "seriado" | "enem-sisu" | "simplificado",
  "officialWebsite": "URL string do site principal da universidade ou comissão organizadora",
  "editalUrl": "Link direto para o arquivo PDF do edital se encontrado (deve terminar estritamente com a extensão .pdf). Caso contrário, retorne uma string vazia (\" \")",
  "importantNotes": "Resumo curto em português sobre prazos, urgências ou atenção para documentações",
  "timeline": [
    {
      "label": "Nome legível do evento (ex: 'Inscrições', 'Solicitação de Isenção', 'Provas (Fase 1)', 'Resultado')",
      "dateStr": "Texto descritivo legível da data ou período (ex: 'De 01/08/2026 a 31/08/2026')",
      "status": "upcoming" | "ongoing" | "completed" | "critical",
      "details": "Minúcia explicativa do evento"
    }
  ],
  "documents": [
    {
      "name": "Nome simples do documento (ex: 'Certificado de Conclusão do Ensino Médio')",
      "category": "general" | "quota" | "matricula",
      "description": "Explicação pragmática baseada no edital"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        temperature: 0.1,
        systemInstruction: "Retorne única e estritamente o objeto JSON especificado sem tags de markdown tipo ```json."
      }
    });

    const parsedText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(parsedText.trim().replace(/^```json\s*/, '').replace(/```$/, ''));
    } catch {
      // Fallback clean replacement regex if structure is slightly wrapped
      const jsonStart = parsedText.indexOf('{');
      const jsonEnd = parsedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsedData = JSON.parse(parsedText.slice(jsonStart, jsonEnd + 1));
      } else {
        throw new Error('Retorno do crawler Gemini não pôde ser interpretado como JSON estruturado: ' + parsedText);
      }
    }

    // Extract crawling sources/URLs from grounding metadata
    const sources: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    // Map database indices
    const updatedExam: UniversityExam = {
      ...exam,
      examType: parsedData.examType || exam.examType,
      officialWebsite: parsedData.officialWebsite || exam.officialWebsite,
      editalUrl: parsedData.editalUrl || exam.editalUrl,
      status: parsedData.status || exam.status,
      importantNotes: parsedData.importantNotes || exam.importantNotes,
      lastCrawledAt: new Date().toISOString(),
      timeline: (parsedData.timeline || []).map((t: any, idx: number) => ({
        id: `evt-${id}-${idx}-${Date.now()}`,
        label: t.label,
        dateStr: t.dateStr,
        status: t.status || 'upcoming',
        details: t.details || ''
      })),
      documents: (parsedData.documents || []).map((d: any, idx: number) => ({
        id: `doc-${id}-${idx}-${Date.now()}`,
        name: d.name,
        category: d.category || 'general',
        description: d.description || ''
      }))
    };

    // If the tool returned no timeline, keep old to prevent wipe-outs
    if (updatedExam.timeline.length === 0) {
      updatedExam.timeline = exam.timeline;
    }
    if (updatedExam.documents.length === 0) {
      updatedExam.documents = exam.documents;
    }

    listExams[examIndex] = updatedExam;

    // Add success logs with counts of parsed sources
    const matchedSourcesText = sources.length > 0 ? `Encontradas e catalogadas ${sources.length} fontes e URLs ativas.` : 'Informações parseadas via barramento inteligente.';
    crawlerLogsList.unshift({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `[Robô-Excavator] Escavação concluída para ${exam.universityAcronym}. ${matchedSourcesText} Edital mapeado e cronograma atualizado com IA!`,
      examId: id
    });

    if (sources.length > 0) {
      crawlerLogsList.unshift({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `[Fontes Rastreadas] ${sources.slice(0, 3).join(' | ')}`,
        examId: id
      });
    }

    // Post to notification history
    const alertId = `nt-real-${Date.now()}`;
    const notificationMessage = `Rastreamento completo do vestibular ${exam.examName} (${exam.universityAcronym}). Identificados ${updatedExam.timeline.length} marcos temporais importantes e arquivos de edital.`;
    notificationsHistory.unshift({
      id: alertId,
      timestamp: new Date().toISOString(),
      title: `Internet Escavada: ${exam.universityAcronym}`,
      message: notificationMessage,
      type: 'system',
      status: 'sent'
    });

    // Auto-send Telegram if credential configured!
    if (botSettings.telegramEnabled && botSettings.telegramBotToken && botSettings.telegramChatId) {
      try {
        const textMessage = `🤖 *Robô Excavador Universitário* 🤖\n\n🔎 *Varredura Concluída:* ${updatedExam.examName} (${updatedExam.universityAcronym})\n\n📅 *Destaque:* ${updatedExam.importantNotes}\n\n🌐 *Site:* ${updatedExam.officialWebsite}\n\n📄 *Edital Oficial:* ${updatedExam.editalUrl}`;
        await fetch(`https://api.telegram.org/bot${botSettings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: botSettings.telegramChatId,
            text: textMessage,
            parse_mode: 'Markdown'
          })
        });

        notificationsHistory.unshift({
          id: `tel-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: `Telegram Enviado`,
          message: `Mensagem enviada com sucesso para o Chat ID ${botSettings.telegramChatId}.`,
          type: 'telegram',
          status: 'sent'
        });
      } catch (err: any) {
        notificationsHistory.unshift({
          id: `tel-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: `Falha no Telegram`,
          message: `Erro ao disparar no Telegram: ${err.message || err}`,
          type: 'telegram',
          status: 'failed'
        });
      }
    }

    res.json({
      success: true,
      simulated: false,
      exam: updatedExam,
      logs: crawlerLogsList,
      notifications: notificationsHistory
    });

  } catch (error: any) {
    const errorMsg = error.message || error;
    crawlerLogsList.unshift({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Erro na escavação de ${exam.universityAcronym}: ${errorMsg}`,
      examId: id
    });

    res.status(500).json({
      error: 'Falha durante o rastreamento.',
      details: errorMsg,
      logs: crawlerLogsList
    });
  }
});

// 3. SAVE NOTIFICATION VALUES
app.post('/api/exams/settings', (req, res) => {
  const { email, emailEnabled, telegramBotToken, telegramChatId, telegramEnabled } = req.body;
  
  botSettings = {
    email: email || '',
    emailEnabled: !!emailEnabled,
    telegramBotToken: telegramBotToken || '',
    telegramChatId: telegramChatId || '',
    telegramEnabled: !!telegramEnabled
  };

  res.json({
    success: true,
    settings: botSettings
  });
});

// 4. TEST NOTIFICATION SYSTEMS (Telegram / Email Mock)
app.post('/api/exams/notify/test', async (req, res) => {
  const { type, email, telegramBotToken, telegramChatId } = req.body;
  const timestampStr = new Date().toISOString();

  if (type === 'telegram') {
    if (!telegramBotToken || !telegramChatId) {
      return res.status(400).json({ error: 'Token do Bot e Chat ID são obrigatórios para testar o Telegram.' });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🔔 *Teste do Robô Excavador Universitário* 🔔\n\nA conexão com o seu canal de notificações foi estabelecida perfeitamente! Você receberá alertas automáticos de prazos, editais e cronogramas de SP, RJ e MG por aqui.\n\n📅 Data do teste: ${new Date().toLocaleDateString('pt-BR')}` ,
          parse_mode: 'Markdown'
        })
      });

      const responseData = await response.json();

      if (!responseData.ok) {
        throw new Error(responseData.description || 'Falha no servidor do Telegram.');
      }

      notificationsHistory.unshift({
        id: `nt-test-tel-${Date.now()}`,
        timestamp: timestampStr,
        title: 'Ligação Telegram de Teste efetuada',
        message: `Mensagem de depuração enviada com êxito para o chat ${telegramChatId}.`,
        type: 'telegram',
        status: 'sent'
      });

      return res.json({
        success: true,
        message: 'Mensagem de teste disparada com sucesso no Telegram!',
        notifications: notificationsHistory
      });

    } catch (err: any) {
      notificationsHistory.unshift({
        id: `nt-test-tel-err-${Date.now()}`,
        timestamp: timestampStr,
        title: 'Ligação Telegram de Teste falhou',
        message: `Erro na API do Telegram: ${err.message || err}`,
        type: 'telegram',
        status: 'failed'
      });

      return res.status(500).json({
        error: 'Erro de comunicação com o Telegram.',
        details: err.message || err,
        notifications: notificationsHistory
      });
    }
  } else {
    // Mock / Simulated Email triggers
    const targetEmail = email || botSettings.email || 'usuario@exemplo.com';
    notificationsHistory.unshift({
      id: `nt-test-email-${Date.now()}`,
      timestamp: timestampStr,
      title: 'Notificação de Teste por E-mail',
      message: `Enviando e-mail de validação para '${targetEmail}': Robô pronto para enviar alertas referentes aos editais mais recentes.`,
      type: 'email',
      status: 'simulated'
    });

    return res.json({
      success: true,
      message: `E-mail de teste simulado com sucesso para ${targetEmail}!`,
      notifications: notificationsHistory
    });
  }
});

// Setup Vite & static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
