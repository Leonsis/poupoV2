# Correções para VPS - Erro 400 ao Registrar Gastos

## Problema Identificado
O erro 400 (Bad Request) ao registrar gastos estava ocorrendo devido a problemas na validação dos campos no backend, especificamente com campos opcionais que estavam sendo enviados como strings vazias.

## Correções Aplicadas

### 1. Melhoria na Validação de Campos Opcionais
- **bank_account_id**: Agora aceita valores vazios, null ou undefined
- **installments**: Agora aceita valores vazios, null ou undefined
- **expense_date**: Melhorada para aceitar diferentes formatos de data

### 2. Processamento de Dados
- Adicionado processamento que converte valores vazios para `null`
- Garantia de que números sejam do tipo correto

### 3. Logs de Debug
- Adicionados logs detalhados para facilitar o debug

## Arquivos Modificados

### `server/routes/financial.js`
- Linhas 446-492: Validações melhoradas para campos opcionais
- Linhas 493-520: Processamento de dados antes da inserção
- Linhas 521-580: Logs de debug adicionados

## Como Aplicar na VPS

### Opção 1: Upload Manual
1. Faça backup do arquivo atual na VPS:
   ```bash
   cp /caminho/para/server/routes/financial.js /caminho/para/server/routes/financial.js.backup
   ```

2. Faça upload do arquivo `server/routes/financial.js` modificado para a VPS

3. Reinicie o servidor:
   ```bash
   pm2 restart all
   # ou
   npm start
   ```

### Opção 2: Aplicar Correções Manualmente
Se preferir aplicar apenas as correções específicas:

1. **Validação de bank_account_id** (linha ~485):
   ```javascript
   body('bank_account_id').optional().custom((value) => {
       if (value === '' || value === null || value === undefined) {
           return true; // Permite valores vazios
       }
       const num = parseInt(value);
       return !isNaN(num) && num > 0;
   }).withMessage('ID da conta bancária inválido')
   ```

2. **Validação de installments** (linha ~480):
   ```javascript
   body('installments').optional().custom((value) => {
       if (value === '' || value === null || value === undefined) {
           return true; // Permite valores vazios
       }
       const num = parseInt(value);
       return !isNaN(num) && num >= 1 && num <= 24;
   }).withMessage('Número de parcelas deve estar entre 1 e 24')
   ```

3. **Processamento de dados** (após linha 500):
   ```javascript
   const processedData = {
       amount: parseFloat(amount),
       description: description || null,
       payment_method,
       expense_date,
       category: category || null,
       installments: installments && installments !== '' ? parseInt(installments) : null,
       bank_account_id: bank_account_id && bank_account_id !== '' ? parseInt(bank_account_id) : null
   };
   ```

## Teste das Correções

Após aplicar as correções:

1. Tente registrar um gasto sem selecionar conta bancária
2. Tente registrar um gasto em débito/PIX sem parcelas
3. Tente registrar um gasto em crédito com parcelas
4. Verifique os logs do servidor para confirmar que não há mais erros 400

## Logs de Debug

Os logs adicionados mostrarão:
- Dados recebidos no body
- User ID
- Headers da requisição
- Content-Type
- Dados processados

Isso ajudará a identificar qualquer problema futuro.

## Rollback

Se algo der errado, você pode restaurar o backup:
```bash
cp /caminho/para/server/routes/financial.js.backup /caminho/para/server/routes/financial.js
```
