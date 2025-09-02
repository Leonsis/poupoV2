const db = require('../config/database');

async function cleanAndReset() {
    try {
        console.log('🔄 Limpando e resetando banco de dados...');
        
        // Limpar todas as tabelas
        const tablesToClear = [
            'monthly_summaries',
            'financial_advice',
            'transactions',
            'expenses',
            'income',
            'fixed_expenses',
            'bank_accounts',
            'user_login_logs',
            'guest_access_logs',
            'users'
        ];
        
        console.log('🗑️  Limpando dados das tabelas...');
        
        for (const table of tablesToClear) {
            try {
                const result = await db.run(`DELETE FROM ${table}`);
                console.log(`✅ ${table}: ${result.changes} registros removidos`);
            } catch (error) {
                console.log(`⚠️  ${table}: ${error.message}`);
            }
        }
        
        // Resetar auto-increment counters
        console.log('🔄 Resetando contadores de auto-increment...');
        const resetQueries = [
            'DELETE FROM sqlite_sequence WHERE name = "monthly_summaries"',
            'DELETE FROM sqlite_sequence WHERE name = "financial_advice"',
            'DELETE FROM sqlite_sequence WHERE name = "transactions"',
            'DELETE FROM sqlite_sequence WHERE name = "expenses"',
            'DELETE FROM sqlite_sequence WHERE name = "income"',
            'DELETE FROM sqlite_sequence WHERE name = "fixed_expenses"',
            'DELETE FROM sqlite_sequence WHERE name = "bank_accounts"',
            'DELETE FROM sqlite_sequence WHERE name = "user_login_logs"',
            'DELETE FROM sqlite_sequence WHERE name = "guest_access_logs"',
            'DELETE FROM sqlite_sequence WHERE name = "users"'
        ];
        
        for (const query of resetQueries) {
            try {
                await db.run(query);
            } catch (error) {
                // Ignora erros se a tabela não existir
            }
        }
        
        // Recriar tabelas para garantir estrutura atualizada
        console.log('🔄 Recriando tabelas...');
        await db.createTables();
        
        console.log('✅ Banco de dados limpo e resetado com sucesso!');
        console.log('📝 Próximos passos:');
        console.log('   1. Execute: node scripts/insert_test_data.js');
        console.log('   2. Teste as funcionalidades do sistema');
        
    } catch (error) {
        console.error('❌ Erro ao limpar e resetar banco de dados:', error);
    } finally {
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    cleanAndReset();
}

module.exports = { cleanAndReset };

