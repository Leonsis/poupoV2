const db = require('../config/database');

async function testFixedExpensesAPIDirect() {
    try {
        console.log('🧪 Testando API de despesas fixas diretamente...\n');

        // 1. Verificar despesas no banco
        console.log('📊 1. Despesas fixas no banco:');
        const allExpenses = await db.query('SELECT * FROM fixed_expenses ORDER BY created_at DESC');
        console.log(`  - Total: ${allExpenses.length}`);
        
        if (allExpenses.length > 0) {
            allExpenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description}`);
                console.log(`     - ID: ${expense.id}`);
                console.log(`     - Usuário: ${expense.user_id}`);
                console.log(`     - Valor: R$ ${expense.amount}`);
                console.log(`     - Vencimento: Dia ${expense.due_date}`);
                console.log(`     - Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
                console.log(`     - Vencida: ${expense.is_overdue ? 'Sim' : 'Não'}`);
                console.log(`     - Month Year: ${expense.month_year || 'null'}`);
                console.log('');
            });
        }

        // 2. Simular a consulta da API com transição
        console.log('🌐 2. Simulando API /fixed-expenses/with-transition:');
        
        const userId = 1;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const currentDay = currentDate.getDate();
        const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        console.log(`  - Usuário ID: ${userId}`);
        console.log(`  - Data atual: ${currentDate.toLocaleDateString('pt-BR')} (dia ${currentDay})`);
        console.log(`  - Mês/Ano atual: ${currentMonthYear}`);
        
        // Consulta exata da API
        const query = `
            SELECT 
                fe.*,
                ba.account_name
            FROM fixed_expenses fe
            LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
            WHERE fe.user_id = ?
            AND (fe.month_year IS NULL OR fe.month_year = 'null' OR fe.month_year = ?)
            ORDER BY fe.due_date ASC
        `;
        
        const expenses = await db.query(query, [userId, currentMonthYear]);
        console.log(`  - Resultado da consulta: ${expenses.length} despesas`);
        
        if (expenses.length > 0) {
            expenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description}`);
                console.log(`     - Valor: R$ ${expense.amount}`);
                console.log(`     - Vencimento: Dia ${expense.due_date}`);
                console.log(`     - Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
                console.log(`     - Vencida: ${expense.is_overdue ? 'Sim' : 'Não'}`);
                console.log(`     - Month Year: ${expense.month_year || 'null'}`);
                console.log(`     - Conta: ${expense.account_name || 'Não especificada'}`);
                console.log('');
            });
        }

        // 3. Verificar se há problemas de filtro
        console.log('🔍 3. Verificando filtros da consulta:');
        
        // Verificar month_year
        const monthYearQuery = await db.query('SELECT month_year, COUNT(*) as count FROM fixed_expenses WHERE user_id = ? GROUP BY month_year', [userId]);
        console.log('  - Distribuição por month_year:');
        monthYearQuery.forEach(item => {
            console.log(`    * ${item.month_year || 'NULL'}: ${item.count} despesas`);
        });

        // Verificar is_overdue
        const overdueQuery = await db.query('SELECT is_overdue, COUNT(*) as count FROM fixed_expenses WHERE user_id = ? GROUP BY is_overdue', [userId]);
        console.log('  - Distribuição por is_overdue:');
        overdueQuery.forEach(item => {
            console.log(`    * ${item.is_overdue ? 'Sim' : 'Não'}: ${item.count} despesas`);
        });

        // 4. Testar consulta simples (sem filtros)
        console.log('\n📋 4. Testando consulta simples:');
        const simpleQuery = await db.query(
            'SELECT fe.*, ba.account_name FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.user_id = ? ORDER BY fe.due_date ASC',
            [userId]
        );
        console.log(`  - Consulta simples: ${simpleQuery.length} despesas`);

        // 5. Verificar se há problemas de JOIN
        console.log('\n🔗 5. Verificando JOIN:');
        const joinTest = await db.query(`
            SELECT 
                fe.id,
                fe.description,
                fe.user_id,
                ba.id as bank_account_id,
                ba.account_name
            FROM fixed_expenses fe
            LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
            WHERE fe.user_id = ?
        `, [userId]);
        
        console.log(`  - JOIN testado: ${joinTest.length} resultados`);
        joinTest.forEach(item => {
            console.log(`    * ${item.description}: Conta ${item.account_name || 'Nenhuma'} (ID: ${item.bank_account_id || 'Nenhum'})`);
        });

        // 6. Diagnóstico final
        console.log('\n💡 6. Diagnóstico:');
        
        if (expenses.length === 0 && allExpenses.length > 0) {
            console.log('  ❌ PROBLEMA IDENTIFICADO:');
            console.log('    - Despesas existem no banco');
            console.log('    - Mas filtro month_year está bloqueando');
            console.log('    - Possível solução: limpar month_year ou ajustar filtro');
        } else if (expenses.length > 0) {
            console.log('  ✅ API está funcionando corretamente');
            console.log('  🔍 O problema pode estar no frontend ou na autenticação');
        } else {
            console.log('  ❌ Nenhuma despesa encontrada');
            console.log('  🔧 Criar uma despesa para testar');
        }

        // 7. Sugestões de correção
        console.log('\n🔧 7. Sugestões de correção:');
        
        if (expenses.length === 0 && allExpenses.length > 0) {
            console.log('  - Verificar se month_year está correto');
            console.log('  - Verificar se is_overdue está correto');
            console.log('  - Possível problema no filtro da consulta');
        }

        console.log('\n🎯 Teste concluído!');

    } catch (error) {
        console.error('❌ Erro ao testar:', error);
    } finally {
        process.exit(0);
    }
}

testFixedExpensesAPIDirect();
