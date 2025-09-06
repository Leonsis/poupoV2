const db = require('../config/database');

async function addDeletedAtColumn() {
    try {
        console.log('🔧 Adicionando coluna deleted_at à tabela fixed_expenses...');
        
        // Verificar se a coluna já existe
        const tableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        const hasDeletedAt = tableInfo.some(col => col.name === 'deleted_at');
        
        if (hasDeletedAt) {
            console.log('✅ Coluna deleted_at já existe');
            return;
        }
        
        // Adicionar a coluna
        await db.run('ALTER TABLE fixed_expenses ADD COLUMN deleted_at DATETIME');
        console.log('✅ Coluna deleted_at adicionada com sucesso');
        
        // Verificar se foi adicionada
        const newTableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        const hasDeletedAtAfter = newTableInfo.some(col => col.name === 'deleted_at');
        
        if (hasDeletedAtAfter) {
            console.log('✅ Verificação: coluna deleted_at existe');
        } else {
            console.log('❌ Erro: coluna deleted_at não foi adicionada');
        }
        
    } catch (error) {
        console.error('❌ Erro ao adicionar coluna:', error.message);
    } finally {
        process.exit(0);
    }
}

addDeletedAtColumn();
