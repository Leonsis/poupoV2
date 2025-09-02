const db = require('../config/database');

async function testAdminDates() {
    try {
        console.log('🔍 Testando datas da rota admin...\n');

        // Simular a query da rota admin
        const query = `
            SELECT 
                id,
                name as username,
                email,
                created_at,
                deleted_at,
                is_banned
            FROM users 
            ORDER BY created_at DESC
        `;
        
        const users = await db.query(query);
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado');
            return;
        }

        console.log(`📋 Encontrados ${users.length} usuários:\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username} (${user.email})`);
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Criado em: ${user.created_at}`);
            console.log(`   - Excluído em: ${user.deleted_at || 'Não'}`);
            console.log(`   - Banido: ${user.is_banned ? 'Sim' : 'Não'}`);
            console.log('');
        });

        // Verificar se as datas estão no formato correto
        console.log('⏰ Verificação de formato de datas:');
        const now = new Date();
        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        console.log(`  - Data/hora atual (JS): ${now.toLocaleString('pt-BR')}`);
        console.log(`  - Data/hora atual (nossa função): ${currentDateTime}`);
        
        // Verificar se as datas dos usuários estão próximas do horário atual
        users.forEach((user, index) => {
            if (user.created_at) {
                const createdDate = new Date(user.created_at);
                const diffHours = Math.abs(now - createdDate) / (1000 * 60 * 60);
                console.log(`  - ${user.username}: criado há ${diffHours.toFixed(1)} horas`);
                
                if (diffHours > 24) {
                    console.log(`    ⚠️  Data suspeita: ${user.created_at}`);
                } else {
                    console.log(`    ✅ Data parece normal`);
                }
            }
        });

        // Verificar configuração do banco
        console.log('\n🗄️  Configuração do banco:');
        const dbConfig = await db.get("SELECT datetime('now', 'localtime') as current_time, datetime('now') as utc_time");
        console.log(`  - Hora local do banco: ${dbConfig.current_time}`);
        console.log(`  - Hora UTC do banco: ${dbConfig.utc_time}`);

    } catch (error) {
        console.error('❌ Erro ao testar datas admin:', error);
    } finally {
        process.exit(0);
    }
}

testAdminDates();
