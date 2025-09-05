const db = require('../config/database');

async function testIncomeDates() {
    try {
        console.log('🧪 Testando datas das receitas...\n');

        // 1. Verificar receitas existentes
        console.log('📊 1. Receitas existentes no banco:');
        const existingIncome = await db.query('SELECT id, description, amount, income_date, created_at FROM income ORDER BY created_at DESC LIMIT 5');
        
        if (existingIncome.length === 0) {
            console.log('  - Nenhuma receita encontrada');
        } else {
            existingIncome.forEach((inc, index) => {
                console.log(`  ${index + 1}. ${inc.description}: R$ ${inc.amount}`);
                console.log(`     - Data da receita: ${inc.income_date}`);
                console.log(`     - Criada em: ${inc.created_at}`);
                console.log('');
            });
        }

        // 2. Testar função formatDateToLocal
        console.log('🔧 2. Testando função formatDateToLocal:');
        const { formatDateToLocal } = require('../utils/dateUtils');
        
        const testDates = [
            '2025-09-01',
            '2025-09-02',
            '2025-09-15',
            new Date().toISOString().split('T')[0], // Data atual
            new Date().toISOString() // Data atual completa
        ];

        testDates.forEach((date, index) => {
            const formatted = formatDateToLocal(date);
            console.log(`  ${index + 1}. "${date}" → ${formatted}`);
        });

        // 3. Verificar data atual
        console.log('\n📅 3. Data atual:');
        const now = new Date();
        console.log(`  - JavaScript Date: ${now.toString()}`);
        console.log(`  - ISO String: ${now.toISOString()}`);
        console.log(`  - Local String: ${now.toLocaleString('pt-BR')}`);
        
        const { getCurrentDate, getCurrentDateTime } = require('../utils/dateUtils');
        console.log(`  - getCurrentDate(): ${getCurrentDate()}`);
        console.log(`  - getCurrentDateTime(): ${getCurrentDateTime()}`);

        // 4. Simular criação de receita
        console.log('\n🧪 4. Simulando criação de receita:');
        
        // Simular dados que o frontend enviaria
        const mockIncomeData = {
            amount: 100.00,
            source: 'Teste',
            income_date: getCurrentDate(), // Usar a função do frontend
            description: 'Receita de teste',
            bank_account_id: null
        };

        console.log('  - Dados simulados:');
        console.log(`    * Valor: R$ ${mockIncomeData.amount}`);
        console.log(`    * Fonte: ${mockIncomeData.source}`);
        console.log(`    * Data: ${mockIncomeData.income_date}`);
        console.log(`    * Descrição: ${mockIncomeData.description}`);
        console.log(`    * Conta: ${mockIncomeData.bank_account_id || 'Nenhuma'}`);

        // Simular processamento do backend
        const parsedDate = formatDateToLocal(mockIncomeData.income_date);
        console.log(`  - Data após formatDateToLocal: ${parsedDate}`);

        // 5. Verificar se há problemas de timezone
        console.log('\n🌍 5. Verificação de timezone:');
        
        const jsDate = new Date();
        const jsDateISO = jsDate.toISOString();
        const jsDateLocal = jsDate.toLocaleDateString('pt-BR');
        
        console.log(`  - Data JS (ISO): ${jsDateISO}`);
        console.log(`  - Data JS (Local): ${jsDateLocal}`);
        console.log(`  - Diferença UTC vs Local: ${jsDate.getTimezoneOffset()} minutos`);

        // 6. Verificar se as datas estão sendo salvas corretamente
        console.log('\n✅ 6. Verificação das datas salvas:');
        
        if (existingIncome.length > 0) {
            const latestIncome = existingIncome[0];
            const savedDate = new Date(latestIncome.income_date);
            const createdDate = new Date(latestIncome.created_at);
            
            console.log(`  - Última receita: ${latestIncome.description}`);
            console.log(`  - Data da receita salva: ${latestIncome.income_date}`);
            console.log(`  - Data da receita (JS): ${savedDate.toLocaleDateString('pt-BR')}`);
            console.log(`  - Criada em: ${latestIncome.created_at}`);
            console.log(`  - Criada em (JS): ${createdDate.toLocaleDateString('pt-BR')}`);
            
            // Verificar se há discrepância
            const dateDiff = Math.abs(savedDate - createdDate);
            const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 1) {
                console.log(`  ⚠️  Diferença de ${daysDiff.toFixed(1)} dias entre data da receita e criação`);
            } else {
                console.log(`  ✅ Datas estão consistentes`);
            }
        }

        // 7. Recomendações
        console.log('\n💡 7. Recomendações:');
        
        if (existingIncome.length > 0) {
            const hasDateIssues = existingIncome.some(inc => {
                const incomeDate = new Date(inc.income_date);
                const createdDate = new Date(inc.created_at);
                const diff = Math.abs(incomeDate - createdDate);
                return diff > (1000 * 60 * 60 * 24); // Mais de 1 dia de diferença
            });
            
            if (hasDateIssues) {
                console.log('  ⚠️  Algumas receitas têm datas inconsistentes');
                console.log('  🔧 Verificar se o frontend está enviando datas corretas');
                console.log('  🔧 Verificar se o backend está processando datas corretamente');
            } else {
                console.log('  ✅ Todas as datas das receitas estão consistentes');
            }
        }

        console.log('\n🎯 Teste concluído!');

    } catch (error) {
        console.error('❌ Erro ao testar datas das receitas:', error);
    } finally {
        process.exit(0);
    }
}

testIncomeDates();
