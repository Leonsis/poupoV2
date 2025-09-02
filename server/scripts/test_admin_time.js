const db = require('../config/database');

async function testAdminTime() {
    try {
        console.log('🔍 Testando problema da hora no painel admin...');
        
        // Verificar usuário existente
        const user = await db.query('SELECT id, name, email, created_at FROM users LIMIT 1');
        
        if (user.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        const testUser = user[0];
        console.log('\n📋 Usuário de teste:');
        console.log(`  - ID: ${testUser.id}`);
        console.log(`  - Nome: ${testUser.name}`);
        console.log(`  - Email: ${testUser.email}`);
        console.log(`  - Created_at (raw): ${testUser.created_at}`);
        
        // Testar diferentes formas de formatação
        const rawDate = testUser.created_at;
        const jsDate = new Date(rawDate);
        
        console.log('\n🕐 Análise da data:');
        console.log(`  - Data bruta do banco: ${rawDate}`);
        console.log(`  - Data parseada pelo JS: ${jsDate.toISOString()}`);
        console.log(`  - Data local (JS): ${jsDate.toLocaleString('pt-BR')}`);
        console.log(`  - Data local (JS) com timezone: ${jsDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        
        // Testar formatação como no frontend
        const frontendFormat = jsDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        console.log(`  - Formato frontend: ${frontendFormat}`);
        
        // Verificar diferença de timezone
        const timezoneOffset = jsDate.getTimezoneOffset();
        const timezoneHours = timezoneOffset / -60;
        console.log(`  - Offset do timezone: ${timezoneOffset} minutos (${timezoneHours} horas)`);
        
        // Verificar hora atual do sistema
        const now = new Date();
        console.log(`\n🕐 Hora atual do sistema:`);
        console.log(`  - UTC: ${now.toISOString()}`);
        console.log(`  - Local: ${now.toLocaleString('pt-BR')}`);
        console.log(`  - Local com timezone: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        
        // Verificar hora no banco
        const dbTime = await db.get("SELECT datetime('now') as utc_time, datetime('now', 'localtime') as local_time");
        console.log(`\n🗄️ Hora no banco:`);
        console.log(`  - UTC: ${dbTime.utc_time}`);
        console.log(`  - Local: ${dbTime.local_time}`);
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testAdminTime();
