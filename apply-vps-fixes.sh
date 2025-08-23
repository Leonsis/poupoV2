#!/bin/bash

echo "=== APLICANDO CORREÇÕES NA VPS ==="
echo "Diretório atual: $(pwd)"

# Verificar se estamos no diretório correto
if [ ! -f "server/routes/financial.js" ]; then
    echo "❌ ERRO: Arquivo server/routes/financial.js não encontrado!"
    echo "Certifique-se de estar no diretório raiz do projeto (poupoVFinal-main)"
    exit 1
fi

echo "✅ Arquivo server/routes/financial.js encontrado"

# Fazer backup do arquivo original
echo "📋 Fazendo backup do arquivo original..."
cp server/routes/financial.js server/routes/financial.js.backup
echo "✅ Backup criado: server/routes/financial.js.backup"

# Verificar se o import do errorLogger já existe
if grep -q "const { errorLogger } = require('../middleware/errorLogger');" server/routes/financial.js; then
    echo "✅ Import do errorLogger já existe"
else
    echo "❌ Import do errorLogger não encontrado - será necessário adicionar manualmente"
fi

# Aplicar as correções no bloco de validação
echo "🔧 Aplicando correções no bloco de validação..."

# Criar arquivo temporário com as correções
cat > temp_validation_fix.js << 'EOF'
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
EOF

# Aplicar a correção usando sed
sed -i '/const errors = validationResult(req);/,/return res.status(400).json({/c\
        const errors = validationResult(req);\
        if (!errors.isEmpty()) {\
            // Log detalhado dos erros de validação\
            errorLogger.logValidationError(req, errors);\
            \
            // Log adicional para debug\
            console.log("=== ERROS DE VALIDAÇÃO DETALHADOS ===");\
            console.log("Body recebido:", JSON.stringify(req.body, null, 2));\
            console.log("Erros encontrados:", JSON.stringify(errors.array(), null, 2));\
            errors.array().forEach((error, index) => {\
                console.log(`Erro ${index + 1}: Campo="${error.path}", Valor="${error.value}", Mensagem="${error.msg}"`);\
            });\
            console.log("=====================================");\
            \
            return res.status(400).json({\
                success: false,\
                errors: errors.array()\
            });\
        }' server/routes/financial.js

echo "✅ Correções aplicadas no arquivo server/routes/financial.js"

# Verificar se as correções foram aplicadas
if grep -q "=== ERROS DE VALIDAÇÃO DETALHADOS ===" server/routes/financial.js; then
    echo "✅ Correções aplicadas com sucesso!"
else
    echo "❌ ATENÇÃO: As correções podem não ter sido aplicadas corretamente"
    echo "Verifique manualmente o arquivo server/routes/financial.js"
fi

# Limpar arquivo temporário
rm -f temp_validation_fix.js

echo ""
echo "=== PRÓXIMOS PASSOS ==="
echo "1. Reiniciar o servidor: npm start (na pasta server)"
echo "2. Testar o registro de um novo gasto"
echo "3. Verificar os logs detalhados no console do servidor"
echo ""
echo "Se precisar reverter as mudanças:"
echo "cp server/routes/financial.js.backup server/routes/financial.js"
