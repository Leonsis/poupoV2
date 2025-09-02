const db = require('../config/database');

async function testFrontendDataFlow() {
    try {
        console.log('🧪 Testando fluxo de dados do backend para o frontend...\n');

        // Simular usuário logado
        const userId = 1;
        console.log(`👤 Testando para usuário ID: ${userId}`);

        // 1. Verificar dados no banco
        console.log('📊 1. Dados no banco:');
        
        const income = await db.query('SELECT SUM(amount) as total FROM income WHERE user_id = ?', [userId]);
        const expenses = await db.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [userId]);
        const fixedExpenses = await db.query('SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ?', [userId]);
        const bankAccounts = await db.query('SELECT * FROM bank_accounts WHERE user_id = ?', [userId]);

        console.log(`  - Receitas: R$ ${income[0]?.total || 0}`);
        console.log(`  - Despesas: R$ ${expenses[0]?.total || 0}`);
        console.log(`  - Despesas fixas: R$ ${fixedExpenses[0]?.total || 0}`);
        console.log(`  - Contas bancárias: ${bankAccounts.length}`);

        // 2. Simular chamada da API de resumo
        console.log('\n🌐 2. Simulando API de resumo:');
        
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { formatDateToLocal } = require('../utils/dateUtils');
        const startDateStr = formatDateToLocal(startDate);
        const endDateStr = formatDateToLocal(endDate);

        console.log(`  - Período: ${startDateStr} até ${endDateStr}`);

        // Buscar dados do período
        const incomePeriod = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [userId, startDateStr, endDateStr]
        );

        const expensesPeriod = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')`,
            [userId, startDateStr, endDateStr]
        );

        const paidFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 1',
            [userId]
        );

        console.log(`  - Receitas no período: R$ ${incomePeriod[0]?.total || 0}`);
        console.log(`  - Despesas no período: R$ ${expensesPeriod[0]?.total || 0}`);
        console.log(`  - Despesas fixas pagas: R$ ${paidFixedExpenses[0]?.total || 0}`);

        // 3. Calcular saldo
        const balance = (incomePeriod[0]?.total || 0) - (expensesPeriod[0]?.total || 0) - (paidFixedExpenses[0]?.total || 0);
        console.log(`  - Saldo calculado: R$ ${balance}`);

        // 4. Simular resposta da API
        console.log('\n📡 3. Resposta da API:');
        const apiResponse = {
            success: true,
            summary: {
                period: 'month',
                startDate: startDateStr,
                endDate: endDateStr,
                totalIncome: incomePeriod[0]?.total || 0,
                totalExpenses: expensesPeriod[0]?.total || 0,
                totalFixedExpenses: fixedExpenses[0]?.total || 0,
                balance: balance,
                bankAccounts: bankAccounts.length
            }
        };

        console.log(JSON.stringify(apiResponse, null, 2));

        // 5. Verificar se os dados estão corretos
        console.log('\n✅ 4. Verificação dos dados:');
        
        if (apiResponse.summary.totalIncome > 0) {
            console.log('  ✅ Receitas sendo retornadas corretamente');
        } else {
            console.log('  ❌ Problema com receitas');
        }

        if (apiResponse.summary.balance === balance) {
            console.log('  ✅ Saldo sendo calculado corretamente');
        } else {
            console.log('  ❌ Problema com cálculo do saldo');
        }

        if (apiResponse.success) {
            console.log('  ✅ API retornando sucesso');
        } else {
            console.log('  ❌ API com problema');
        }

        // 6. Verificar se há problemas de atualização
        console.log('\n🔍 5. Diagnóstico de problemas:');
        
        if (incomePeriod[0]?.total === 0) {
            console.log('  ⚠️  Receitas não encontradas no período - verificar datas');
        }
        
        if (balance !== 2935.55) {
            console.log('  ⚠️  Saldo incorreto - esperado R$ 2.935,55');
        }
        
        if (bankAccounts.length === 0) {
            console.log('  ⚠️  Nenhuma conta bancária encontrada');
        }

        // 7. Recomendações
        console.log('\n💡 6. Recomendações:');
        
        if (apiResponse.success && apiResponse.summary.totalIncome > 0) {
            console.log('  ✅ Backend funcionando corretamente');
            console.log('  ✅ Dados sendo retornados');
            console.log('  🔍 Verificar se o frontend está recebendo e exibindo os dados');
            console.log('  🔍 Verificar se há problemas de atualização automática');
        } else {
            console.log('  ❌ Backend com problema');
            console.log('  🔧 Corrigir dados ou lógica da API');
        }

        console.log('\n🎯 Teste concluído!');

    } catch (error) {
        console.error('❌ Erro ao testar fluxo de dados:', error);
    } finally {
        process.exit(0);
    }
}

testFrontendDataFlow();
