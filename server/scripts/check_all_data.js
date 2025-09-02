const db = require('../config/database');

async function checkAllData() {
    try {
        console.log('🔍 Verificando todos os dados no banco...');
        
        // Verificar usuários
        const users = await db.query('SELECT id, email, created_at FROM users');
        console.log('\n👥 Usuários:');
        users.forEach(user => {
            console.log(`  - ID ${user.id}: ${user.email} (criado em ${user.created_at})`);
        });

        // Verificar contas bancárias
        const bankAccounts = await db.query('SELECT id, user_id, account_name, account_type, balance FROM bank_accounts');
        console.log('\n🏦 Contas Bancárias:');
        bankAccounts.forEach(account => {
            console.log(`  - ID ${account.id}: ${account.account_name} (usuário ${account.user_id}) - R$ ${account.balance}`);
        });

        // Verificar receitas
        const income = await db.query('SELECT id, user_id, source, amount, income_date FROM income');
        console.log('\n💰 Receitas:');
        income.forEach(inc => {
            console.log(`  - ID ${inc.id}: ${inc.source} - R$ ${inc.amount} (usuário ${inc.user_id}, data ${inc.income_date})`);
        });

        // Verificar despesas
        const expenses = await db.query('SELECT id, user_id, description, amount, expense_date FROM expenses');
        console.log('\n💸 Despesas:');
        expenses.forEach(exp => {
            console.log(`  - ID ${exp.id}: ${exp.description} - R$ ${exp.amount} (usuário ${exp.user_id}, data ${exp.expense_date})`);
        });

        // Verificar despesas fixas
        const fixedExpenses = await db.query('SELECT id, user_id, description, amount, due_date, is_paid FROM fixed_expenses');
        console.log('\n📅 Despesas Fixas:');
        fixedExpenses.forEach(fe => {
            console.log(`  - ID ${fe.id}: ${fe.description} - R$ ${fe.amount} (usuário ${fe.user_id}, vence dia ${fe.due_date}, paga: ${fe.is_paid})`);
        });

        console.log('\n✅ Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro ao verificar dados:', error);
    } finally {
        process.exit(0);
    }
}

checkAllData();
