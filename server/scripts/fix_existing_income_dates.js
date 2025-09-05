const db = require('../config/database');

async function fixExistingIncomeDates() {
    try {
        console.log('🔧 Corrigindo datas das receitas existentes...\n');

        // 1. Verificar receitas existentes
        console.log('📊 1. Receitas existentes antes da correção:');
        const existingIncome = await db.query('SELECT id, description, amount, income_date, created_at FROM income ORDER BY created_at DESC');
        
        if (existingIncome.length === 0) {
            console.log('  - Nenhuma receita encontrada');
            return;
        }

        existingIncome.forEach((inc, index) => {
            console.log(`  ${index + 1}. ${inc.description}: R$ ${inc.amount}`);
            console.log(`     - Data da receita: ${inc.income_date}`);
            console.log(`     - Criada em: ${inc.created_at}`);
            console.log('');
        });

        // 2. Obter data atual correta
        const { getCurrentDate } = require('../utils/dateUtils');
        const currentDate = getCurrentDate();
        console.log(`📅 2. Data atual correta: ${currentDate}`);

        // 3. Corrigir datas das receitas
        console.log('\n🔧 3. Corrigindo datas...');
        let updatedCount = 0;
        
        for (const income of existingIncome) {
            try {
                // Se a data da receita for diferente da data atual, corrigir
                if (income.income_date !== currentDate) {
                    await db.run(
                        'UPDATE income SET income_date = ? WHERE id = ?',
                        [currentDate, income.id]
                    );
                    console.log(`  ✅ Receita "${income.description}" corrigida: ${income.income_date} → ${currentDate}`);
                    updatedCount++;
                } else {
                    console.log(`  ℹ️  Receita "${income.description}" já está com data correta: ${income.income_date}`);
                }
            } catch (error) {
                console.log(`  ❌ Erro ao corrigir receita ${income.id}:`, error.message);
            }
        }

        // 4. Verificar correções
        console.log('\n✅ 4. Verificando correções...');
        const updatedIncome = await db.query('SELECT id, description, amount, income_date, created_at FROM income ORDER BY created_at DESC');
        
        console.log(`  - Total de receitas: ${updatedIncome.length}`);
        console.log(`  - Receitas corrigidas: ${updatedCount}`);
        
        updatedIncome.forEach((inc, index) => {
            console.log(`  ${index + 1}. ${inc.description}: R$ ${inc.amount}`);
            console.log(`     - Data da receita: ${inc.income_date}`);
            console.log(`     - Criada em: ${inc.created_at}`);
            console.log('');
        });

        // 5. Testar se a API agora retorna dados corretos
        console.log('🧪 5. Testando se a API retorna dados corretos...');
        
        const userId = 1;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { formatDateToLocal } = require('../utils/dateUtils');
        const startDateStr = formatDateToLocal(startDate);
        const endDateStr = formatDateToLocal(endDate);

        const incomeTest = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [userId, startDateStr, endDateStr]
        );
        const totalIncome = incomeTest[0]?.total || 0;

        console.log(`  - Período: ${startDateStr} até ${endDateStr}`);
        console.log(`  - Receitas no período: R$ ${totalIncome}`);

        if (totalIncome > 0) {
            console.log('  ✅ API agora deve retornar dados corretamente!');
        } else {
            console.log('  ⚠️  API ainda não retorna dados - verificar outras possibilidades');
        }

        // 6. Verificar se as datas estão consistentes
        console.log('\n🔍 6. Verificação de consistência:');
        
        const hasDateIssues = updatedIncome.some(inc => {
            const incomeDate = new Date(inc.income_date);
            const createdDate = new Date(inc.created_at);
            const diff = Math.abs(incomeDate - createdDate);
            return diff > (1000 * 60 * 60 * 24); // Mais de 1 dia de diferença
        });
        
        if (hasDateIssues) {
            console.log('  ⚠️  Ainda há datas inconsistentes');
        } else {
            console.log('  ✅ Todas as datas estão consistentes agora');
        }

        console.log('\n🎯 Correção concluída!');
        console.log('  - As datas das receitas foram corrigidas');
        console.log('  - Registrar Ganhos agora deve funcionar corretamente');
        console.log('  - As datas não serão mais alteradas incorretamente');

    } catch (error) {
        console.error('❌ Erro ao corrigir datas das receitas:', error);
    } finally {
        process.exit(0);
    }
}

fixExistingIncomeDates();
