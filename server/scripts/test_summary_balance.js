const axios = require('axios');

async function testSummaryBalance() {
    try {
        console.log('🧪 Testando cálculo do saldo na API...');
        
        // Simular login para obter token
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'caiolenni@gmail.com',
            password: '123456'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Falha no login:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');
        
        // Testar a rota de summary
        const summaryResponse = await axios.get('http://localhost:5000/api/financial/summary?period=month&custom_date=2025-09', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (summaryResponse.data.success) {
            const summary = summaryResponse.data.summary;
            
            console.log('\n📊 Resumo da API:');
            console.log(`  - Receitas: R$ ${summary.totalIncome}`);
            console.log(`  - Despesas variáveis: R$ ${summary.totalExpenses}`);
            console.log(`  - Despesas fixas (todas): R$ ${summary.totalFixedExpenses}`);
            console.log(`  - Saldo calculado: R$ ${summary.balance}`);
            
            // Verificar se o saldo está correto
            const expectedBalance = summary.totalIncome - summary.totalExpenses - summary.totalFixedExpenses;
            console.log(`\n🧮 Verificação:`);
            console.log(`  - Saldo esperado (antigo): R$ ${expectedBalance.toFixed(2)}`);
            console.log(`  - Saldo atual da API: R$ ${summary.balance}`);
            
            if (summary.balance === expectedBalance) {
                console.log('  ❌ O saldo ainda está usando a lógica antiga (todas as despesas fixas)');
            } else {
                console.log('  ✅ O saldo foi corrigido! Agora usa apenas despesas fixas não pagas');
            }
            
            // Mostrar detalhes das despesas fixas
            if (summary.fixedExpensesDetails && summary.fixedExpensesDetails.length > 0) {
                console.log('\n📋 Detalhes das despesas fixas:');
                summary.fixedExpensesDetails.forEach(expense => {
                    console.log(`  - ${expense.description}: R$ ${expense.amount} (Paga: ${expense.is_paid ? 'Sim' : 'Não'})`);
                });
            }
            
        } else {
            console.log('❌ Erro ao obter resumo:', summaryResponse.data.message);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        process.exit(0);
    }
}

testSummaryBalance();
