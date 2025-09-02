const db = require('../config/database');

async function checkDateTime() {
    try {
        console.log('🔍 Verificando configuração de data e hora...');
        
        // Verificar data e hora do sistema
        const now = new Date();
        console.log(`📅 Data/Hora atual do sistema: ${now.toISOString()}`);
        console.log(`📅 Data/Hora local: ${now.toLocaleString('pt-BR')}`);
        console.log(`📅 Fuso horário: ${now.getTimezoneOffset() / -60}h`);
        
        // Verificar data e hora no banco
        const dbTime = await db.get("SELECT datetime('now') as current_time, datetime('now', 'localtime') as local_time");
        console.log(`📅 Data/Hora no banco (UTC): ${dbTime.current_time}`);
        console.log(`📅 Data/Hora no banco (local): ${dbTime.local_time}`);
        
        // Verificar algumas datas no banco
        const sampleData = await db.query(`
            SELECT 
                'users' as table_name,
                created_at,
                datetime(created_at) as parsed_created_at
            FROM users 
            LIMIT 1
        `);
        
        if (sampleData.length > 0) {
            console.log(`📅 Exemplo de data no banco: ${sampleData[0].created_at}`);
            console.log(`📅 Data parseada: ${sampleData[0].parsed_created_at}`);
        }
        
        console.log('\n✅ Verificação concluída!');
    } catch (error) {
        console.error('❌ Erro ao verificar data/hora:', error);
    } finally {
        process.exit(0);
    }
}

checkDateTime();
