const db = require('../config/database');

async function testBalanceCalculation() {
    try {
        console.log('🧪 Testando cálculo do saldo diretamente no banco...');
        
        // Verificar usuário existente
        const user = await db.query('SELECT id, name, email FROM users LIMIT 1');
        
        if (user.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        const testUser = user[0];
        console.log(`\n👤 Usuário de teste: ${testUser.name} (${testUser.email})`);
        
        // 1. Verificar receitas
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ?',
            [testUser.id]
        );
        
        // 2. Verificar despesas variáveis
        const expenses = await db.query(
            'SELECT SUM(amount) as total FROM expenses WHERE user_id = ?',
            [testUser.id]
        );
        
        // 3. Verificar TODAS as despesas fixas
        const allFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ?',
            [testUser.id]
        );
        
        // 4. Verificar apenas despesas fixas NÃO PAGAS
        const unpaidFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [testUser.id]
        );
        
        // 5. Verificar despesas fixas PAGAS
        const paidFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 1',
            [testUser.id]
        );
        
        console.log('\n📊 Dados encontrados:');
        console.log(`  - Receitas: R$ ${income[0]?.total || 0}`);
        console.log(`  - Despesas variáveis: R$ ${expenses[0]?.total || 0}`);
        console.log(`  - Todas as despesas fixas: R$ ${allFixedExpenses[0]?.total || 0}`);
        console.log(`  - Despesas fixas PAGAS: R$ ${paidFixedExpenses[0]?.total || 0}`);
        console.log(`  - Despesas fixas NÃO PAGAS: R$ ${unpaidFixedExpenses[0]?.total || 0}`);
        
        // 6. Calcular saldo de diferentes formas
        const totalIncome = income[0]?.total || 0;
        const totalExpenses = expenses[0]?.total || 0;
        const totalAllFixed = allFixedExpenses[0]?.total || 0;
        const totalUnpaidFixed = unpaidFixedExpenses[0]?.total || 0;
        
        console.log('\n🧮 Cálculo do saldo:');
        
        // Saldo antigo (incorreto)
        const oldBalance = totalIncome - totalExpenses - totalAllFixed;
        console.log(`  - Saldo antigo (todas despesas fixas): R$ ${oldBalance.toFixed(2)}`);
        
        // Saldo novo (correto)
        const newBalance = totalIncome - totalExpenses - totalUnpaidFixed;
        console.log(`  - Saldo novo (apenas não pagas): R$ ${newBalance.toFixed(2)}`);
        
        // 7. Verificar se há diferença
        if (oldBalance === newBalance) {
            console.log('\n⚠️  ATENÇÃO: Os dois cálculos resultam no mesmo valor!');
            console.log('   Isso significa que todas as despesas fixas são não pagas.');
        } else {
            console.log('\n✅ Os cálculos são diferentes!');
            console.log(`   Diferença: R$ ${(oldBalance - newBalance).toFixed(2)}`);
        }
        
        // 8. Verificar detalhes das despesas fixas
        const fixedExpensesDetails = await db.query(
            'SELECT description, amount, is_paid FROM fixed_expenses WHERE user_id = ? ORDER BY due_date ASC',
            [testUser.id]
        );
        
        console.log('\n📋 Detalhes das despesas fixas:');
        fixedExpensesDetails.forEach(expense => {
            const status = expense.is_paid ? '✅ PAGA' : '❌ NÃO PAGA';
            console.log(`  - ${expense.description}: R$ ${expense.amount} (${status})`);
        });
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testBalanceCalculation();
