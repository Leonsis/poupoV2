const db = require('../config/database');

async function testTransitionLogic() {
    try {
        console.log('🧪 Testando nova lógica de transição mensal...');

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
        `, [userId, 'Teste Transição', 100.00, 26, 0, 0, null]);

        console.log(`✅ Despesa criada com ID: ${result.id}`);

        // Testar a nova lógica de transição
        const FixedExpenseTransitionService = require('../services/fixedExpenseTransitionService');

        console.log('\n📋 Testando needsMonthlyTransition...');
        const needsTransition = await FixedExpenseTransitionService.needsMonthlyTransition(userId);
        console.log(`  Precisa de transição: ${needsTransition ? 'Sim' : 'Não'}`);

        if (needsTransition) {
            console.log('\n📋 Executando transição mensal...');
            const transitionResult = await FixedExpenseTransitionService.executeMonthlyTransition(userId);
            console.log(`  Resultado: ${transitionResult.message}`);
            console.log(`  Despesas processadas: ${transitionResult.processedExpenses}`);
        }

        // Verificar resultado final
        console.log('\n📋 Verificando despesas após transição...');
        const expenses = await FixedExpenseTransitionService.getFixedExpensesWithTransition(userId);
        
        expenses.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} - Status: ${expense.status}`);
        });

        // Limpar despesas de teste
        console.log('\n🧹 Removendo despesas de teste...');
        await db.run('DELETE FROM fixed_expenses WHERE description = ? AND user_id = ?', ['Teste Transição', userId]);
        console.log('✅ Despesas de teste removidas');

    } catch (error) {
        console.error('❌ Erro ao testar transição:', error);
    } finally {
        process.exit(0);
    }
}

testTransitionLogic();
