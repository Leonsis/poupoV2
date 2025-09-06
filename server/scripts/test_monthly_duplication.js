const MonthlyExpenseDuplicationService = require('../services/monthlyExpenseDuplicationService');
const db = require('../config/database');

/**
 * Script para testar a duplicação mensal de despesas fixas
 */
async function testMonthlyDuplication() {
    try {
        console.log('🧪 Testando duplicação mensal de despesas fixas...');
        console.log(`📅 Data atual: ${new Date().toLocaleString('pt-BR')}`);
        
        // Verificar se é dia 1
        const isFirstDay = MonthlyExpenseDuplicationService.isFirstDayOfMonth();
        console.log(`📅 É dia 1 do mês: ${isFirstDay ? 'Sim' : 'Não'}`);
        
        // Buscar usuários para teste
        const users = await db.query(`
            SELECT id, name, email 
            FROM users 
            WHERE deleted_at IS NULL 
            AND is_banned = 0
            LIMIT 3
        `);
        
        console.log(`👥 Usuários encontrados: ${users.length}`);
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado para teste');
            return;
        }
        
        // Testar duplicação para o primeiro usuário
        const testUser = users[0];
        console.log(`\n👤 Testando com usuário: ${testUser.name} (ID: ${testUser.id})`);
        
        // Verificar despesas atuais
        const currentExpenses = await db.query(`
            SELECT id, description, amount, due_date, month_year, deleted_at
            FROM fixed_expenses 
            WHERE user_id = ? 
            AND deleted_at IS NULL
            ORDER BY due_date ASC
        `, [testUser.id]);
        
        console.log(`📋 Despesas atuais: ${currentExpenses.length}`);
        currentExpenses.forEach((expense, index) => {
            console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} (dia ${expense.due_date}) [${expense.month_year || 'original'}]`);
        });
        
        // Simular duplicação para o mês atual
        const currentDate = new Date();
        const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        console.log(`\n🔄 Simulando duplicação para: ${currentMonthYear}`);
        
        const result = await MonthlyExpenseDuplicationService.duplicateUserExpenses(testUser.id, currentMonthYear);
        
        if (result.success) {
            console.log(`✅ Duplicação simulada: ${result.duplicatedCount} despesas duplicadas`);
            
            // Verificar resultado
            const newExpenses = await db.query(`
                SELECT id, description, amount, due_date, month_year, deleted_at
                FROM fixed_expenses 
                WHERE user_id = ? 
                AND deleted_at IS NULL
                ORDER BY month_year ASC, due_date ASC
            `, [testUser.id]);
            
            console.log(`\n📋 Despesas após duplicação: ${newExpenses.length}`);
            newExpenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} (dia ${expense.due_date}) [${expense.month_year || 'original'}]`);
            });
            
        } else {
            console.log(`❌ Erro na duplicação: ${result.message}`);
        }
        
        // Testar execução completa
        console.log(`\n🔄 Testando execução completa...`);
        const fullResult = await MonthlyExpenseDuplicationService.executeIfNeeded();
        
        console.log(`📊 Resultado da execução completa:`);
        console.log(`  • Executado: ${fullResult.executed ? 'Sim' : 'Não'}`);
        console.log(`  • Sucesso: ${fullResult.success ? 'Sim' : 'Não'}`);
        console.log(`  • Mensagem: ${fullResult.message}`);
        
        if (fullResult.executed) {
            console.log(`  • Despesas duplicadas: ${fullResult.totalDuplicated}`);
            console.log(`  • Usuários processados: ${fullResult.totalUsers}`);
            console.log(`  • Erros: ${fullResult.totalErrors}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

// Executar teste
testMonthlyDuplication();
