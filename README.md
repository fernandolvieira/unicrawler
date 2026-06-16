# Portal de Regulamentos e Vestibulares — Frei Seráfico

Este é o repositório completo do **Portal de Vestibulares e Editais**, desenvolvido especificamente para auxiliar alunos e equipe do **Cursinho Frei Seráfico** no acompanhamento tempestivo de datas, cronogramas e documentações para exames nas universidades públicas (Federais e Estaduais) e privadas de **São Paulo (SP)**, **Rio de Janeiro (RJ)** e **Minas Gerais (MG)**.

O portal garante que nenhuma data de inscrição importante seja esquecida, centralizando as informações de editais reais e estruturando cronogramas de processos como FUVEST, UNICAMP, PISM UFJF, PAS UFLA, SISU, PUC Minas, PUC-SP, UNIPTAN, de forma visual e robusta.

---

## 🎨 Funcionalidades Principais

- **📅 Mapa de Calor de Prazos (Interactive Heatmap Calendar)**: Componente dinâmico que contabiliza de forma automatizada e destaca com intensidades de calor os meses com maior concentração de prazos de inscrição ativos (abertura, fechamento, isenção e matrícula). Ao clicar em um mês, o painel expande um cronograma detalhado das datas críticas.
- **🔍 Filtragem Inteligente Multivolume**:
  - **Filtro Geográfico**: SP, RJ e MG.
  - **Dependência Administrativa**: Federal, Estadual e Privada (adicionados recentemente PUC Minas, PUC-SP e UNIPTAN).
  - **Tipologia de Ingresso**: Regular (Vestibular tradicional), Seriado (PISM/PAS), ENEM-Sisu e Simplificado (reingresso, vagas olímpicas).
- **📑 Sistema Rigoroso de Editais**: Exibição seletiva apenas de links diretos que levam a arquivos `.pdf` oficiais de regulamentos. Caso o edital não seja um arquivo PDF direto, o botão correspondente se oculta automaticamente para prevenir frustração do usuário.
- **⚡ Console de Eventos em Tempo Real**: Simulador integrado de monitoramento e crawling que apresenta logs detalhados de varredura automatizada nos portais oficiais das universidades.
- **📱 Interface de Altíssimo Desempenho (Dark Mode Slate)**: Desenhada com foco na usabilidade, tipografia elegante (Inter e JetBrains Mono) e animações suaves de transição suportadas por `motion`.

---

## 🏗️ Arquitetura e Tecnologias

O projeto utiliza uma arquitetura **Full-stack moderna** que acopla de forma otimizada o servidor de API ao ecossistema front-end do Vite para garantir carregamento instantâneo.

- **Frontend**: [React 19](https://react.dev/), [Vite 6](https://vite.dev/), [Tailwind CSS 4](https://tailwindcss.com/) (Estilização utilitária de alta coesão), [Lucide React](https://lucide.dev/) (Ícones vetoriais fluidos), e [motion/react](https://motion.dev/) (Motor de transições interativas).
- **Backend / API**: [Express](https://expressjs.com/) para Node.js rodando nativamente em TypeScript com suporte ao interpretador [tsx](https://github.com/private-repo/tsx).
- **Compilação de Produção**: O backend e o empacotamento de distribuição são gerados em um bundle otimizado escrito em formato CommonJS (`dist/server.cjs`) utilizando [esbuild](https://esbuild.github.io/) para garantir execuções rápidas e compatibilidade absoluta em containers.

---

## 📁 Estrutura de Diretórios

```bash
├── src/
│   ├── components/
│   │   ├── DeadlinesHeatmap.tsx     # Grafico de densidade/prazos de inscrições
│   │   ├── UniversityCard.tsx       # Componente de exibição de regulamentos
│   │   ├── ConsoleLogs.tsx          # Terminal simulador de logs de crawling
│   │   ├── NotificationPanel.tsx    # Painel de alertas inteligentes
│   │   └── FreiSeraficoLogo.tsx     # Elemento visual do logo institucional
│   ├── types.ts                     # Definições estritas de interfaces TypeScript
│   ├── App.tsx                      # Painel central unificado
│   ├── index.css                    # Folhas de estilo globais (Tailwind 4)
│   └── main.tsx                     # Ponto de entrada de renderização do React
├── server.ts                        # Servidor da API Express e motor de mocks
├── vite.config.ts                   # Configurações de build do Vite
├── tsconfig.json                    # Presets de tipagem estrita do TypeScript
├── package.json                     # Scripts de ciclo de vida e dependências
├── .env.example                     # Esqueleto de variáveis de ambiente
└── README.md                        # Documentação essencial
```

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendado)
- Gerenciador de pacotes `npm` ou `yarn`

### Passo 1: Clonar e instalar dependências
Em seu terminal, navegue até a pasta do projeto clonado e instale os pacotes:
```bash
npm install
```

### Passo 2: Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com base no arquivo de exemplo fornecido:
```bash
cp .env.example .env
```
_Nota: configure suas chaves caso de uso posterior de agentes baseados em IA._

### Passo 3: Iniciar o servidor em modo de desenvolvimento
Execute o comando a seguir para inicializar o servidor Express e o plugin de desenvolvimento do Vite simultaneamente na porta `3000`:
```bash
npm run dev
```
Abra seu navegador em `http://localhost:3000` para visualizar a aplicação.

---

## 🚀 Compilação de Produção e Deployment

Para compilar a aplicação inteira para produção, empacotando e servindo tanto os arquivos estáticos compilados pelo Vite quanto o backend integrado compilado pelo `esbuild`:

```bash
# Executa o build simultâneo de frontend e servidors
npm run build

# Inicializa o app pronto para produção
npm run start
```

O bundle otimizado do servidor será gerado em `dist/server.cjs` e se tornará auto-suficiente para subir em servidores como Google Cloud Run, AWS App Runner, Heroku ou VPS tradicionais.

---

## 🔐 Segurança e Exposição de Chaves

**Suas credenciais estão 100% seguras.** 
A arquitetura do portal foi estruturada de forma full-stack (Client + Server):
1. **Sem vazamentos no navegador**: Qualquer chamada futura que demande tokens sensíveis (como a `GEMINI_API_KEY` ou chaves de scraping de terceiros) é realizada estritamente dentro do arquivo `server.ts` de backend.
2. **Tratamento de Segredos**: As chaves são lidas via variáveis protegidas de sistema (`process.env.GEMINI_API_KEY`) e nunca trafegam na payload de bundles Javascript repassados ao navegador do cliente final.
3. **Consumo Seguro**: Pode realizar demonstrações públicas e hospedar o link sem riscos de faturamento indesejado ou varreduras automatizadas do GitHub.

---

## 📂 Como Exportar ou Baixar o Projeto a partir do Google AI Studio

Para publicar este projeto no seu próprio GitHub pessoal ou realizar o download do pacote COMPLETO em arquivo `.zip`:

1. Localize o menu **Settings** (ícone de engrenagem) ou o painel de exportação no canto superior da interface do Google AI Studio.
2. Clique na opção **Export to GitHub** (para criar um repositório privado ou público automaticamente na sua conta GitHub vinculada) ou selecione **Download ZIP** para obter a pasta inteira compactada em seu computador.
3. Caso exporte para o GitHub, todas as atualizações de visualização de prazos, mapa de calor, listagem de universidades privadas e formatação de PDFs realizadas pela IA já estarão plenamente documentadas e commitadas!

---

*Desenvolvido em regime profissional de alta fidelidade para o Cursinho Frei Seráfico. Que este ecossistema ajude dezenas de estudantes nas suas trajetórias de aprovação! 🎓🚀*
