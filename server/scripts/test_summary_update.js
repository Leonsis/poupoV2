const db = require('../config/database');

async function testSummaryUpdate() {
    try {
        console.log('🔍 Testando atualização de dados de resumo...\n');

        // Verificar dados atuais
        console.log('📊 Dados atuais no banco:');
        
        // Usuários
        const users = await db.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 3');
        console.log(`  - Usuários: ${users.length}`);
        users.forEach(user => {
            console.log(`    * ${user.name} (${user.email}) - Criado: ${user.created_at}`);
        });

        // Contas bancárias
        const accounts = await db.query('SELECT id, account_name, balance, account_category FROM bank_accounts ORDER BY created_at DESC LIMIT 5');
        console.log(`  - Contas bancárias: ${accounts.length}`);
        accounts.forEach(acc => {
            console.log(`    * ${acc.account_name} (${acc.account_category}): R$ ${acc.balance}`);
        });

        // Receitas
        const income = await db.query('SELECT id, amount, description, income_date FROM income ORDER BY created_at DESC LIMIT 5');
        console.log(`  - Receitas: ${income.length}`);
        income.forEach(inc => {
            console.log(`    * ${inc.description}: R$ ${inc.amount} (${inc.income_date})`);
        });

        // Despesas
        const expenses = await db.query('SELECT id, amount, description, expense_date FROM expenses ORDER BY created_at DESC LIMIT 5');
        console.log(`  - Despesas: ${expenses.length}`);
        expenses.forEach(exp => {
            console.log(`    * ${exp.description}: R$ ${exp.amount} (${exp.expense_date})`);
        });

        // Despesas fixas
        const fixedExpenses = await db.query('SELECT id, description, amount, due_date, is_paid FROM fixed_expenses ORDER BY created_at DESC LIMIT 5');
        console.log(`  - Despesas fixas: ${fixedExpenses.length}`);
        fixedExpenses.forEach(fexp => {
            console.log(`    * ${fexp.description}: R$ ${fexp.amount} (Venc: ${fexp.due_date}, Pago: ${fexp.is_paid ? 'Sim' : 'Não'})`);
        });

        // Calcular totais
        console.log('\n🧮 Calculando totais:');
        
        const totalIncome = income.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const totalFixedExpenses = fixedExpenses.reduce((sum, fexp) => sum + parseFloat(fexp.amount || 0), 0);
        const totalFixedExpensesPaid = fixedExpenses
            .filter(fexp => fexp.is_paid)
            .reduce((sum, fexp) => sum + parseFloat(fexp.amount || 0), 0);
        
        console.log(`  - Total de receitas: R$ ${totalIncome.toFixed(2)}`);
        console.log(`  - Total de despesas variáveis: R$ ${totalExpenses.toFixed(2)}`);
        console.log(`  - Total de despesas fixas: R$ ${totalFixedExpenses.toFixed(2)}`);
        console.log(`  - Total de despesas fixas pagas: R$ ${totalFixedExpensesPaid.toFixed(2)}`);
        
        // Calcular saldo
        const balance = totalIncome - totalExpenses - totalFixedExpensesPaid;
        console.log(`  - Saldo calculado: R$ ${balance.toFixed(2)}`);

        // Verificar se há resumos mensais
        console.log('\n📋 Resumos mensais armazenados:');
        const monthlySummaries = await db.query('SELECT month_year, total_income, total_expenses, total_fixed_expenses, balance, created_at FROM monthly_summaries ORDER BY month_year DESC LIMIT 5');
        console.log(`  - Resumos encontrados: ${monthlySummaries.length}`);
        monthlySummaries.forEach(summary => {
            console.log(`    * ${summary.month_year}: R$ ${summary.balance} (Receitas: R$ ${summary.total_income}, Despesas: R$ ${summary.total_expenses})`);
        });

        // Testar API de resumo
        console.log('\n🌐 Testando API de resumo:');
        console.log('  - Para testar a API, execute:');
        console.log('    curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:5000/financial/summary?period=month');
        console.log('  - Ou acesse o frontend e verifique se os dados são atualizados');

        // Verificar se há problemas de atualização
        console.log('\n🔍 Possíveis problemas de atualização:');
        
        if (monthlySummaries.length === 0) {
            console.log('  ⚠️  Nenhum resumo mensal encontrado - pode ser que não estejam sendo gerados');
        }
        
        if (totalIncome === 0 && totalExpenses === 0) {
            console.log('  ⚠️  Nenhuma transação encontrada - verificar se os dados estão sendo inseridos');
        }
        
        if (Math.abs(balance) > 1000000) {
            console.log('  ⚠️  Saldo muito alto - verificar se há erro nos cálculos');
        }

        console.log('\n✅ Teste concluído!');

    } catch (error) {
        console.error('❌ Erro ao testar atualização:', error);
    } finally {
        process.exit(0);
    }
}

testSummaryUpdate();
