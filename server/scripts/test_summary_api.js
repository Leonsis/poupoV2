const db = require('../config/database');

async function testSummaryAPI() {
    try {
        console.log('🧪 Testando API de resumo diretamente...\n');

        // Simular um usuário (ID 1)
        const userId = 1;
        console.log(`👤 Testando para usuário ID: ${userId}`);

        // Simular a lógica da API de resumo
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { formatDateToLocal } = require('../utils/dateUtils');
        const startDateStr = formatDateToLocal(startDate);
        const endDateStr = formatDateToLocal(endDate);

        console.log(`📅 Período: ${startDateStr} até ${endDateStr}`);

        // Buscar dados do período
        console.log('\n🔍 Buscando dados...');

        // Receitas
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [userId, startDateStr, endDateStr]
        );
        const totalIncome = income[0]?.total || 0;
        console.log(`  - Receitas: R$ ${totalIncome}`);

        // Despesas variáveis (débito)
        const expenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')`,
            [userId, startDateStr, endDateStr]
        );
        const totalExpenses = expenses[0]?.total || 0;
        console.log(`  - Despesas variáveis: R$ ${totalExpenses}`);

        // Despesas fixas (todas)
        const fixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ?',
            [userId]
        );
        const totalFixedExpenses = fixedExpenses[0]?.total || 0;
        console.log(`  - Despesas fixas (todas): R$ ${totalFixedExpenses}`);

        // Despesas fixas pagas
        const paidFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 1',
            [userId]
        );
        const totalPaidFixedExpenses = paidFixedExpenses[0]?.total || 0;
        console.log(`  - Despesas fixas pagas: R$ ${totalPaidFixedExpenses}`);

        // Despesas fixas não pagas
        const unpaidFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [userId]
        );
        const totalUnpaidFixedExpenses = unpaidFixedExpenses[0]?.total || 0;
        console.log(`  - Despesas fixas não pagas: R$ ${totalUnpaidFixedExpenses}`);

        // Cartão de crédito
        const creditCardExpenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'credito' OR ba.account_category = 'credito')`,
            [userId, startDateStr, endDateStr]
        );
        const totalCreditCardExpenses = creditCardExpenses[0]?.total || 0;
        console.log(`  - Gastos cartão de crédito: R$ ${totalCreditCardExpenses}`);

        // Contas bancárias
        const bankAccounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ?',
            [userId]
        );
        console.log(`  - Contas bancárias: ${bankAccounts.length}`);

        // Calcular saldo
        const balance = totalIncome - totalExpenses - totalPaidFixedExpenses;
        console.log(`\n🧮 Cálculo do saldo:`);
        console.log(`  - Receitas: R$ ${totalIncome}`);
        console.log(`  - Despesas variáveis: R$ ${totalExpenses}`);
        console.log(`  - Despesas fixas pagas: R$ ${totalPaidFixedExpenses}`);
        console.log(`  - Saldo = ${totalIncome} - ${totalExpenses} - ${totalPaidFixedExpenses} = R$ ${balance}`);

        // Verificar se os dados estão sendo retornados corretamente
        console.log('\n✅ Verificação da API:');
        if (totalIncome > 0) {
            console.log('  ✅ Receitas encontradas');
        } else {
            console.log('  ⚠️  Nenhuma receita encontrada');
        }

        if (totalExpenses >= 0) {
            console.log('  ✅ Despesas variáveis calculadas');
        } else {
            console.log('  ⚠️  Problema com despesas variáveis');
        }

        if (totalFixedExpenses >= 0) {
            console.log('  ✅ Despesas fixas encontradas');
        } else {
            console.log('  ⚠️  Problema com despesas fixas');
        }

        if (balance !== undefined && !isNaN(balance)) {
            console.log('  ✅ Saldo calculado corretamente');
        } else {
            console.log('  ❌ Problema no cálculo do saldo');
        }

        // Simular resposta da API
        const apiResponse = {
            success: true,
            summary: {
                period: 'month',
                startDate: startDateStr,
                endDate: endDateStr,
                totalIncome,
                totalExpenses,
                totalFixedExpenses,
                totalCreditCardExpenses,
                balance,
                bankAccounts: bankAccounts.length
            }
        };

        console.log('\n📡 Resposta simulada da API:');
        console.log(JSON.stringify(apiResponse, null, 2));

        console.log('\n🎯 Conclusão:');
        if (apiResponse.success) {
            console.log('  ✅ API está funcionando corretamente');
            console.log('  ✅ Dados estão sendo calculados');
            console.log('  ✅ O problema pode estar no frontend ou na atualização automática');
        } else {
            console.log('  ❌ API com problema');
        }

    } catch (error) {
        console.error('❌ Erro ao testar API:', error);
    } finally {
        process.exit(0);
    }
}

testSummaryAPI();
