const MonthlyExpenseDuplicationService = require('../services/monthlyExpenseDuplicationService');

/**
 * Script para duplicação automática de despesas fixas no dia 1 de cada mês
 * Este script deve ser executado via cron job no dia 1 de cada mês às 00:01
 * 
 * Exemplo de cron job:
 * 1 0 1 * * cd /caminho/para/projeto/server && node scripts/monthlyExpenseDuplication.js
 */
async function executeMonthlyDuplication() {
    try {
        console.log('🚀 Iniciando duplicação mensal de despesas fixas...');
        console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
        
        const result = await MonthlyExpenseDuplicationService.executeIfNeeded();
        
        if (result.executed) {
            console.log('\n🎉 Duplicação mensal executada com sucesso!');
            console.log(`📊 Resumo:`);
            console.log(`   • Despesas duplicadas: ${result.totalDuplicated}`);
            console.log(`   • Usuários processados: ${result.totalUsers}`);
            console.log(`   • Erros: ${result.totalErrors}`);
            console.log(`   • Mês/Ano: ${result.monthYear}`);
        } else {
            console.log(`\nℹ️ ${result.message}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('💥 Erro fatal na duplicação mensal:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Executar se o script for chamado diretamente
if (require.main === module) {
    executeMonthlyDuplication()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erro inesperado:', error);
            process.exit(1);
        });
}

module.exports = {
    executeMonthlyDuplication
};
