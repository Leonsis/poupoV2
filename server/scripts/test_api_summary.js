const axios = require('axios');

async function testApiSummary() {
    try {
        console.log('🧪 Testando API de resumo via HTTP...');
        
        // Primeiro fazer login para obter token
        console.log('\n🔐 Fazendo login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'caiolenni@gmail.com',
            password: '123456'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');
        
        // Configurar headers com token
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Testar resumo do mês atual
        console.log('\n📊 Testando resumo do mês atual...');
        const currentMonthResponse = await axios.get('http://localhost:5000/api/financial/summary?period=month', { headers });
        
        if (currentMonthResponse.data.success) {
            const summary = currentMonthResponse.data.summary;
            console.log('✅ Resumo do mês atual:');
            console.log(`  - Receitas: R$ ${summary.totalIncome}`);
            console.log(`  - Despesas: R$ ${summary.totalExpenses}`);
            console.log(`  - Despesas Fixas: R$ ${summary.totalFixedExpenses}`);
            console.log(`  - Cartão de Crédito: R$ ${summary.totalCreditCardExpenses}`);
            console.log(`  - Saldo: R$ ${summary.balance}`);
            console.log(`  - Período: ${summary.startDate} a ${summary.endDate}`);
            
            console.log('\n📋 Detalhes das despesas fixas:');
            if (summary.fixedExpensesDetails && summary.fixedExpensesDetails.length > 0) {
                summary.fixedExpensesDetails.forEach((expense, index) => {
                    console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} - Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
                });
            } else {
                console.log('  ❌ Nenhuma despesa fixa encontrada nos detalhes');
            }
            
            console.log('\n🏦 Contas bancárias:');
            if (summary.bankAccounts && summary.bankAccounts.length > 0) {
                summary.bankAccounts.forEach((account, index) => {
                    console.log(`  ${index + 1}. ${account.account_name} - R$ ${account.balance}`);
                });
            } else {
                console.log('  ❌ Nenhuma conta bancária encontrada');
            }
            
        } else {
            console.log('❌ Erro ao obter resumo do mês atual:', currentMonthResponse.data.message);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    } finally {
        process.exit(0);
    }
}

testApiSummary();
