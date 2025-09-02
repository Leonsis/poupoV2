const db = require('../config/database');

async function fixDates() {
    try {
        console.log('🔧 Corrigindo datas no banco de dados...');
        
        // Função para obter data atual correta
        const getCurrentDateTime = () => {
            const now = new Date();
            // Garantir que estamos em 2024, não 2025
            if (now.getFullYear() > 2024) {
                now.setFullYear(2024);
            }
            return now.toISOString().slice(0, 19).replace('T', ' ');
        };

        const currentDateTime = getCurrentDateTime();
        console.log(`📅 Data/hora corrigida: ${currentDateTime}`);
        
        // Atualizar todas as datas futuras para 2024
        const tables = ['users', 'bank_accounts', 'income', 'expenses', 'fixed_expenses', 'transactions', 'financial_advice'];
        
        for (const table of tables) {
            console.log(`🔧 Corrigindo tabela: ${table}`);
            
            // Verificar se a tabela tem colunas de data
            const columns = await db.query(`PRAGMA table_info(${table})`);
            const dateColumns = columns.filter(col => 
                col.name.includes('created_at') || 
                col.name.includes('updated_at') || 
                col.name.includes('_date') ||
                col.name.includes('timestamp')
            );
            
            for (const col of dateColumns) {
                console.log(`  📅 Corrigindo coluna: ${col.name}`);
                
                // Atualizar datas futuras (2025) para 2024
                const result = await db.run(`
                    UPDATE ${table} 
                    SET ${col.name} = REPLACE(${col.name}, '2025-', '2024-')
                    WHERE ${col.name} LIKE '2025-%'
                `);
                
                if (result.changes > 0) {
                    console.log(`    ✅ ${result.changes} registros corrigidos`);
                }
            }
        }
        
        console.log('\n✅ Correção de datas concluída!');
        
        // Verificar resultado
        const sampleData = await db.query(`
            SELECT 
                'users' as table_name,
                created_at,
                datetime(created_at) as parsed_created_at
            FROM users 
            LIMIT 1
        `);
        
        if (sampleData.length > 0) {
            console.log(`📅 Exemplo após correção: ${sampleData[0].created_at}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao corrigir datas:', error);
    } finally {
        process.exit(0);
    }
}

fixDates();
