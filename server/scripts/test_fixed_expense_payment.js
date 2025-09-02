const db = require('../config/database');

async function testFixedExpensePayment() {
    try {
        console.log('🧪 Testando pagamento de despesa fixa...');
        
        // Verificar usuário existente
        const user = await db.query('SELECT id, name, email FROM users LIMIT 1');
        
        if (user.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        const testUser = user[0];
        console.log(`\n👤 Usuário de teste: ${testUser.name} (${testUser.email})`);
        
        // Verificar despesas fixas existentes
        const fixedExpenses = await db.query('SELECT id, description, amount, is_paid, bank_account_id FROM fixed_expenses WHERE user_id = ?', [testUser.id]);
        
        if (fixedExpenses.length === 0) {
            console.log('❌ Nenhuma despesa fixa encontrada para teste');
            return;
        }
        
        console.log('\n📋 Despesas fixas encontradas:');
        fixedExpenses.forEach(expense => {
            console.log(`  - ID ${expense.id}: ${expense.description} - R$ ${expense.amount} - Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
        });
        
        // Verificar contas bancárias
        const bankAccounts = await db.query('SELECT id, account_name, balance FROM bank_accounts WHERE user_id = ?', [testUser.id]);
        
        if (bankAccounts.length === 0) {
            console.log('❌ Nenhuma conta bancária encontrada para teste');
            return;
        }
        
        console.log('\n🏦 Contas bancárias:');
        bankAccounts.forEach(account => {
            console.log(`  - ID ${account.id}: ${account.account_name} - Saldo: R$ ${account.balance}`);
        });
        
        // Simular pagamento de uma despesa fixa
        const expenseToPay = fixedExpenses.find(exp => !exp.is_paid);
        const accountToUse = bankAccounts[0];
        
        if (!expenseToPay) {
            console.log('❌ Nenhuma despesa fixa não paga para testar');
            return;
        }
        
        console.log(`\n🔄 Simulando pagamento da despesa ID ${expenseToPay.id}...`);
        console.log(`  - Despesa: ${expenseToPay.description} - R$ ${expenseToPay.amount}`);
        console.log(`  - Conta: ${accountToUse.account_name} - Saldo atual: R$ ${accountToUse.balance}`);
        
        // Simular o pagamento (marcar como paga)
        const newBalance = parseFloat(accountToUse.balance) - parseFloat(expenseToPay.amount);
        
        console.log(`  - Saldo após pagamento: R$ ${newBalance}`);
        
        // Verificar se o cálculo está correto
        if (newBalance < 0) {
            console.log('⚠️  ATENÇÃO: Saldo ficaria negativo após pagamento!');
        }
        
        // Testar a consulta de resumo
        console.log('\n📊 Testando consulta de resumo...');
        
        // Simular a consulta que o frontend faz
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [testUser.id, '2025-09-01', '2025-10-01']
        );
        
        const expenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')`,
            [testUser.id, '2025-09-01', '2025-10-01']
        );
        
        const fixedExpensesUnpaid = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [testUser.id]
        );
        
        const balance = (income[0]?.total || 0) - (expenses[0]?.total || 0) - (fixedExpensesUnpaid[0]?.total || 0);
        
        console.log('\n📈 Resumo calculado:');
        console.log(`  - Receitas: R$ ${income[0]?.total || 0}`);
        console.log(`  - Despesas: R$ ${expenses[0]?.total || 0}`);
        console.log(`  - Despesas Fixas Não Pagas: R$ ${fixedExpensesUnpaid[0]?.total || 0}`);
        console.log(`  - Saldo: R$ ${balance}`);
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testFixedExpensePayment();
