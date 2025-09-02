const db = require('../config/database');

async function testDeleteSingleExpense() {
    try {
        console.log('🧪 Testando exclusão de despesa específica...');

        const userId = 2;
        
        // Verificar despesas antes da exclusão
        console.log('\n📋 Despesas antes da exclusão:');
        const expensesBefore = await db.query(`
            SELECT id, description, due_date, is_paid, is_overdue, month_year, original_expense_id
            FROM fixed_expenses 
            WHERE user_id = ?
            ORDER BY id
        `, [userId]);

        expensesBefore.forEach(expense => {
            console.log(`  - ID ${expense.id}: ${expense.description} (vence dia ${expense.due_date}) - Original: ${expense.original_expense_id}`);
        });

        // Deletar apenas a despesa ID 65 (duplicada)
        console.log('\n🗑️ Deletando apenas a despesa ID 65...');
        const result = await db.run(
            'DELETE FROM fixed_expenses WHERE id = ? AND user_id = ?',
            [65, userId]
        );

        console.log(`✅ Resultado: ${result.changes} despesa(s) deletada(s)`);

        // Verificar despesas após a exclusão
        console.log('\n📋 Despesas após a exclusão:');
        const expensesAfter = await db.query(`
            SELECT id, description, due_date, is_paid, is_overdue, month_year, original_expense_id
            FROM fixed_expenses 
            WHERE user_id = ?
            ORDER BY id
        `, [userId]);

        expensesAfter.forEach(expense => {
            console.log(`  - ID ${expense.id}: ${expense.description} (vence dia ${expense.due_date}) - Original: ${expense.original_expense_id}`);
        });

        console.log('\n✅ Teste concluído!');

    } catch (error) {
        console.error('❌ Erro ao testar exclusão:', error);
    } finally {
        process.exit(0);
    }
}

testDeleteSingleExpense();

