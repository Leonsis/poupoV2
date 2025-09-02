const FixedExpenseTransitionService = require('../services/fixedExpenseTransitionService');

async function testService() {
    try {
        console.log('🔍 Testando serviço diretamente...');
        
        const userId = 2; // ID do usuário CAIO LEONNI
        
        console.log('📋 Testando getFixedExpensesWithTransition...');
        const expenses = await FixedExpenseTransitionService.getFixedExpensesWithTransition(userId);
        console.log('✅ Despesas retornadas:', expenses.length);
        
        if (expenses.length > 0) {
            expenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} - Status: ${expense.status}`);
            });
        } else {
            console.log('❌ Nenhuma despesa retornada!');
        }
        
        console.log('\n📋 Testando getOverdueExpensesCount...');
        const overdueCount = await FixedExpenseTransitionService.getOverdueExpensesCount(userId);
        console.log('✅ Despesas vencidas:', overdueCount);
        
        // Testar query direta
        console.log('\n🔍 Testando query direta...');
        const db = require('../config/database');
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const directQuery = await db.query(`
            SELECT 
                fe.*,
                ba.account_name,
                CASE 
                    WHEN fe.is_paid = 1 THEN 'Paga'
                    WHEN CAST(fe.due_date AS INTEGER) < ? AND fe.is_paid = 0 THEN 'Vencida'
                    ELSE 'Pendente'
                END as status
            FROM fixed_expenses fe
            LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
            WHERE fe.user_id = ?
            AND (fe.month_year IS NULL OR fe.month_year = 'null' OR fe.month_year = ?)
        `, [currentDay, userId, currentMonthYear]);
        
        console.log('📋 Query direta retornou:', directQuery.length, 'despesas');
        directQuery.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} - Status: ${expense.status}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao testar serviço:', error);
    } finally {
        process.exit(0);
    }
}

testService();
