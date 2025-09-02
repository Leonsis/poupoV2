const db = require('../config/database');

async function checkTableStructure() {
    try {
        console.log('🔍 Verificando estrutura da tabela bank_accounts...');
        
        const columns = await db.query("PRAGMA table_info(bank_accounts)");
        
        console.log('📋 Colunas da tabela bank_accounts:');
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

checkTableStructure();
