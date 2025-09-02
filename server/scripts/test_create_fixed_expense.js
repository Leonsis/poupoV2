const db = require('../config/database');

async function testCreateFixedExpense() {
    try {
        console.log('🧪 Testando criação de despesa fixa...');

        const userId = 2;
        const currentDate = new Date();
        console.log(`📅 Data atual: ${currentDate.toLocaleDateString('pt-BR')} ${currentDate.toLocaleTimeString('pt-BR')}`);
        console.log(`📅 Dia atual: ${currentDate.getDate()}`);

        // Criar uma despesa fixa de teste
        console.log('\n📝 Criando despesa fixa de teste...');
        const result = await db.run(`
            INSERT INTO fixed_expenses (
                user_id, description, amount, due_date, is_paid,
                is_overdue, month_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
        `, [userId, 'Teste Nova Despesa', 100.00, 30, 0, 0, null]);

        console.log(`✅ Despesa criada com ID: ${result.id}`);

        // Verificar a despesa criada
        const expense = await db.get(`
            SELECT * FROM fixed_expenses WHERE id = ?
        `, [result.id]);

        if (!expense) {
            console.log('❌ Despesa não foi encontrada após criação');
            return;
        }

        console.log('\n📋 Despesa criada:');
        console.log(`  ID: ${expense.id}`);
        console.log(`  Descrição: ${expense.description}`);
        console.log(`  Valor: R$ ${expense.amount}`);
        console.log(`  Vencimento: dia ${expense.due_date}`);
        console.log(`  Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
        console.log(`  Vencida (DB): ${expense.is_overdue ? 'Sim' : 'Não'}`);
        console.log(`  Month_year: "${expense.month_year}"`);

        // Testar o serviço para ver como ele interpreta a despesa
        const FixedExpenseTransitionService = require('../services/fixedExpenseTransitionService');

        console.log('\n📋 Testando getFixedExpensesWithTransition...');
        const expenses = await FixedExpenseTransitionService.getFixedExpensesWithTransition(userId);
        
        const testExpense = expenses.find(e => e.id === expense.id);
        if (testExpense) {
            console.log(`  Status calculado: ${testExpense.status}`);
        } else {
            console.log('  ❌ Despesa não encontrada no serviço');
        }

        // Verificar se está vencida baseado na data atual
        const isOverdue = FixedExpenseTransitionService.isExpenseOverdue(expense.due_date);
        console.log(`  Vencida (Cálculo): ${isOverdue ? 'Sim' : 'Não'}`);

        // Limpar a despesa de teste
        console.log('\n🧹 Removendo despesa de teste...');
        await db.run('DELETE FROM fixed_expenses WHERE id = ?', [expense.id]);
        console.log('✅ Despesa de teste removida');

    } catch (error) {
        console.error('❌ Erro ao testar criação:', error);
    } finally {
        process.exit(0);
    }
}

testCreateFixedExpense();
