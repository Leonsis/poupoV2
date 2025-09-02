const db = require('../config/database');

async function testCreditCardBalance() {
    try {
        console.log('🧪 Testando cálculo de saldo dos cartões de crédito...');
        
        // Verificar usuário existente
        const user = await db.query('SELECT id, name, email FROM users LIMIT 1');
        
        if (user.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        const testUser = user[0];
        console.log(`\n👤 Usuário de teste: ${testUser.name} (${testUser.email})`);
        
        // Verificar contas bancárias
        const bankAccounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ?',
            [testUser.id]
        );
        
        if (bankAccounts.length === 0) {
            console.log('❌ Nenhuma conta bancária encontrada para teste');
            return;
        }
        
        console.log('\n🏦 Contas bancárias encontradas:');
        bankAccounts.forEach(account => {
            console.log(`  - ID ${account.id}: ${account.account_name}`);
            console.log(`    Tipo: ${account.account_type} • ${account.account_category}`);
            console.log(`    Saldo atual: R$ ${account.balance}`);
            if (account.credit_limit) {
                console.log(`    Limite: R$ ${account.credit_limit}`);
            }
            console.log('');
        });
        
        // Verificar gastos com cartão de crédito
        const creditCardExpenses = await db.query(
            `SELECT e.*, ba.account_name, ba.account_category 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND (e.payment_method = 'credito' OR ba.account_category = 'credito')`,
            [testUser.id]
        );
        
        console.log('\n💳 Gastos com cartão de crédito:');
        if (creditCardExpenses.length === 0) {
            console.log('  ❌ Nenhum gasto com cartão de crédito encontrado');
        } else {
            creditCardExpenses.forEach(expense => {
                console.log(`  - ${expense.description}: R$ ${expense.amount}`);
                console.log(`    Data: ${expense.expense_date}`);
                console.log(`    Conta: ${expense.account_name || 'Não especificada'}`);
                console.log('');
            });
        }
        
        // Calcular saldo para cartões de crédito
        console.log('\n🧮 Cálculo de saldo para cartões de crédito:');
        const creditCards = bankAccounts.filter(account => account.account_category === 'credito');
        
        if (creditCards.length === 0) {
            console.log('  ❌ Nenhum cartão de crédito encontrado');
        } else {
            creditCards.forEach(card => {
                const cardExpenses = creditCardExpenses.filter(expense => 
                    expense.bank_account_id === card.id
                );
                
                const totalCardExpenses = cardExpenses.reduce((sum, expense) => 
                    sum + parseFloat(expense.amount || 0), 0
                );
                
                const calculatedBalance = parseFloat(card.credit_limit || 0) - totalCardExpenses;
                
                console.log(`  - ${card.account_name}:`);
                console.log(`    Limite: R$ ${card.credit_limit}`);
                console.log(`    Gastos: R$ ${totalCardExpenses}`);
                console.log(`    Saldo calculado: R$ ${calculatedBalance} (Limite - Gastos)`);
                console.log(`    Saldo atual no banco: R$ ${card.balance}`);
                console.log('');
            });
        }
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testCreditCardBalance();
