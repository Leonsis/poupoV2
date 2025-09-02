const db = require('../config/database');

async function testDetailedSummariesUpdate() {
    try {
        console.log('🧪 Testando atualização dos dados para Resumos Detalhados...');
        
        // Verificar usuário existente
        const user = await db.query('SELECT id, name, email FROM users LIMIT 1');
        
        if (user.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        const testUser = user[0];
        console.log(`\n👤 Usuário de teste: ${testUser.name} (${testUser.email})`);
        
        // Simular dados do período atual (setembro 2025)
        const startDate = '2025-09-01';
        const endDate = '2025-10-01';
        
        console.log(`\n📅 Período de teste: ${startDate} a ${endDate}`);
        
        // 1. Verificar receitas do período
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [testUser.id, startDate, endDate]
        );
        
        console.log('\n💰 Receitas do período:');
        console.log(`  - Total: R$ ${income[0]?.total || 0}`);
        
        // 2. Verificar despesas variáveis do período
        const expenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')`,
            [testUser.id, startDate, endDate]
        );
        
        console.log('\n💸 Despesas variáveis do período:');
        console.log(`  - Total: R$ ${expenses[0]?.total || 0}`);
        
        // 3. Verificar despesas fixas (todas, não apenas do período)
        const fixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ?',
            [testUser.id]
        );
        
        console.log('\n📋 Despesas fixas (todas):');
        console.log(`  - Total: R$ ${fixedExpenses[0]?.total || 0}`);
        
        // 4. Verificar despesas fixas pagas vs não pagas
        const fixedExpensesPaid = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 1',
            [testUser.id]
        );
        
        const fixedExpensesUnpaid = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [testUser.id]
        );
        
        console.log('\n📊 Status das despesas fixas:');
        console.log(`  - Pagas: R$ ${fixedExpensesPaid[0]?.total || 0}`);
        console.log(`  - Não pagas: R$ ${fixedExpensesUnpaid[0]?.total || 0}`);
        
        // 5. Calcular saldo de diferentes formas
        const totalIncome = income[0]?.total || 0;
        const totalExpenses = expenses[0]?.total || 0;
        const totalFixedExpenses = fixedExpenses[0]?.total || 0;
        const totalFixedExpensesUnpaid = fixedExpensesUnpaid[0]?.total || 0;
        
        console.log('\n🧮 Cálculo do saldo:');
        
        // Saldo atual da API (incorreto)
        const currentBalance = totalIncome - totalExpenses - totalFixedExpenses;
        console.log(`  - Saldo atual da API: R$ ${currentBalance.toFixed(2)}`);
        console.log(`    (Receitas - Despesas - Todas Despesas Fixas)`);
        
        // Saldo correto (considerando apenas despesas fixas não pagas)
        const correctBalance = totalIncome - totalExpenses - totalFixedExpensesUnpaid;
        console.log(`  - Saldo correto: R$ ${correctBalance.toFixed(2)}`);
        console.log(`    (Receitas - Despesas - Despesas Fixas NÃO Pagas)`);
        
        // 6. Verificar se há mudanças recentes
        console.log('\n🔄 Verificando mudanças recentes...');
        
        const recentIncome = await db.query(
            'SELECT * FROM income WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
            [testUser.id]
        );
        
        const recentExpenses = await db.query(
            'SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
            [testUser.id]
        );
        
        const recentFixedExpenses = await db.query(
            'SELECT * FROM fixed_expenses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 3',
            [testUser.id]
        );
        
        console.log('\n📝 Últimas receitas:');
        recentIncome.forEach(inc => {
            console.log(`  - ${inc.source}: R$ ${inc.amount} (${inc.created_at})`);
        });
        
        console.log('\n📝 Últimas despesas:');
        recentExpenses.forEach(exp => {
            console.log(`  - ${exp.description}: R$ ${exp.amount} (${exp.created_at})`);
        });
        
        console.log('\n📝 Últimas despesas fixas atualizadas:');
        recentFixedExpenses.forEach(fexp => {
            console.log(`  - ${fexp.description}: R$ ${fexp.amount} (Paga: ${fexp.is_paid ? 'Sim' : 'Não'}) (${fexp.updated_at})`);
        });
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testDetailedSummariesUpdate();
