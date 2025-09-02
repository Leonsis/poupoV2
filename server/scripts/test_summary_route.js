const db = require('../config/database');

async function testSummaryRoute() {
    try {
        console.log('🧪 Testando rota de resumo diretamente...');
        
        // Simular dados do usuário 3
        const userId = 3;
        const startDate = '2025-09-01';
        const endDate = '2025-10-01';
        
        console.log(`\n📅 Período: ${startDate} a ${endDate}`);
        console.log(`👤 Usuário ID: ${userId}`);
        
        // Buscar dados do período (como na rota /summary)
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [userId, startDate, endDate]
        );
        
        const expenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')`,
            [userId, startDate, endDate]
        );
        
        const creditCardExpenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'credito' OR ba.account_category = 'credito')`,
            [userId, startDate, endDate]
        );
        
        // Buscar despesas fixas não pagas (como está na rota atual)
        const fixedExpensesUnpaid = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [userId]
        );
        
        // Buscar despesas fixas pagas
        const fixedExpensesPaid = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 1',
            [userId]
        );
        
        // Buscar todas as despesas fixas
        const fixedExpensesTotal = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ?',
            [userId]
        );
        
        // Calcular saldo como está na rota atual
        const balanceCurrent = (income[0]?.total || 0) - (expenses[0]?.total || 0) - (fixedExpensesUnpaid[0]?.total || 0);
        
        // Calcular saldo corrigido (não descontar despesas fixas pagas duas vezes)
        const balanceCorrected = (income[0]?.total || 0) - (expenses[0]?.total || 0) - (fixedExpensesUnpaid[0]?.total || 0);
        
        console.log('\n📊 Dados encontrados:');
        console.log(`  - Receitas: R$ ${income[0]?.total || 0}`);
        console.log(`  - Despesas: R$ ${expenses[0]?.total || 0}`);
        console.log(`  - Cartão de Crédito: R$ ${creditCardExpenses[0]?.total || 0}`);
        console.log(`  - Despesas Fixas Não Pagas: R$ ${fixedExpensesUnpaid[0]?.total || 0}`);
        console.log(`  - Despesas Fixas Pagas: R$ ${fixedExpensesPaid[0]?.total || 0}`);
        console.log(`  - Total Despesas Fixas: R$ ${fixedExpensesTotal[0]?.total || 0}`);
        
        console.log('\n💰 Cálculo do Saldo:');
        console.log(`  - Receitas: R$ ${income[0]?.total || 0}`);
        console.log(`  - Despesas: R$ ${expenses[0]?.total || 0}`);
        console.log(`  - Despesas Fixas Não Pagas: R$ ${fixedExpensesUnpaid[0]?.total || 0}`);
        console.log(`  - Saldo Atual: R$ ${balanceCurrent}`);
        console.log(`  - Saldo Corrigido: R$ ${balanceCorrected}`);
        
        // Verificar se há inconsistências
        console.log('\n🔍 Análise:');
        if (fixedExpensesPaid[0]?.total > 0) {
            console.log(`  ✅ Despesas fixas pagas: R$ ${fixedExpensesPaid[0]?.total}`);
            console.log(`  ℹ️  Estas despesas já foram descontadas da conta bancária`);
        }
        
        if (fixedExpensesUnpaid[0]?.total > 0) {
            console.log(`  ⚠️  Despesas fixas não pagas: R$ ${fixedExpensesUnpaid[0]?.total}`);
            console.log(`  ℹ️  Estas despesas ainda não foram descontadas`);
        }
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testSummaryRoute();
