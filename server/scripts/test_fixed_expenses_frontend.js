const db = require('../config/database');

async function testFixedExpensesFrontend() {
    try {
        console.log('🧪 Testando se despesas fixas aparecem no frontend...\n');

        // 1. Verificar se há despesas fixas no banco
        console.log('📊 1. Verificando despesas fixas no banco:');
        const allExpenses = await db.query('SELECT * FROM fixed_expenses ORDER BY created_at DESC');
        
        if (allExpenses.length === 0) {
            console.log('  - Nenhuma despesa fixa encontrada no banco');
            console.log('  - O problema pode ser que não há dados para mostrar');
            return;
        }

        console.log(`  - Total de despesas fixas: ${allExpenses.length}`);
        allExpenses.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description}`);
            console.log(`     - Valor: R$ ${expense.amount}`);
            console.log(`     - Vencimento: Dia ${expense.due_date}`);
            console.log(`     - Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
            console.log(`     - Categoria: ${expense.category || 'Não especificada'}`);
            console.log(`     - É boleto: ${expense.is_boleto ? 'Sim' : 'Não'}`);
            console.log(`     - Parcelas: ${expense.total_installments || 1}`);
            console.log(`     - Parcelas pagas: ${expense.paid_installments || 0}`);
            console.log(`     - Usuário ID: ${expense.user_id}`);
            console.log(`     - Criada em: ${expense.created_at}`);
            console.log('');
        });

        // 2. Simular a consulta da API
        console.log('🌐 2. Simulando consulta da API:');
        
        const userId = 1; // Assumindo usuário ID 1
        console.log(`  - Consultando para usuário ID: ${userId}`);
        
        const apiQuery = await db.query(
            'SELECT fe.*, ba.account_name FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.user_id = ? ORDER BY fe.due_date ASC',
            [userId]
        );
        
        console.log(`  - Resultado da API: ${apiQuery.length} despesas`);
        
        if (apiQuery.length > 0) {
            apiQuery.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description}`);
                console.log(`     - Valor: R$ ${expense.amount}`);
                console.log(`     - Vencimento: Dia ${expense.due_date}`);
                console.log(`     - Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
                console.log(`     - Categoria: ${expense.category || 'Não especificada'}`);
                console.log(`     - Conta: ${expense.account_name || 'Não especificada'}`);
                console.log('');
            });
        } else {
            console.log('  ❌ API não retorna despesas para este usuário');
        }

        // 3. Verificar se há problemas de usuário
        console.log('👤 3. Verificando usuários:');
        const users = await db.query('SELECT id, name, email FROM users ORDER BY id');
        console.log(`  - Total de usuários: ${users.length}`);
        users.forEach(user => {
            console.log(`    * ID: ${user.id}, Nome: ${user.name}, Email: ${user.email}`);
        });

        // 4. Verificar se as despesas pertencem ao usuário correto
        console.log('\n🔍 4. Verificando propriedade das despesas:');
        
        const userExpenses = await db.query('SELECT user_id, COUNT(*) as count FROM fixed_expenses GROUP BY user_id');
        console.log('  - Despesas por usuário:');
        userExpenses.forEach(item => {
            console.log(`    * Usuário ID ${item.user_id}: ${item.count} despesas`);
        });

        // 5. Verificar se há problemas de JOIN
        console.log('\n🔗 5. Verificando JOIN com contas bancárias:');
        
        const expensesWithAccounts = await db.query(`
            SELECT 
                fe.id, 
                fe.description, 
                fe.amount, 
                fe.due_date,
                fe.user_id,
                ba.account_name,
                ba.id as bank_account_id
            FROM fixed_expenses fe 
            LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id 
            WHERE fe.user_id = ?
        `, [userId]);
        
        console.log(`  - Despesas com JOIN: ${expensesWithAccounts.length}`);
        expensesWithAccounts.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description}`);
            console.log(`     - Valor: R$ ${expense.amount}`);
            console.log(`     - Vencimento: Dia ${expense.due_date}`);
            console.log(`     - Conta: ${expense.account_name || 'Não especificada'} (ID: ${expense.bank_account_id || 'Nenhuma'})`);
        });

        // 6. Testar inserção de uma nova despesa
        console.log('\n🧪 6. Testando inserção de nova despesa:');
        
        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        try {
            const testResult = await db.run(
                'INSERT INTO fixed_expenses (user_id, description, amount, due_date, category, is_boleto, total_installments, paid_installments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, 'Teste Frontend', 200.00, 15, 'Teste', 0, 1, 0, currentDateTime, currentDateTime]
            );
            
            console.log(`  ✅ Nova despesa criada (ID: ${testResult.id})`);
            
            // Verificar se aparece na consulta da API
            const newApiQuery = await db.query(
                'SELECT fe.*, ba.account_name FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.user_id = ? ORDER BY fe.due_date ASC',
                [userId]
            );
            
            console.log(`  - Total após inserção: ${newApiQuery.length} despesas`);
            
            // Limpar teste
            await db.run('DELETE FROM fixed_expenses WHERE id = ?', [testResult.id]);
            console.log('  🧹 Despesa de teste removida');
            
        } catch (error) {
            console.log('  ❌ Erro ao criar despesa de teste:', error.message);
        }

        // 7. Diagnóstico
        console.log('\n💡 7. Diagnóstico:');
        
        if (apiQuery.length === 0 && allExpenses.length > 0) {
            console.log('  ❌ PROBLEMA IDENTIFICADO:');
            console.log('    - Despesas existem no banco');
            console.log('    - Mas API não retorna para o usuário');
            console.log('    - Possível problema: user_id incorreto');
        } else if (apiQuery.length > 0) {
            console.log('  ✅ API está funcionando corretamente');
            console.log('  🔍 O problema pode estar no frontend');
        } else {
            console.log('  ❌ Nenhuma despesa encontrada');
            console.log('  🔧 Criar uma despesa para testar');
        }

        console.log('\n🎯 Teste concluído!');

    } catch (error) {
        console.error('❌ Erro ao testar:', error);
    } finally {
        process.exit(0);
    }
}

testFixedExpensesFrontend();
