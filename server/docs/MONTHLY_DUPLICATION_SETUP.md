# Configuração da Duplicação Mensal Automática de Despesas Fixas

## 📋 Visão Geral

O sistema agora possui funcionalidade para duplicar automaticamente as despesas fixas no dia 1 de cada mês. Isso permite que o usuário só precise registrar novas despesas, enquanto as existentes são automaticamente recriadas.

## 🔧 Como Funciona

### 1. **Detecção Automática**
- O sistema verifica se é dia 1 do mês
- Se for dia 1, executa a duplicação automaticamente
- Se não for dia 1, não executa nada

### 2. **Duplicação Inteligente**
- Duplica apenas despesas que **não foram deletadas** (`deleted_at IS NULL`)
- Evita duplicar despesas que já existem para o mês atual
- Mantém todas as informações originais (valor, vencimento, categoria, etc.)

### 3. **Execução Automática**
- **Middleware**: Executa automaticamente quando usuários fazem login no dia 1
- **Cron Job**: Executa via script agendado no dia 1 às 00:01
- **Manual**: Pode ser executado manualmente via API

## 🚀 Configuração do Cron Job

### Windows (Task Scheduler)
1. Abra o **Agendador de Tarefas**
2. Clique em **Criar Tarefa Básica**
3. Configure:
   - **Nome**: "Duplicação Mensal Despesas Fixas"
   - **Disparador**: Mensal, dia 1, às 00:01
   - **Ação**: Iniciar programa
   - **Programa**: `node`
   - **Argumentos**: `scripts/monthlyExpenseDuplication.js`
   - **Diretório**: `C:\caminho\para\projeto\server`

### Linux/Mac (Crontab)
```bash
# Editar crontab
crontab -e

# Adicionar linha para executar no dia 1 de cada mês às 00:01
1 0 1 * * cd /caminho/para/projeto/server && node scripts/monthlyExpenseDuplication.js >> logs/monthly_duplication.log 2>&1
```

## 📊 Monitoramento

### Logs do Sistema
O sistema gera logs detalhados:
```
🔄 Executando duplicação mensal automática - 01/09/2025
👥 Encontrados 2 usuários ativos
👤 Processando usuário: João Silva (ID: 1)
  📋 Encontradas 3 despesas ativas
    ✅ Duplicada: Aluguel - R$ 1200
    ✅ Duplicada: Energia - R$ 150
    ⏭️ Já existe: Internet - R$ 80
✅ 2 despesas duplicadas para João Silva
```

### Verificação Manual
```bash
# Executar manualmente para teste
cd server
node scripts/monthlyExpenseDuplication.js
```

## 🔌 API Endpoints

### Executar Duplicação Manual
```http
POST /api/financial/fixed-expenses/execute-monthly-duplication
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "executed": true,
  "totalDuplicated": 5,
  "totalUsers": 2,
  "totalErrors": 0,
  "monthYear": "2025-09"
}
```

## 🛡️ Segurança e Controle

### 1. **Prevenção de Duplicação**
- Verifica se já foi executada no mês atual
- Evita duplicar despesas já existentes
- Usa transações para garantir consistência

### 2. **Soft Delete**
- Despesas deletadas não são duplicadas
- Campo `deleted_at` controla exclusão lógica
- Histórico é preservado

### 3. **Controle de Usuários**
- Processa apenas usuários ativos
- Ignora usuários banidos ou deletados
- Logs detalhados para auditoria

## 📈 Benefícios

1. **Automatização**: Usuário não precisa recriar despesas mensalmente
2. **Flexibilidade**: Pode deletar despesas que não quer mais
3. **Controle**: Sistema inteligente evita duplicações desnecessárias
4. **Auditoria**: Logs completos de todas as operações
5. **Performance**: Execução em background não afeta o sistema

## 🔧 Troubleshooting

### Problema: Duplicação não executa
**Solução:**
1. Verificar se é dia 1 do mês
2. Verificar logs do sistema
3. Executar manualmente para teste

### Problema: Despesas duplicadas incorretamente
**Solução:**
1. Verificar campo `deleted_at` das despesas
2. Verificar se `month_year` está correto
3. Executar script de limpeza se necessário

### Problema: Cron job não executa
**Solução:**
1. Verificar permissões do arquivo
2. Verificar caminho do Node.js
3. Verificar logs do sistema operacional

## 📝 Exemplo de Uso

### Cenário: Usuário com 3 despesas fixas
1. **Janeiro**: Usuário cria 3 despesas fixas
2. **Fevereiro 1º**: Sistema duplica automaticamente as 3 despesas
3. **Fevereiro**: Usuário deleta 1 despesa (não quer mais)
4. **Março 1º**: Sistema duplica apenas 2 despesas (a deletada não é duplicada)
5. **Março**: Usuário adiciona 1 nova despesa
6. **Abril 1º**: Sistema duplica 3 despesas (2 antigas + 1 nova)

### Resultado:
- **Janeiro**: 3 despesas
- **Fevereiro**: 3 despesas (duplicadas)
- **Março**: 2 despesas (duplicadas) + 1 nova = 3 despesas
- **Abril**: 3 despesas (duplicadas)

## 🎯 Conclusão

O sistema de duplicação mensal automática oferece:
- **Conveniência** para o usuário
- **Controle** sobre quais despesas duplicar
- **Confiabilidade** com logs e verificações
- **Flexibilidade** para diferentes cenários de uso

A configuração é simples e o sistema é robusto, garantindo que as despesas fixas sejam sempre atualizadas mensalmente sem intervenção manual.
