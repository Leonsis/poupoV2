const db = require('../config/database');

async function testSummaryDirect() {
    try {
        console.log('🧪 Testando resumo diretamente no banco...');

        const userId = 2; // Usuário que tem dados
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`📅 Período: ${startDateStr} a ${endDateStr}`);
        console.log(`👤 Usuário ID: ${userId}`);

        // Buscar dados do período
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [userId, startDateStr, endDateStr]
        );

        // Buscar ganhos detalhados
        const incomeDetails = await db.query(
            'SELECT i.*, ba.account_name FROM income i LEFT JOIN bank_accounts ba ON i.bank_account_id = ba.id WHERE i.user_id = ? AND i.income_date BETWEEN ? AND ? ORDER BY i.income_date DESC',
            [userId, startDateStr, endDateStr]
        );

        // Buscar apenas gastos de débito
        const expenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')`,
            [userId, startDateStr, endDateStr]
        );

        // Buscar gastos variáveis detalhados
        const expensesDetails = await db.query(
            `SELECT e.*, ba.account_name, ba.account_category 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')
             ORDER BY e.expense_date DESC`,
            [userId, startDateStr, endDateStr]
        );

        // Buscar gastos com cartão de crédito
        const creditCardExpenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'credito' OR ba.account_category = 'credito')`,
            [userId, startDateStr, endDateStr]
        );

        // Buscar detalhes dos gastos com cartão de crédito
        const creditCardExpensesDetails = await db.query(
            `SELECT e.*, ba.account_name, ba.account_category 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'credito' OR ba.account_category = 'credito')
             ORDER BY e.expense_date DESC`,
            [userId, startDateStr, endDateStr]
        );

        // Somar apenas despesas fixas não pagas
        const fixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [userId]
        );

        // Buscar despesas fixas detalhadas
        const fixedExpensesDetails = await db.query(
            'SELECT fe.*, ba.account_name, ba.account_category FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.user_id = ? AND fe.is_paid = 0 ORDER BY fe.due_date ASC',
            [userId]
        );

        const bankAccounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ?',
            [userId]
        );

        // Garantir que todas as contas tenham account_category
        const bankAccountsWithCategory = bankAccounts.map(account => ({
            ...account,
            account_category: account.account_category || 'debito'
        }));

        const summary = {
            period: 'month',
            startDate: startDateStr,
            endDate: endDateStr,
            totalIncome: income[0]?.total || 0,
            totalExpenses: expenses[0]?.total || 0,
            totalFixedExpenses: fixedExpenses[0]?.total || 0,
            totalCreditCardExpenses: creditCardExpenses[0]?.total || 0,
            balance: (income[0]?.total || 0) - (expenses[0]?.total || 0) - (fixedExpenses[0]?.total || 0),
            bankAccounts: bankAccountsWithCategory,
            // Dados detalhados
            incomeDetails,
            expensesDetails,
            fixedExpensesDetails,
            creditCardExpensesDetails
        };

        console.log('\n📊 Resumo Gerado:');
        console.log(`  - Receitas: R$ ${summary.totalIncome}`);
        console.log(`  - Despesas: R$ ${summary.totalExpenses}`);
        console.log(`  - Despesas Fixas: R$ ${summary.totalFixedExpenses}`);
        console.log(`  - Cartão de Crédito: R$ ${summary.totalCreditCardExpenses}`);
        console.log(`  - Saldo: R$ ${summary.balance}`);
        
        console.log('\n📋 Detalhes:');
        console.log(`  - Receitas detalhadas: ${summary.incomeDetails?.length || 0} registros`);
        console.log(`  - Despesas detalhadas: ${summary.expensesDetails?.length || 0} registros`);
        console.log(`  - Despesas fixas: ${summary.fixedExpensesDetails?.length || 0} registros`);
        console.log(`  - Gastos no crédito: ${summary.creditCardExpensesDetails?.length || 0} registros`);
        console.log(`  - Contas bancárias: ${summary.bankAccounts?.length || 0} contas`);

        console.log('\n✅ Teste concluído!');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testSummaryDirect();
