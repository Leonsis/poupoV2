const fs = require('fs');
const path = require('path');
const Database = require('../config/database');

async function resetDatabase() {
    try {
        console.log('🔄 Recriando banco de dados...');
        
        // Caminho do arquivo do banco
        const dbPath = path.join(__dirname, '..', 'database', 'poupo_final.db');
        
        // Verificar se o arquivo existe e deletar
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('✅ Arquivo do banco deletado');
        }
        
        // Recriar o banco
        const db = require('../config/database');
        await db.init();
        
        console.log('✅ Banco de dados recriado com sucesso!');
        console.log('📝 Próximos passos:');
        console.log('   1. Execute: node scripts/insert_test_data.js');
        console.log('   2. Teste as funcionalidades do sistema');
        
    } catch (error) {
        console.error('❌ Erro ao recriar banco de dados:', error);
    } finally {
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    resetDatabase();
}

module.exports = { resetDatabase };
