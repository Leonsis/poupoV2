const MonthlyExpenseDuplicationService = require('../services/monthlyExpenseDuplicationService');
const db = require('../config/database');

/**
 * Script para testar a duplicação mensal com o usuário 2
 */
async function testDuplicationUser2() {
    try {
        console.log('🧪 Testando duplicação mensal com usuário 2...');
        
        const userId = 2;
        const currentDate = new Date();
        const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        console.log(`📅 Mês/Ano: ${currentMonthYear}`);
        
        // Verificar despesas atuais
        const currentExpenses = await db.query(`
            SELECT id, description, amount, due_date, month_year, deleted_at
            FROM fixed_expenses 
            WHERE user_id = ? 
            AND deleted_at IS NULL
            ORDER BY due_date ASC
        `, [userId]);
        
        console.log(`📋 Despesas atuais: ${currentExpenses.length}`);
        currentExpenses.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} (dia ${expense.due_date}) [${expense.month_year || 'original'}]`);
        });
        
        // Executar duplicação
        console.log(`\n🔄 Executando duplicação...`);
        const result = await MonthlyExpenseDuplicationService.duplicateUserExpenses(userId, currentMonthYear);
        
        if (result.success) {
            console.log(`✅ Duplicação: ${result.duplicatedCount} despesas duplicadas`);
            
            // Verificar resultado
            const newExpenses = await db.query(`
                SELECT id, description, amount, due_date, month_year, deleted_at
                FROM fixed_expenses 
                WHERE user_id = ? 
                AND deleted_at IS NULL
                ORDER BY month_year ASC, due_date ASC
            `, [userId]);
            
            console.log(`\n📋 Despesas após duplicação: ${newExpenses.length}`);
            newExpenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} (dia ${expense.due_date}) [${expense.month_year || 'original'}]`);
            });
            
        } else {
            console.log(`❌ Erro na duplicação: ${result.message}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testDuplicationUser2();
