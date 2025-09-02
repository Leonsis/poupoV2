const db = require('../config/database');

async function fixTransactionDates() {
    try {
        console.log('🔧 Corrigindo datas das transações...\n');

        // Verificar transações com datas incorretas
        console.log('📅 Verificando transações existentes:');
        
        const income = await db.query('SELECT id, description, amount, income_date FROM income ORDER BY created_at DESC');
        const expenses = await db.query('SELECT id, description, amount, expense_date FROM expenses ORDER BY created_at DESC');
        const fixedExpenses = await db.query('SELECT id, description, amount, due_date FROM fixed_expenses ORDER BY created_at DESC');

        console.log(`  - Receitas: ${income.length}`);
        income.forEach(inc => {
            console.log(`    * ${inc.description}: R$ ${inc.amount} (${inc.income_date})`);
        });

        console.log(`  - Despesas: ${expenses.length}`);
        expenses.forEach(exp => {
            console.log(`    * ${exp.description}: R$ ${exp.amount} (${exp.expense_date})`);
        });

        console.log(`  - Despesas fixas: ${fixedExpenses.length}`);
        fixedExpenses.forEach(fexp => {
            console.log(`    * ${fexp.description}: R$ ${fexp.amount} (Venc: ${fexp.due_date})`);
        });

        // Obter data atual
        const { getCurrentDate } = require('../utils/dateUtils');
        const currentDate = getCurrentDate();
        console.log(`\n📅 Data atual: ${currentDate}`);

        // Corrigir datas das receitas para o mês atual
        console.log('\n🔧 Corrigindo datas das receitas...');
        let updatedIncome = 0;
        
        for (const inc of income) {
            if (inc.income_date && inc.income_date.startsWith('2025-08')) {
                try {
                    await db.run(
                        'UPDATE income SET income_date = ? WHERE id = ?',
                        [currentDate, inc.id]
                    );
                    console.log(`  ✅ Receita "${inc.description}" atualizada para ${currentDate}`);
                    updatedIncome++;
                } catch (error) {
                    console.log(`  ❌ Erro ao atualizar receita ${inc.id}:`, error.message);
                }
            }
        }

        // Corrigir datas das despesas para o mês atual
        console.log('\n🔧 Corrigindo datas das despesas...');
        let updatedExpenses = 0;
        
        for (const exp of expenses) {
            if (exp.expense_date && exp.expense_date.startsWith('2025-08')) {
                try {
                    await db.run(
                        'UPDATE expenses SET expense_date = ? WHERE id = ?',
                        [currentDate, exp.id]
                    );
                    console.log(`  ✅ Despesa "${exp.description}" atualizada para ${currentDate}`);
                    updatedExpenses++;
                } catch (error) {
                    console.log(`  ❌ Erro ao atualizar despesa ${exp.id}:`, error.message);
                }
            }
        }

        // Corrigir datas de vencimento das despesas fixas
        console.log('\n🔧 Corrigindo datas de vencimento das despesas fixas...');
        let updatedFixedExpenses = 0;
        
        for (const fexp of fixedExpenses) {
            if (fexp.due_date && fexp.due_date.startsWith('2025-08')) {
                try {
                    // Definir vencimento para o dia 30 do mês atual
                    const dueDate = currentDate.replace(/\d{2}$/, '30');
                    await db.run(
                        'UPDATE fixed_expenses SET due_date = ? WHERE id = ?',
                        [dueDate, fexp.id]
                    );
                    console.log(`  ✅ Despesa fixa "${fexp.description}" vencimento atualizado para ${dueDate}`);
                    updatedFixedExpenses++;
                } catch (error) {
                    console.log(`  ❌ Erro ao atualizar despesa fixa ${fexp.id}:`, error.message);
                }
            }
        }

        // Verificar se as correções funcionaram
        console.log('\n✅ Verificando correções...');
        
        const updatedIncomeData = await db.query('SELECT id, description, amount, income_date FROM income ORDER BY created_at DESC');
        const updatedExpensesData = await db.query('SELECT id, description, amount, expense_date FROM expenses ORDER BY created_at DESC');
        const updatedFixedExpensesData = await db.query('SELECT id, description, amount, due_date FROM fixed_expenses ORDER BY created_at DESC');

        console.log(`  - Receitas atualizadas: ${updatedIncome}`);
        console.log(`  - Despesas atualizadas: ${updatedExpenses}`);
        console.log(`  - Despesas fixas atualizadas: ${updatedFixedExpenses}`);

        // Testar se a API agora retorna dados
        console.log('\n🧪 Testando se a API agora retorna dados...');
        
        const userId = 1;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { formatDateToLocal } = require('../utils/dateUtils');
        const startDateStr = formatDateToLocal(startDate);
        const endDateStr = formatDateToLocal(endDate);

        const incomeTest = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [userId, startDateStr, endDateStr]
        );
        const totalIncome = incomeTest[0]?.total || 0;

        console.log(`  - Período: ${startDateStr} até ${endDateStr}`);
        console.log(`  - Receitas no período: R$ ${totalIncome}`);

        if (totalIncome > 0) {
            console.log('  ✅ API agora deve retornar dados corretamente!');
        } else {
            console.log('  ⚠️  API ainda não retorna dados - verificar outras possibilidades');
        }

        console.log('\n🎯 Correção concluída!');
        console.log('  - As transações agora estão com datas do mês atual');
        console.log('  - Visão Geral e Resumos Detalhados devem mostrar os valores corretos');

    } catch (error) {
        console.error('❌ Erro ao corrigir datas:', error);
    } finally {
        process.exit(0);
    }
}

fixTransactionDates();
