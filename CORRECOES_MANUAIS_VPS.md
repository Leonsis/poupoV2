# Correções Manuais para VPS - Erro 400 em Expenses

## Passo a Passo Manual

### 1. Fazer Backup
```bash
cd /var/www/poupoVFinal-main
cp server/routes/financial.js server/routes/financial.js.backup
```

### 2. Editar o Arquivo
```bash
nano server/routes/financial.js
```

### 3. Localizar o Bloco de Validação
Procure por este bloco (por volta da linha 480-520):
```javascript
const errors = validationResult(req);
if (!errors.isEmpty()) {
    // Log detalhado dos erros de validação
    errorLogger.logValidationError(req, errors);
    
    return res.status(400).json({
        success: false,
        errors: errors.array()
    });
}
```

### 4. Substituir pelo Novo Bloco
Substitua o bloco acima por:
```javascript
const errors = validationResult(req);
if (!errors.isEmpty()) {
    // Log detalhado dos erros de validação
    errorLogger.logValidationError(req, errors);
    
    // Log adicional para debug
    console.log('=== ERROS DE VALIDAÇÃO DETALHADOS ===');
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    console.log('Erros encontrados:', JSON.stringify(errors.array(), null, 2));
    errors.array().forEach((error, index) => {
        console.log(`Erro ${index + 1}: Campo="${error.path}", Valor="${error.value}", Mensagem="${error.msg}"`);
    });
    console.log('=====================================');
    
    return res.status(400).json({
        success: false,
        errors: errors.array()
    });
}
```

### 5. Verificar Import
No topo do arquivo, verifique se existe:
```javascript
const { errorLogger } = require('../middleware/errorLogger');
```

Se não existir, adicione após as outras linhas de import.

### 6. Salvar e Sair
- Pressione `Ctrl + X`
- Pressione `Y` para confirmar
- Pressione `Enter`

### 7. Reiniciar o Servidor
```bash
cd server
npm start
```

### 8. Testar
1. Tentar registrar um novo gasto
2. Verificar os logs no console do servidor
3. Se houver erro 400, agora você verá os detalhes completos

## Comandos Rápidos

### Aplicar Script Automático:
```bash
chmod +x apply-vps-fixes.sh
./apply-vps-fixes.sh
```

### Verificar se as correções foram aplicadas:
```bash
grep -n "ERROS DE VALIDAÇÃO DETALHADOS" server/routes/financial.js
```

### Reverter mudanças se necessário:
```bash
cp server/routes/financial.js.backup server/routes/financial.js
```

## Logs Esperados

Após as correções, quando tentar registrar um gasto, você deve ver:
```
=== ERROS DE VALIDAÇÃO DETALHADOS ===
Body recebido: {
  "amount": "10",
  "expense_date": "2025-08-22",
  "payment_method": "debito",
  "installments": "",
  "description": "teste",
  "category": "teste",
  "bank_account_id": "45"
}
Erros encontrados: [
  {
    "type": "field",
    "value": "valor_que_falhou",
    "msg": "mensagem_de_erro",
    "path": "campo_que_falhou",
    "location": "body"
  }
]
Erro 1: Campo="campo_que_falhou", Valor="valor_que_falhou", Mensagem="mensagem_de_erro"
=====================================
```
