const db = require('../config/database');

async function testOverdueDetection() {
    try {
        console.log('🧪 Testando detecção de despesas vencidas...');

        const userId = 2;
        const currentDate = new Date();
        console.log(`📅 Data atual: ${currentDate.toLocaleDateString('pt-BR')} (dia ${currentDate.getDate()})`);

        // Criar uma despesa que vence no dia 26 (já vencida)
        console.log('\n📝 Criando despesa vencida (dia 26)...');
        const result = await db.run(`
            INSERT INTO fixed_expenses (
                user_id, description, amount, due_date, is_paid,
                is_overdue, month_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
        `, [userId, 'Teste Vencida Dia 26', 150.00, 26, 0, 0, null]);

        console.log(`✅ Despesa criada com ID: ${result.id}`);

        // Testar o serviço
        const FixedExpenseTransitionService = require('../services/fixedExpenseTransitionService');

        console.log('\n📋 Testando getFixedExpensesWithTransition...');
        const expenses = await FixedExpenseTransitionService.getFixedExpensesWithTransition(userId);
        
        const testExpense = expenses.find(e => e.id === result.id);
        if (testExpense) {
            console.log(`  Status calculado: ${testExpense.status}`);
        }

        console.log('\n📋 Testando getOverdueExpensesCount...');
        const overdueCount = await FixedExpenseTransitionService.getOverdueExpensesCount(userId);
        console.log(`  Total de despesas vencidas: ${overdueCount}`);

        // Limpar a despesa de teste
        console.log('\n🧹 Removendo despesa de teste...');
        await db.run('DELETE FROM fixed_expenses WHERE id = ?', [result.id]);
        console.log('✅ Despesa de teste removida');

    } catch (error) {
        console.error('❌ Erro ao testar detecção:', error);
    } finally {
        process.exit(0);
    }
}

testOverdueDetection();
