# 🏦 Poupo - Sistema de Gestão Financeira Pessoal

Um sistema completo de gestão financeira pessoal desenvolvido com React, Node.js e SQLite, seguindo os princípios da Clean Architecture.

## 🚀 Funcionalidades

### 👤 Gestão de Usuários
- **Registro e Login**: Sistema de autenticação seguro
- **Perfil do Usuário**: Gerenciamento de dados pessoais
- **Painel Admin**: Controle de usuários (banir/desbanir)

### 💳 Contas Bancárias
- **Contas de Débito**: Conta corrente, poupança, investimento
- **Cartões de Crédito**: Limite, vencimento da fatura
- **Edição e Exclusão**: Gerenciamento completo das contas

### 💰 Gestão Financeira
- **Registro de Ganhos**: Controle de receitas
- **Registro de Gastos**: Despesas com categorização
- **Despesas Fixas**: Controle de contas recorrentes
- **Transição Mensal**: Reset automático no primeiro dia do mês

### 📊 Relatórios e Análises
- **Visão Geral**: Dashboard com resumo financeiro
- **Resumos Detalhados**: Histórico mensal completo
- **Exportação PDF**: Relatórios em formato PDF
- **Conselhos Financeiros**: IA integrada para dicas

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
└── services/                # 🔧 Serviços externos
    └── api.js               # Configuração da API
```

### 📁 Estrutura do Backend

```
server/
├── config/                  # Configurações
│   └── database.js
├── database/               # Banco de dados
│   └── schema.sql
├── middleware/             # Middlewares
│   ├── auth.js
│   ├── detailedLogger.js
│   └── errorLogger.js
├── routes/                 # Rotas da API
│   ├── auth.js
│   ├── financial.js
│   └── admin.js
├── services/               # Serviços de negócio
│   ├── monthlySummaryService.js
│   ├── fixedExpenseTransitionService.js
│   └── geminiService.js
└── scripts/               # Scripts utilitários
    └── generateMonthlySummaries.js
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **React Router** - Roteamento da aplicação
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones
- **jsPDF** - Geração de PDFs
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite3** - Banco de dados
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **express-validator** - Validação de dados
- **helmet** - Segurança HTTP
- **cors** - Cross-Origin Resource Sharing

### IA e Automação
- **Google Generative AI (Gemini)** - Conselhos financeiros
- **Cron Jobs** - Automação de tarefas mensais

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
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui
DATABASE_PATH=./database/poupo_final.db
GEMINI_API_KEY=sua_chave_gemini_aqui
```

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 4. Execute o projeto
```bash
# Na raiz do projeto
npm run dev
```

O projeto estará disponível em:
- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3001

## 📋 Funcionalidades Detalhadas

### 🔐 Autenticação
- Registro com validação de dados
- Login com JWT
- Verificação de token
- Sistema de banimento de usuários

### 💳 Contas Bancárias
- Criação de contas de débito e crédito
- Edição inline de dados
- Exclusão com confirmação
- Cálculo automático de saldos

### 💰 Gestão Financeira
- **Ganhos**: Registro com categoria e conta
- **Gastos**: Categorização e método de pagamento
- **Despesas Fixas**: Controle de contas recorrentes
- **Transição Mensal**: Reset automático no primeiro dia

### 📊 Relatórios
- **Visão Geral**: Dashboard com métricas
- **Resumos Mensais**: Histórico detalhado
- **Exportação PDF**: Relatórios personalizados
- **Conselhos IA**: Dicas financeiras inteligentes

### 👨‍💼 Painel Admin
- Listagem de usuários
- Sistema de banimento
- Estatísticas do sistema
- Credenciais: `CLAdmin` / `!@#$%622060122`

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Executa frontend e backend
npm run client       # Apenas frontend
npm run server       # Apenas backend

# Build
npm run build        # Build de produção
npm run start        # Executa build de produção

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
- Email: contato@poupo.com
- GitHub: [@poupo-team](https://github.com/poupo-team)

## 🙏 Agradecimentos

- [React](https://reactjs.org/) - Biblioteca JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Ícones
- [Google Gemini](https://ai.google.dev/) - IA para conselhos financeiros

---

⭐ **Se este projeto te ajudou, considere dar uma estrela!**
