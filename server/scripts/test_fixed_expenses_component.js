const db = require('../config/database');

async function testFixedExpensesComponent() {
    try {
        console.log('🧪 Testando componente de despesas fixas...');
        
        // Verificar usuário existente
        const user = await db.query('SELECT id, name, email FROM users LIMIT 1');
        
        if (user.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        const testUser = user[0];
        console.log(`\n👤 Usuário de teste: ${testUser.name} (${testUser.email})`);
        
        // Verificar despesas fixas existentes
        const fixedExpenses = await db.query(`
            SELECT fe.*, ba.account_name, ba.account_category 
            FROM fixed_expenses fe 
            LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id 
            WHERE fe.user_id = ?
        `, [testUser.id]);
        
        if (fixedExpenses.length === 0) {
            console.log('❌ Nenhuma despesa fixa encontrada para teste');
            return;
        }
        
        console.log('\n📋 Despesas fixas encontradas:');
        fixedExpenses.forEach(expense => {
            console.log(`  - ID ${expense.id}: ${expense.description}`);
            console.log(`    Valor: R$ ${expense.amount}`);
            console.log(`    Vencimento: Dia ${expense.due_date}`);
            console.log(`    Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
            console.log(`    Vencida: ${expense.is_overdue ? 'Sim' : 'Não'}`);
            console.log(`    Categoria: ${expense.category || 'Não especificada'}`);
            console.log(`    Conta: ${expense.account_name || 'Não especificada'}`);
            console.log(`    Boleto: ${expense.is_boleto ? 'Sim' : 'Não'}`);
            if (expense.is_boleto) {
                console.log(`    Parcelas: ${expense.paid_installments || 0}/${expense.total_installments || 0}`);
            }
            console.log('');
        });
        
        // Verificar se há dados inconsistentes
        console.log('\n🔍 Verificando consistência dos dados...');
        
        const inconsistentData = fixedExpenses.filter(expense => {
            return !expense.description || 
                   !expense.amount || 
                   !expense.due_date ||
                   expense.amount <= 0 ||
                   expense.due_date < 1 ||
                   expense.due_date > 31;
        });
        
        if (inconsistentData.length > 0) {
            console.log('⚠️  Dados inconsistentes encontrados:');
            inconsistentData.forEach(expense => {
                console.log(`  - ID ${expense.id}: ${expense.description}`);
                console.log(`    Problemas: ${JSON.stringify({
                    description: expense.description,
                    amount: expense.amount,
                    due_date: expense.due_date
                })}`);
            });
        } else {
            console.log('✅ Todos os dados estão consistentes');
        }
        
        // Testar formatação de moeda
        console.log('\n💰 Testando formatação de moeda:');
        const testAmounts = [0, 100, 1000.50, 1234.56, 'invalid'];
        
        testAmounts.forEach(amount => {
            try {
                const formatted = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(amount);
                console.log(`  ${amount} -> ${formatted}`);
            } catch (error) {
                console.log(`  ${amount} -> ERRO: ${error.message}`);
            }
        });
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testFixedExpensesComponent();
