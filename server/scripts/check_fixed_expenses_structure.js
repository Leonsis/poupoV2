const db = require('../config/database');

async function checkFixedExpensesStructure() {
    try {
        console.log('🔍 Verificando estrutura da tabela fixed_expenses...');
        
        // Verificar estrutura da tabela fixed_expenses
        const columns = await db.query("PRAGMA table_info(fixed_expenses)");
        console.log(`📋 Colunas da tabela fixed_expenses:`);
        columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });
        
        console.log('\n✅ Verificação concluída!');
    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error);
    } finally {
        process.exit(0);
    }
}

checkFixedExpensesStructure();
