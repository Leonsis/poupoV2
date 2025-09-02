const db = require('../config/database');

async function fixTimezoneDates() {
    try {
        console.log('🔧 Corrigindo datas com problema de timezone...');
        
        // Verificar usuários existentes
        const users = await db.query('SELECT id, created_at, updated_at FROM users');
        console.log(`📋 Usuários encontrados: ${users.length}`);
        
        if (users.length === 0) {
            console.log('ℹ️ Nenhum usuário para corrigir');
            return;
        }
        
        // Mostrar datas atuais
        users.forEach(user => {
            console.log(`  - Usuário ID ${user.id}:`);
            console.log(`    Created_at: ${user.created_at}`);
            console.log(`    Updated_at: ${user.updated_at}`);
        });
        
        // Corrigir cada usuário
        for (const user of users) {
            if (user.created_at) {
                // A data está sendo interpretada como UTC pelo JavaScript
                // mas na verdade é hora local. Vamos ajustar para mostrar corretamente
                
                // Exemplo: "2025-09-01 21:52:26" está sendo interpretado como UTC
                // mas deveria ser "2025-09-01 18:52:26" (hora local)
                
                // Converter para data local correta (subtrair 3 horas)
                const utcDate = new Date(user.created_at + 'Z'); // Forçar interpretação como UTC
                const localDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                const localDateString = localDate.toISOString().slice(0, 19).replace('T', ' ');
                
                console.log(`\n🔄 Corrigindo usuário ID ${user.id}:`);
                console.log(`  - Data interpretada como UTC: ${user.created_at}`);
                console.log(`  - Data UTC real: ${utcDate.toISOString()}`);
                console.log(`  - Data Local corrigida: ${localDateString}`);
                
                // Atualizar no banco
                await db.run(
                    'UPDATE users SET created_at = ?, updated_at = ? WHERE id = ?',
                    [localDateString, localDateString, user.id]
                );
                
                console.log(`  ✅ Usuário ${user.id} corrigido`);
            }
        }
        
        // Verificar resultado
        const updatedUsers = await db.query('SELECT id, created_at, updated_at FROM users');
        console.log('\n📊 Datas após correção:');
        updatedUsers.forEach(user => {
            console.log(`  - Usuário ID ${user.id}: ${user.created_at}`);
        });
        
        console.log('\n✅ Correção de timezone concluída!');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir timezone:', error);
    } finally {
        process.exit(0);
    }
}

fixTimezoneDates();
