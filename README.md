# 🏦 Poupo - Sistema de Gestão Financeira Pessoal

Um sistema completo de gestão financeira pessoal desenvolvido com React, Node.js e SQLite, seguindo os princípios da Clean Architecture.

## 🚀 Funcionalidades

### 👤 Gestão de Usuários
- **Registro e Login**: Sistema de autenticação seguro
- **Perfil do Usuário**: Gerenciamento de dados pessoais
- **Painel Admin**: Controle de usuários (banir/desbanir)
- **Logs de Acesso**: Monitoramento de atividades

### 💳 Contas Bancárias
- **Contas de Débito**: Conta corrente, poupança, investimento
- **Cartões de Crédito**: Limite, vencimento da fatura, data de fechamento
- **Edição e Exclusão**: Gerenciamento completo das contas
- **Categorização**: Débito e crédito separados

### 💰 Gestão Financeira
- **Registro de Ganhos**: Controle de receitas com categorização
- **Registro de Gastos**: Despesas com categorização e método de pagamento
- **Despesas Fixas**: Controle de contas recorrentes com parcelamento
- **Transição Mensal**: Reset automático no primeiro dia do mês
- **Boletos e Faturas**: Suporte para contas com vencimento

### 📊 Relatórios e Análises
- **Visão Geral**: Dashboard com resumo financeiro
- **Resumos Detalhados**: Histórico mensal completo
- **Resumos Mensais Automáticos**: Sistema de backup automático
- **Exportação PDF**: Relatórios em formato PDF
- **Conselhos Financeiros**: IA integrada para dicas

### 🤖 Recursos Avançados
- **IA Gemini**: Conselhos financeiros personalizados
- **Sistema de Logs**: Monitoramento detalhado de erros
- **Rate Limiting**: Proteção contra ataques
- **CORS Configurável**: Suporte para múltiplos domínios

## 🏗️ Arquitetura

O projeto segue os princípios da **Clean Architecture**, organizado em camadas bem definidas:

### 📁 Estrutura do Frontend (Clean Architecture)

```
client/src/
├── domain/                    # 🎯 Camada de Domínio
│   ├── entities/             # Entidades de negócio
│   │   ├── User.js
│   │   ├── BankAccount.js
│   │   ├── Expense.js
│   │   ├── Income.js
│   │   └── FixedExpense.js
│   ├── repositories/         # Interfaces dos repositórios
│   │   ├── UserRepository.js
│   │   ├── BankAccountRepository.js
│   │   └── ExpenseRepository.js
│   └── usecases/            # Casos de uso
│       ├── AuthenticationUseCase.js
│       └── BankAccountUseCase.js
├── data/                     # 📊 Camada de Dados
│   ├── repositories/         # Implementações dos repositórios
│   └── datasources/          # Fontes de dados (API)
├── presentation/             # 🎨 Camada de Apresentação
│   ├── components/           # Componentes React
│   ├── pages/               # Páginas da aplicação
│   ├── hooks/               # Custom hooks
│   ├── contexts/            # Contextos React
│   └── utils/               # Utilitários
├── components/              # 🧩 Componentes UI
│   ├── dashboard/           # Componentes do dashboard
│   ├── ui/                  # Componentes base (Button, Card, etc.)
│   └── ErrorLogViewer.js    # Visualizador de logs
├── contexts/                # 🔄 Contextos React
│   ├── AuthContext.js
│   ├── FinancialContext.js
│   └── ThemeContext.js
├── services/                # 🔧 Serviços externos
│   └── api.js               # Configuração da API
└── utils/                   # 🛠️ Utilitários
    ├── detailedLogger.js
    ├── errorLogger.js
    └── testConnection.js
```

### 📁 Estrutura do Backend

```
server/
├── config/                  # Configurações
│   └── database.js          # Configuração do banco SQLite
├── database/               # Banco de dados
│   ├── schema.sql          # Schema principal
│   ├── poupo_final.db      # Banco SQLite
│   └── migrations/         # Migrações do banco
│       ├── add_admin_panel_features.sql
│       ├── add_boleto_and_installments_to_fixed_expenses.sql
│       ├── add_category_to_fixed_expenses.sql
│       ├── add_credit_limit_to_bank_accounts.sql
│       ├── add_due_date_to_bank_accounts.sql
│       ├── add_installments_to_expenses.sql
│       ├── add_is_banned_column.sql
│       ├── add_monthly_transition_to_fixed_expenses.sql
│       └── create_monthly_summaries_table.sql
├── middleware/             # Middlewares
│   ├── auth.js             # Autenticação JWT
│   ├── detailedLogger.js   # Logging detalhado
│   └── errorLogger.js      # Logging de erros
├── routes/                 # Rotas da API
│   ├── auth.js             # Autenticação
│   ├── financial.js        # Gestão financeira
│   └── admin.js            # Painel administrativo
├── services/               # Serviços de negócio
│   ├── monthlySummaryService.js      # Resumos mensais
│   ├── fixedExpenseTransitionService.js  # Transição de despesas
│   └── geminiService.js    # Integração com IA
├── scripts/               # Scripts utilitários
│   └── generateMonthlySummaries.js  # Geração de resumos
├── logs/                  # Arquivos de log
├── index.js               # Servidor principal
├── generate-frontend-env.js  # Geração de .env do frontend
└── env.example            # Exemplo de variáveis de ambiente
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **React Router** - Roteamento da aplicação
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones
- **jsPDF** - Geração de PDFs
- **Axios** - Cliente HTTP
- **React Hook Form** - Gerenciamento de formulários
- **React Hot Toast** - Notificações
- **Recharts** - Gráficos e visualizações
- **Date-fns** - Manipulação de datas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite3** - Banco de dados
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **express-validator** - Validação de dados
- **helmet** - Segurança HTTP
- **cors** - Cross-Origin Resource Sharing
- **express-rate-limit** - Rate limiting
- **multer** - Upload de arquivos
- **moment** - Manipulação de datas

### IA e Automação
- **Google Generative AI (Gemini)** - Conselhos financeiros
- **Cron Jobs** - Automação de tarefas mensais

### Desenvolvimento
- **Concurrently** - Execução simultânea de scripts
- **Nodemon** - Reinicialização automática do servidor
- **Jest** - Framework de testes

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd poupoV2
```

### 2. Instale as dependências
```bash
# Instalar dependências do projeto
npm install

# Instalar dependências do cliente
cd client && npm install

# Instalar dependências do servidor
cd ../server && npm install
```

### 3. Configure as variáveis de ambiente

#### Backend (.env)
```env
# Configurações do Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=poupo_final
DB_PORT=5432

# Configurações de Segurança
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRES_IN=7d

# Configurações da API Gemini
GEMINI_API_KEY=sua_chave_gemini_aqui

# Configurações do Servidor
PORT=5000
NODE_ENV=development

# Configurações de CORS
CORS_ORIGIN=http://localhost:3002

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:5000
HOST=0.0.0.0
PORT=3002
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

### 4. Execute o projeto
```bash
# Na raiz do projeto
npm run dev
```

O projeto estará disponível em:
- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:5000

## 📋 Funcionalidades Detalhadas

### 🔐 Autenticação
- Registro com validação de dados
- Login com JWT
- Verificação de token
- Sistema de banimento de usuários
- Logs de acesso

### 💳 Contas Bancárias
- Criação de contas de débito e crédito
- Edição inline de dados
- Exclusão com confirmação
- Cálculo automático de saldos
- Limites de crédito
- Datas de vencimento

### 💰 Gestão Financeira
- **Ganhos**: Registro com categoria e conta
- **Gastos**: Categorização e método de pagamento
- **Despesas Fixas**: Controle de contas recorrentes com parcelamento
- **Transição Mensal**: Reset automático no primeiro dia
- **Boletos e Faturas**: Suporte para contas com vencimento

### 📊 Relatórios
- **Visão Geral**: Dashboard com métricas
- **Resumos Mensais**: Histórico detalhado
- **Resumos Automáticos**: Sistema de backup mensal
- **Exportação PDF**: Relatórios personalizados
- **Conselhos IA**: Dicas financeiras inteligentes

### 👨‍💼 Painel Admin
- Listagem de usuários
- Sistema de banimento
- Estatísticas do sistema
- Visualização de logs
- Credenciais: `CLAdmin` / `!@#$%622060122`

### 🔍 Sistema de Logs
- Logs detalhados de requisições
- Logs de erros com exportação
- Monitoramento de performance
- Interface para visualização

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Executa frontend e backend
npm run client       # Apenas frontend
npm run server       # Apenas backend

# Build
npm run build        # Build de produção
npm run start        # Executa build de produção

# Instalação
npm run install-all  # Instala todas as dependências

# Limpeza
npm run clean        # Remove node_modules e build
```

## 🧪 Testes

```bash
# Testes do frontend
cd client && npm test

# Testes do backend
cd server && npm test
```

## 📦 Deploy

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Upload da pasta build/
```

### Backend (Railway/Heroku)
```bash
cd server
# Configurar variáveis de ambiente
# Deploy automático via Git
```

## 🗄️ Banco de Dados

### Estrutura Principal
- **users**: Usuários do sistema
- **bank_accounts**: Contas bancárias
- **income**: Receitas
- **expenses**: Despesas
- **fixed_expenses**: Despesas fixas
- **monthly_summaries**: Resumos mensais automáticos
- **financial_advice**: Conselhos financeiros
- **user_login_logs**: Logs de acesso

### Migrações Disponíveis
- Sistema de admin
- Suporte a boletos e parcelamento
- Categorização de despesas fixas
- Limites de crédito
- Datas de vencimento
- Sistema de resumos mensais

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Poupo Team**
- Email: caiolenni@gmail.com
- Website: [caioleonni.com](https://www.caioleonni.com)

## 🙏 Agradecimentos

- [React](https://reactjs.org/) - Biblioteca JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Ícones
- [Google Gemini](https://ai.google.dev/) - IA para conselhos financeiros
- [SQLite](https://www.sqlite.org/) - Banco de dados

---

⭐ **Se este projeto te ajudou, considere dar uma estrela!**
