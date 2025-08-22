# Sistema de Logs de Erro Detalhado

## Visão Geral
Implementei um sistema completo de logs de erro que captura detalhadamente todos os problemas que ocorrem tanto no frontend quanto no backend.

## Funcionalidades

### Frontend (Browser)
- **Captura automática** de erros JavaScript
- **Logs de API** com detalhes completos das requisições
- **Logs de validação** de formulários
- **Persistência** no localStorage
- **Interface visual** para consulta dos logs

### Backend (Servidor)
- **Logs de requisições** com detalhes completos
- **Logs de validação** do Express Validator
- **Logs de banco de dados** com queries e parâmetros
- **Persistência** em arquivo JSON
- **APIs** para consulta e exportação

## Como Usar

### 1. Visualizar Logs no Frontend
1. Acesse a aplicação
2. Vá para: `http://localhost:3000/logs` (ou sua URL + `/logs`)
3. Você verá uma interface com todos os logs capturados
4. Use os filtros para encontrar logs específicos
5. Clique em "Detalhes" para ver informações completas

### 2. Comandos no Console do Browser
```javascript
// Ver todos os logs
window.errorLogger.getLogs()

// Ver logs por tipo
window.errorLogger.getLogsByLevel('API_ERROR')

// Mostrar logs organizados no console
window.errorLogger.showLogsInConsole()

// Exportar logs
window.errorLogger.exportLogs()

// Limpar logs
window.errorLogger.clearLogs()
```

### 3. Visualizar Logs do Backend
```bash
# Ver logs via API (apenas em desenvolvimento)
curl http://localhost:5000/api/logs

# Ver logs de um tipo específico
curl "http://localhost:5000/api/logs?level=VALIDATION_ERROR"

# Exportar logs
curl http://localhost:5000/api/logs/export -o logs.json

# Limpar logs
curl -X DELETE http://localhost:5000/api/logs
```

### 4. Arquivos de Log do Backend
Os logs do backend são salvos em:
```
server/logs/error-logs.json
server/logs/error-logs-export-YYYY-MM-DD.json
```

## Tipos de Logs Capturados

### Frontend
- `ERROR`: Erros JavaScript não tratados
- `PROMISE_ERROR`: Promessas rejeitadas não tratadas
- `API_ERROR`: Erros em requisições para a API
- `EXPENSE_ERROR`: Erros específicos do registro de gastos
- `VALIDATION_ERROR`: Erros de validação de formulários
- `CONSOLE_ERROR`: Chamadas para console.error
- `CONSOLE_WARN`: Chamadas para console.warn

### Backend
- `REQUEST_ERROR`: Erros em requisições HTTP
- `VALIDATION_ERROR`: Erros de validação do Express Validator
- `DATABASE_ERROR`: Erros de banco de dados
- `API_ERROR`: Erros específicos da API

## Informações Capturadas

### Para Cada Log
- **Timestamp**: Data e hora exata
- **Nível**: Tipo do erro
- **Mensagem**: Descrição do problema
- **URL**: Página onde ocorreu (frontend)
- **User Agent**: Navegador e sistema (frontend)
- **Dados**: Informações específicas do erro

### Para Erros de API
- **Endpoint**: URL da requisição
- **Método**: GET, POST, PUT, DELETE
- **Dados enviados**: Body da requisição
- **Resposta**: Status, headers, dados
- **Stack trace**: Localização exata do erro

## Debug do Erro 400

Para investigar o erro 400 ao registrar gastos:

1. **No Frontend**:
   - Acesse `/logs`
   - Filtre por `API_ERROR` ou `EXPENSE_ERROR`
   - Procure pela requisição POST `/financial/expenses`

2. **No Backend**:
   - Verifique o arquivo `server/logs/error-logs.json`
   - Procure por logs com `VALIDATION_ERROR` ou `REQUEST_ERROR`
   - Verifique os dados enviados e os erros de validação

3. **No Console do Browser**:
   ```javascript
   window.errorLogger.showLogsInConsole()
   ```

## Exemplo de Log de Erro 400
```json
{
  "id": 1234567890,
  "level": "VALIDATION_ERROR",
  "message": "Erro de validação",
  "data": {
    "method": "POST",
    "url": "/api/financial/expenses",
    "body": {
      "amount": "50.00",
      "description": "Teste",
      "payment_method": "debito",
      "expense_date": "2024-08-22",
      "bank_account_id": ""
    },
    "errors": [
      {
        "msg": "ID da conta bancária inválido",
        "param": "bank_account_id",
        "location": "body"
      }
    ]
  },
  "timestamp": "2024-08-22T23:15:30.123Z"
}
```

## Limpeza de Logs

### Frontend
- Os logs são automaticamente limitados aos últimos 100
- Use `window.errorLogger.clearLogs()` para limpar manualmente

### Backend
- Os logs são automaticamente limitados aos últimos 1000
- Use a API DELETE `/api/logs` para limpar manualmente
- Os arquivos de exportação são mantidos até limpeza manual

## Segurança

- **Frontend**: Logs são salvos apenas no localStorage do usuário
- **Backend**: APIs de logs só funcionam em modo desenvolvimento
- **Produção**: Considere desabilitar ou limitar os logs em produção

## Próximos Passos

1. Teste o registro de gastos
2. Verifique os logs em `/logs`
3. Identifique o erro específico
4. Aplique as correções necessárias
5. Teste novamente para confirmar a solução
