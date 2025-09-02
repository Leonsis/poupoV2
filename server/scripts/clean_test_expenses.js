const db = require('../config/database');

async function cleanTestExpenses() {
    try {
        console.log('🧹 Limpando despesas de teste...');
        
        const result = await db.run('DELETE FROM fixed_expenses WHERE description LIKE ?', ['%Teste%']);
        
        console.log(`✅ ${result.changes} despesas de teste removidas`);
        
    } catch (error) {
        console.error('❌ Erro ao limpar despesas:', error);
    } finally {
        process.exit(0);
    }
}

cleanTestExpenses();
