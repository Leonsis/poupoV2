const db = require('../config/database');

async function checkAccountDates() {
    try {
        console.log('🔍 Verificando datas das contas bancárias...\n');

        // Verificar todas as contas
        const accounts = await db.query('SELECT * FROM bank_accounts ORDER BY created_at DESC');
        
        if (accounts.length === 0) {
            console.log('❌ Nenhuma conta bancária encontrada');
            return;
        }

        console.log(`📋 Encontradas ${accounts.length} contas bancárias:\n`);

        accounts.forEach((account, index) => {
            console.log(`${index + 1}. ${account.account_name} (${account.account_type})`);
            console.log(`   - ID: ${account.id}`);
            console.log(`   - Usuário: ${account.user_id}`);
            console.log(`   - Criada em: ${account.created_at}`);
            console.log(`   - Atualizada em: ${account.updated_at}`);
            console.log(`   - Saldo: R$ ${account.balance}`);
            console.log(`   - Categoria: ${account.account_category}`);
            if (account.credit_limit) {
                console.log(`   - Limite: R$ ${account.credit_limit}`);
            }
            console.log('');
        });

        // Verificar se há problemas com datas
        const now = new Date();
        const currentDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
        
        console.log('⏰ Verificação de datas:');
        console.log(`  - Data/hora atual (JS): ${now.toLocaleString('pt-BR')}`);
        console.log(`  - Data/hora atual (UTC): ${now.toISOString()}`);
        console.log(`  - Data/hora atual (formatada): ${currentDateTime}`);
        
        // Verificar contas com datas suspeitas
        const suspiciousAccounts = accounts.filter(account => {
            const createdDate = new Date(account.created_at);
            const diffHours = Math.abs(now - createdDate) / (1000 * 60 * 60);
            return diffHours > 24; // Mais de 24 horas de diferença
        });

        if (suspiciousAccounts.length > 0) {
            console.log('\n⚠️  Contas com datas suspeitas:');
            suspiciousAccounts.forEach(account => {
                const createdDate = new Date(account.created_at);
                const diffHours = Math.abs(now - createdDate) / (1000 * 60 * 60);
                console.log(`  - ${account.account_name}: criada há ${diffHours.toFixed(1)} horas`);
            });
        } else {
            console.log('\n✅ Todas as datas parecem normais');
        }

        // Verificar configuração do banco
        console.log('\n🗄️  Configuração do banco:');
        const dbConfig = await db.get("SELECT datetime('now', 'localtime') as current_time, datetime('now') as utc_time");
        console.log(`  - Hora local do banco: ${dbConfig.current_time}`);
        console.log(`  - Hora UTC do banco: ${dbConfig.utc_time}`);

    } catch (error) {
        console.error('❌ Erro ao verificar datas:', error);
    } finally {
        process.exit(0);
    }
}

checkAccountDates();
