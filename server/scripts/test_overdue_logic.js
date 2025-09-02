const db = require('../config/database');

async function testOverdueLogic() {
    try {
        console.log('🧪 Testando lógica de vencimento...');
        
        const userId = 2;
        const currentDate = new Date();
        console.log(`📅 Data atual: ${currentDate.toLocaleDateString('pt-BR')} ${currentDate.toLocaleTimeString('pt-BR')}`);
        
        // Criar uma despesa de teste que vence no dia 25 (já vencida)
        console.log('\n📝 Criando despesa de teste vencida (dia 25)...');
        const result = await db.run(`
            INSERT INTO fixed_expenses (
                user_id, description, amount, due_date, is_paid, 
                is_overdue, month_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [userId, 'Teste Vencida', 150.00, 25, 0, 0, '2025-08']);
        
        console.log(`✅ Despesa criada com ID: ${result.lastID}`);
        
        // Testar o serviço
        const FixedExpenseTransitionService = require('../services/fixedExpenseTransitionService');
        
        console.log('\n📋 Testando getFixedExpensesWithTransition...');
        const expenses = await FixedExpenseTransitionService.getFixedExpensesWithTransition(userId);
        console.log(`✅ Despesas retornadas: ${expenses.length}`);
        
        expenses.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} - Vence: ${expense.due_date} - Status: ${expense.status}`);
        });
        
        console.log('\n📋 Testando getOverdueExpensesCount...');
        const overdueCount = await FixedExpenseTransitionService.getOverdueExpensesCount(userId);
        console.log(`✅ Despesas vencidas: ${overdueCount}`);
        
        // Limpar a despesa de teste
        console.log('\n🧹 Removendo despesa de teste...');
        await db.run('DELETE FROM fixed_expenses WHERE description = ? AND user_id = ?', ['Teste Vencida', userId]);
        console.log('✅ Despesa de teste removida');
        
    } catch (error) {
        console.error('❌ Erro ao testar lógica:', error);
    } finally {
        process.exit(0);
    }
}

testOverdueLogic();
