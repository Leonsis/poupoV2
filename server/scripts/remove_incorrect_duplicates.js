const db = require('../config/database');

async function removeIncorrectDuplicates() {
    try {
        console.log('🧹 Removendo duplicatas incorretas...');

        // Verificar despesas duplicadas
        const duplicates = await db.query(`
            SELECT fe1.id as original_id, fe1.description, fe1.due_date, fe1.month_year,
                   fe2.id as duplicate_id, fe2.original_expense_id
            FROM fixed_expenses fe1
            INNER JOIN fixed_expenses fe2 ON fe1.description = fe2.description 
                AND fe1.user_id = fe2.user_id 
                AND fe1.amount = fe2.amount
                AND fe1.due_date = fe2.due_date
                AND fe1.id != fe2.id
            WHERE fe1.user_id = 2
            ORDER BY fe1.id
        `);

        console.log(`📋 Encontradas ${duplicates.length} duplicatas`);

        if (duplicates.length > 0) {
            // Remover as duplicatas (manter apenas a original)
            for (const duplicate of duplicates) {
                console.log(`  🗑️ Removendo duplicata ID ${duplicate.duplicate_id} (${duplicate.description})`);
                await db.run('DELETE FROM fixed_expenses WHERE id = ?', [duplicate.duplicate_id]);
            }
        }

        // Verificar resultado final
        const finalExpenses = await db.query(`
            SELECT id, description, due_date, is_paid, is_overdue, month_year, original_expense_id
            FROM fixed_expenses 
            WHERE user_id = 2
            ORDER BY id
        `);

        console.log('\n📋 Despesas finais:');
        finalExpenses.forEach(expense => {
            console.log(`  - ID ${expense.id}: ${expense.description} (vence dia ${expense.due_date}) - Vencida: ${expense.is_overdue ? 'Sim' : 'Não'}`);
        });

    } catch (error) {
        console.error('❌ Erro ao remover duplicatas:', error);
    } finally {
        process.exit(0);
    }
}

removeIncorrectDuplicates();
