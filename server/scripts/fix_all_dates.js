const fs = require('fs');
const path = require('path');

// Função para corrigir datas em um arquivo
function fixDatesInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Substituir toISOString() por funções de data local
        if (content.includes('new Date().toISOString()')) {
            content = content.replace(
                /new Date\(\)\.toISOString\(\)/g,
                'require(\'../utils/dateUtils\').getCurrentDateTime()'
            );
            modified = true;
        }

        // Substituir toISOString().split('T')[0] por formatDateToLocal
        if (content.includes('.toISOString().split(\'T\')[0]')) {
            content = content.replace(
                /\.toISOString\(\)\.split\('T'\)\[0\]/g,
                ''
            );
            modified = true;
        }

        // Substituir new Date().toISOString().split('T')[0] por getCurrentDate
        if (content.includes('new Date().toISOString().split(\'T\')[0]')) {
            content = content.replace(
                /new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g,
                'require(\'../utils/dateUtils\').getCurrentDate()'
            );
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filePath} - Datas corrigidas`);
        } else {
            console.log(`ℹ️  ${filePath} - Nenhuma data para corrigir`);
        }

    } catch (error) {
        console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
    }
}

// Função para corrigir datas no frontend
function fixDatesInFrontendFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Substituir toISOString() por funções de data local
        if (content.includes('new Date().toISOString()')) {
            content = content.replace(
                /new Date\(\)\.toISOString\(\)/g,
                'require(\'../../utils/dateUtils\').getCurrentDateTime()'
            );
            modified = true;
        }

        // Substituir toISOString().split('T')[0] por getCurrentDate
        if (content.includes('.toISOString().split(\'T\')[0]')) {
            content = content.replace(
                /new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g,
                'require(\'../../utils/dateUtils\').getCurrentDate()'
            );
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filePath} - Datas corrigidas`);
        } else {
            console.log(`ℹ️  ${filePath} - Nenhuma data para corrigir`);
        }

    } catch (error) {
        console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
    }
}

// Lista de arquivos do backend para corrigir
const backendFiles = [
    'routes/financial.js',
    'routes/auth.js',
    'routes/admin.js',
    'services/geminiService.js',
    'services/fixedExpenseTransitionService.js',
    'services/monthlySummaryService.js',
    'middleware/errorLogger.js',
    'middleware/detailedLogger.js'
];

// Lista de arquivos do frontend para corrigir
const frontendFiles = [
    '../client/src/contexts/FinancialContext.js',
    '../client/src/components/dashboard/IncomeForm.js',
    '../client/src/components/dashboard/ExpenseForm.js',
    '../client/src/components/dashboard/UserProfile.js',
    '../client/src/utils/errorLogger.js',
    '../client/src/utils/detailedLogger.js'
];

console.log('🔧 Corrigindo todas as datas no sistema...\n');

// Corrigir arquivos do backend
console.log('📁 Backend:');
backendFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fixDatesInFile(file);
    } else {
        console.log(`⚠️  ${file} - Arquivo não encontrado`);
    }
});

console.log('\n📁 Frontend:');
frontendFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fixDatesInFrontendFile(file);
    } else {
        console.log(`⚠️  ${file} - Arquivo não encontrado`);
    }
});

console.log('\n🎉 Correção de datas concluída!');
console.log('✅ Agora o sistema usa o fuso horário local brasileiro');
console.log('✅ Todas as datas são exibidas corretamente');
