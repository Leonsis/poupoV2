const db = require('../config/database');

async function checkFixedExpensesStatus() {
    try {
        console.log('🔍 Verificando status das despesas fixas...');
        
        // Verificar usuário existente
        const user = await db.query('SELECT id, name, email FROM users LIMIT 1');
        
        if (user.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        const testUser = user[0];
        console.log(`\n👤 Usuário de teste: ${testUser.name} (${testUser.email})`);
        
        // Verificar despesas fixas
        const fixedExpenses = await db.query(
            'SELECT description, amount, is_paid, bank_account_id FROM fixed_expenses WHERE user_id = ?',
            [testUser.id]
        );
        
        if (fixedExpenses.length === 0) {
            console.log('❌ Nenhuma despesa fixa encontrada');
            return;
        }
        
        console.log('\n📋 Despesas fixas encontradas:');
        let totalAmount = 0;
        let totalPaid = 0;
        let totalUnpaid = 0;
        
        fixedExpenses.forEach(expense => {
            totalAmount += expense.amount;
            if (expense.is_paid) {
                totalPaid += expense.amount;
                console.log(`  ✅ ${expense.description}: R$ ${expense.amount} (PAGA)`);
            } else {
                totalUnpaid += expense.amount;
                console.log(`  ❌ ${expense.description}: R$ ${expense.amount} (NÃO PAGA)`);
            }
        });
        
        console.log('\n💰 Resumo:');
        console.log(`  - Total de despesas fixas: R$ ${totalAmount.toFixed(2)}`);
        console.log(`  - Total pago: R$ ${totalPaid.toFixed(2)}`);
        console.log(`  - Total não pago: R$ ${totalUnpaid.toFixed(2)}`);
        
        // Verificar contas bancárias
        const bankAccounts = await db.query(
            'SELECT account_name, balance FROM bank_accounts WHERE user_id = ? AND account_category = "debito"',
            [testUser.id]
        );
        
        console.log('\n🏦 Contas de débito:');
        let totalBalance = 0;
        bankAccounts.forEach(account => {
            totalBalance += account.balance;
            console.log(`  - ${account.account_name}: R$ ${account.balance}`);
        });
        console.log(`  - Saldo total das contas: R$ ${totalBalance.toFixed(2)}`);
        
        // Calcular saldo correto
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ?',
            [testUser.id]
        );
        
        const expenses = await db.query(
            'SELECT SUM(amount) as total FROM expenses WHERE user_id = ?',
            [testUser.id]
        );
        
        const totalIncome = income[0]?.total || 0;
        const totalExpenses = expenses[0]?.total || 0;
        
        console.log('\n🧮 Cálculo do saldo:');
        console.log(`  - Receitas: R$ ${totalIncome.toFixed(2)}`);
        console.log(`  - Despesas variáveis: R$ ${totalExpenses.toFixed(2)}`);
        console.log(`  - Despesas fixas NÃO pagas: R$ ${totalUnpaid.toFixed(2)}`);
        
        // Saldo correto = Receitas - Despesas Variáveis - Despesas Fixas NÃO Pagas
        const correctBalance = totalIncome - totalExpenses - totalUnpaid;
        console.log(`  - Saldo correto: R$ ${correctBalance.toFixed(2)}`);
        
        // Saldo atual da API (incorreto)
        const currentBalance = totalIncome - totalExpenses - totalAmount;
        console.log(`  - Saldo atual da API (incorreto): R$ ${currentBalance.toFixed(2)}`);
        
        console.log('\n✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    } finally {
        process.exit(0);
    }
}

checkFixedExpensesStatus();
