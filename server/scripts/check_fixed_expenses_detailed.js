const db = require('../config/database');

async function checkFixedExpensesDetailed() {
    try {
        console.log('🔍 Verificando detalhes das despesas fixas...');
        
        const userId = 2;
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        
        console.log(`📅 Data atual: ${currentDate.toLocaleDateString('pt-BR')}`);
        console.log(`📅 Dia atual: ${currentDay}`);
        console.log(`📅 Ano atual: ${currentDate.getFullYear()}`);
        
        const expenses = await db.query(`
            SELECT 
                id, 
                description, 
                amount, 
                due_date, 
                is_paid, 
                is_overdue, 
                month_year, 
                original_expense_id,
                created_at,
                updated_at
            FROM fixed_expenses 
            WHERE user_id = ?
            ORDER BY id
        `, [userId]);
        
        console.log(`📋 Total de despesas: ${expenses.length}`);
        
        expenses.forEach((expense, index) => {
            const isOverdue = currentDay > expense.due_date;
            console.log(`\n  ${index + 1}. ID: ${expense.id}`);
            console.log(`     Descrição: ${expense.description}`);
            console.log(`     Valor: R$ ${expense.amount}`);
            console.log(`     Vencimento: dia ${expense.due_date}`);
            console.log(`     Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
            console.log(`     Vencida (DB): ${expense.is_overdue ? 'Sim' : 'Não'}`);
            console.log(`     Vencida (Cálculo): ${isOverdue ? 'Sim' : 'Não'}`);
            console.log(`     Month_year: "${expense.month_year}"`);
            console.log(`     Original: ${expense.original_expense_id}`);
            console.log(`     Criada em: ${expense.created_at}`);
            console.log(`     Atualizada em: ${expense.updated_at}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar despesas:', error);
    } finally {
        process.exit(0);
    }
}

checkFixedExpensesDetailed();

