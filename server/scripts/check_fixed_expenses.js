const db = require('../config/database');

async function checkFixedExpenses() {
    try {
        console.log('🔍 Verificando despesas fixas no banco...');
        
        // Verificar todas as despesas fixas
        const allFixedExpenses = await db.query("SELECT * FROM fixed_expenses");
        console.log(`📋 Total de despesas fixas: ${allFixedExpenses.length}`);
        
        if (allFixedExpenses.length > 0) {
            console.log('📋 Despesas fixas encontradas:');
            allFixedExpenses.forEach(expense => {
                console.log(`  - ID: ${expense.id}, User ID: ${expense.user_id}, Descrição: ${expense.description}, Valor: R$ ${expense.amount}`);
            });
        }
        
        // Verificar usuários
        const users = await db.query("SELECT id, name, email FROM users");
        console.log(`\n👥 Usuários cadastrados: ${users.length}`);
        users.forEach(user => {
            console.log(`  - ID: ${user.id}, Nome: ${user.name}, Email: ${user.email}`);
        });
        
        // Verificar despesas fixas por usuário
        for (const user of users) {
            const userFixedExpenses = await db.query("SELECT * FROM fixed_expenses WHERE user_id = ?", [user.id]);
            console.log(`\n📋 Despesas fixas do usuário ${user.name} (ID: ${user.id}): ${userFixedExpenses.length}`);
            if (userFixedExpenses.length > 0) {
                userFixedExpenses.forEach(expense => {
                    console.log(`  - ${expense.description}: R$ ${expense.amount}`);
                });
            }
        }
        
        console.log('\n✅ Verificação concluída!');
    } catch (error) {
        console.error('❌ Erro ao verificar despesas fixas:', error);
    } finally {
        process.exit(0);
    }
}

checkFixedExpenses();
