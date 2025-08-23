# 📊 Sistema de Resumos Mensais Automáticos

## 🎯 Visão Geral

O sistema de **Resumos Mensais Automáticos** foi implementado para gerar e armazenar resumos financeiros no final de cada mês, preservando o histórico financeiro dos usuários e melhorando a performance da aplicação.

## ✨ Funcionalidades

### 🔄 **Geração Automática**
- **Quando**: No final de cada mês (último dia)
- **O que**: Gera resumo completo do mês anterior
- **Para quem**: Todos os usuários ativos
- **Armazenamento**: Banco de dados com histórico preservado

### 📈 **Benefícios**
- ✅ **Histórico preservado** - Resumos de meses anteriores ficam "congelados"
- ✅ **Performance melhorada** - Carregamento mais rápido para resumos antigos
- ✅ **Dados consistentes** - Resumos refletem o estado exato do mês
- ✅ **Backup automático** - Preservação de dados históricos

## 🗄️ Estrutura do Banco de Dados

### Tabela: `monthly_summaries`
```sql
CREATE TABLE monthly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month_year TEXT NOT NULL, -- formato: YYYY-MM
    total_income DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    total_fixed_expenses DECIMAL(10,2) DEFAULT 0,
    total_credit_card_expenses DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    income_details TEXT, -- JSON com detalhes das receitas
    expenses_details TEXT, -- JSON com detalhes das despesas
    fixed_expenses_details TEXT, -- JSON com detalhes das despesas fixas
    credit_card_expenses_details TEXT, -- JSON com detalhes das despesas de crédito
    bank_accounts_summary TEXT, -- JSON com resumo das contas bancárias
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month_year),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🚀 Como Usar

### 1. **Geração Manual via Interface**
- Acesse a aba "Resumos Detalhados"
- O sistema verifica automaticamente se há resumos pendentes
- Modal aparece oferecendo opções:
  - **Gerar Último Mês**: Gera apenas o resumo do mês anterior
  - **Gerar Todos os Pendentes**: Gera resumos de todos os meses desde a criação da conta

### 2. **Geração Automática via Script**
```bash
# Gerar resumos do mês anterior para todos os usuários
node server/scripts/generateMonthlySummaries.js

# Gerar todos os resumos pendentes (histórico completo)
node server/scripts/generateMonthlySummaries.js pending
```

### 3. **Configuração de Cron Job (Recomendado)**
```bash
# Adicionar ao crontab para executar no último dia de cada mês às 23:59
59 23 28-31 * * [ "$(date +\%d -d tomorrow)" = "01" ] && cd /path/to/poupoV2/server && node scripts/generateMonthlySummaries.js
```

## 🔧 API Endpoints

### Verificar Geração Necessária
```http
GET /financial/monthly-summaries/check-generation
```

### Gerar Resumo Específico
```http
POST /financial/monthly-summaries/generate
Content-Type: application/json

{
  "monthYear": "2024-01"
}
```

### Listar Todos os Resumos
```http
GET /financial/monthly-summaries
```

### Buscar Resumo Específico
```http
GET /financial/monthly-summaries/2024-01
```

### Gerar Todos os Pendentes
```http
POST /financial/monthly-summaries/generate-all-pending
```

## 📱 Interface do Usuário

### Indicadores Visuais
- 🟢 **Armazenado**: Resumo foi gerado e armazenado no banco
- 🔵 **Tempo Real**: Resumo calculado em tempo real (não armazenado)
- 📅 **Data de Geração**: Mostra quando o resumo foi criado

### Modal de Geração
- Aparece automaticamente quando há resumos pendentes
- Opções para gerar último mês ou todos os pendentes
- Feedback visual durante o processo

## 🔄 Fluxo de Funcionamento

### 1. **Verificação Automática**
```javascript
// Ao acessar "Resumos Detalhados"
const result = await checkMonthlySummaryGeneration();
if (result.needsGeneration) {
  // Mostrar modal de geração
}
```

### 2. **Geração do Resumo**
```javascript
// Gerar resumo do mês anterior
const summary = await generateSummary(userId, monthYear);
await storeMonthlySummary(userId, monthYear, summary);
```

### 3. **Carregamento Inteligente**
```javascript
// Primeiro tenta buscar resumo armazenado
const stored = await getMonthlySummary(monthYear);
if (stored) {
  return stored; // Resumo armazenado
} else {
  return await loadSummary(monthYear); // Geração em tempo real
}
```

## 📊 Dados Incluídos no Resumo

### Receitas
- Total de receitas do mês
- Detalhes de cada receita (data, valor, conta, categoria)

### Despesas
- Total de despesas (excluindo cartão de crédito)
- Detalhes de cada despesa (data, valor, conta, categoria, método de pagamento)

### Despesas Fixas
- Total de despesas fixas pagas no mês
- Detalhes de cada despesa fixa (descrição, valor, vencimento, status)

### Cartão de Crédito
- Total de gastos com cartão de crédito
- Detalhes de cada gasto (data, valor, cartão, categoria)

### Contas Bancárias
- Resumo das contas no final do mês
- Saldos, limites de crédito, tipos de conta

## 🛠️ Manutenção

### Limpeza de Dados Antigos
```sql
-- Remover resumos mais antigos que 2 anos (opcional)
DELETE FROM monthly_summaries 
WHERE created_at < datetime('now', '-2 years');
```

### Backup dos Resumos
```bash
# Backup da tabela de resumos
sqlite3 database/poupo_final.db ".backup monthly_summaries_backup.db"
```

## 🚨 Considerações Importantes

### Performance
- Resumos armazenados carregam muito mais rápido
- Geração em tempo real pode ser lenta para meses com muitos dados
- Índices criados para otimizar consultas

### Armazenamento
- Cada resumo ocupa aproximadamente 5-50KB (dependendo dos dados)
- Recomendado monitorar o crescimento da tabela
- Considerar limpeza periódica de dados muito antigos

### Consistência
- Resumos são gerados com dados do momento da geração
- Mudanças posteriores não afetam resumos já gerados
- Para atualizar resumo existente, deletar e regenerar

## 🎉 Resultado Final

Com este sistema implementado, os usuários terão:

1. **Resumos automáticos** no final de cada mês
2. **Histórico preservado** de todos os meses
3. **Performance melhorada** ao visualizar resumos antigos
4. **Dados consistentes** e confiáveis
5. **Interface intuitiva** com indicadores visuais claros

O sistema garante que nenhum dado financeiro seja perdido e que os resumos sejam sempre precisos e acessíveis rapidamente! 🚀
