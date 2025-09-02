const db = require('../config/database');

async function recreateOriginalExpense() {
    try {
        console.log('📝 Recriando despesa original NEOENERGIA...');

        const userId = 2;
        
        // Recriar a despesa original
        const result = await db.run(`
            INSERT INTO fixed_expenses (
                user_id, description, amount, due_date, is_paid,
                is_overdue, month_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
        `, [userId, 'NEOENERGIA', 200.00, 30, 0, 0, null]);

        console.log(`✅ Despesa recriada com ID: ${result.id}`);

        // Verificar a despesa criada
        const expense = await db.get(`
            SELECT * FROM fixed_expenses WHERE id = ?
        `, [result.id]);

        console.log('\n📋 Despesa recriada:');
        console.log(`  ID: ${expense.id}`);
        console.log(`  Descrição: ${expense.description}`);
        console.log(`  Valor: R$ ${expense.amount}`);
        console.log(`  Vencimento: dia ${expense.due_date}`);
        console.log(`  Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
        console.log(`  Vencida: ${expense.is_overdue ? 'Sim' : 'Não'}`);
        console.log(`  Month_year: "${expense.month_year}"`);

    } catch (error) {
        console.error('❌ Erro ao recriar despesa:', error);
    } finally {
        process.exit(0);
    }
}

recreateOriginalExpense();
