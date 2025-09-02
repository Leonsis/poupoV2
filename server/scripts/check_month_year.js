const db = require('../config/database');

async function checkMonthYear() {
    try {
        console.log('🔍 Verificando valores de month_year nas despesas fixas...');
        
        const userId = 2;
        const currentDate = new Date();
        const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        console.log(`📅 Mês/ano atual: ${currentMonthYear}`);
        
        const expenses = await db.query(`
            SELECT id, description, due_date, is_paid, is_overdue, month_year, original_expense_id
            FROM fixed_expenses 
            WHERE user_id = ?
            ORDER BY id
        `, [userId]);
        
        console.log(`📋 Total de despesas: ${expenses.length}`);
        
        expenses.forEach((expense, index) => {
            console.log(`  ${index + 1}. ID: ${expense.id}, ${expense.description} - Vence: ${expense.due_date}, Paga: ${expense.is_paid}, Vencida: ${expense.is_overdue}, Month_year: "${expense.month_year}", Original: ${expense.original_expense_id}`);
        });
        
        // Testar a query que está sendo usada
        console.log('\n🔍 Testando query com filtro month_year...');
        const filteredExpenses = await db.query(`
            SELECT id, description, due_date, is_paid, is_overdue, month_year
            FROM fixed_expenses 
            WHERE user_id = ?
            AND (month_year IS NULL OR month_year = ?)
        `, [userId, currentMonthYear]);
        
        console.log(`📋 Despesas com filtro month_year: ${filteredExpenses.length}`);
        filteredExpenses.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description} - Month_year: "${expense.month_year}"`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar month_year:', error);
    } finally {
        process.exit(0);
    }
}

checkMonthYear();
