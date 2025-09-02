const db = require('../config/database');

async function fixCurrentOverdue() {
    try {
        console.log('🔧 Corrigindo despesas marcadas incorretamente como vencidas...');
        
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        console.log(`📅 Dia atual: ${currentDay}`);
        
        // Verificar despesas que estão marcadas como vencidas mas não deveriam estar
        const incorrectOverdue = await db.query(`
            SELECT id, description, due_date, is_overdue, is_paid
            FROM fixed_expenses 
            WHERE is_overdue = 1 
            AND is_paid = 0
            AND CAST(due_date AS INTEGER) >= ?
        `, [currentDay]);
        
        console.log(`📋 Despesas marcadas incorretamente como vencidas: ${incorrectOverdue.length}`);
        
        if (incorrectOverdue.length > 0) {
            console.log('📋 Lista de despesas incorretas:');
            incorrectOverdue.forEach(expense => {
                console.log(`  - ${expense.description}: vence dia ${expense.due_date} (hoje é dia ${currentDay})`);
            });
            
            // Corrigir as despesas
            const result = await db.run(`
                UPDATE fixed_expenses 
                SET is_overdue = 0
                WHERE is_overdue = 1 
                AND is_paid = 0
                AND CAST(due_date AS INTEGER) >= ?
            `, [currentDay]);
            
            console.log(`✅ ${result.changes} despesas corrigidas`);
        }
        
        // Verificar despesas que deveriam estar vencidas mas não estão marcadas
        const shouldBeOverdue = await db.query(`
            SELECT id, description, due_date, is_overdue, is_paid
            FROM fixed_expenses 
            WHERE is_overdue = 0 
            AND is_paid = 0
            AND CAST(due_date AS INTEGER) < ?
        `, [currentDay]);
        
        console.log(`📋 Despesas que deveriam estar vencidas: ${shouldBeOverdue.length}`);
        
        if (shouldBeOverdue.length > 0) {
            console.log('📋 Lista de despesas que deveriam estar vencidas:');
            shouldBeOverdue.forEach(expense => {
                console.log(`  - ${expense.description}: venceu dia ${expense.due_date} (hoje é dia ${currentDay})`);
            });
            
            // Marcar como vencidas
            const result = await db.run(`
                UPDATE fixed_expenses 
                SET is_overdue = 1
                WHERE is_overdue = 0 
                AND is_paid = 0
                AND CAST(due_date AS INTEGER) < ?
            `, [currentDay]);
            
            console.log(`✅ ${result.changes} despesas marcadas como vencidas`);
        }
        
        console.log('\n✅ Correção de despesas vencidas concluída!');
        
        // Verificar resultado final
        const finalCheck = await db.query(`
            SELECT id, description, due_date, is_overdue, is_paid
            FROM fixed_expenses 
            WHERE user_id = 2
            ORDER BY id
        `);
        
        console.log('\n📋 Status final das despesas:');
        finalCheck.forEach(expense => {
            console.log(`  - ${expense.description}: vence dia ${expense.due_date}, Vencida: ${expense.is_overdue ? 'Sim' : 'Não'}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao corrigir despesas vencidas:', error);
    } finally {
        process.exit(0);
    }
}

fixCurrentOverdue();

