const axios = require('axios');

async function testFixedExpensesApi() {
    try {
        console.log('🧪 Testando API de despesas fixas...');
        
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
        
        // Testar busca de despesas fixas
        console.log('\n📋 Testando busca de despesas fixas...');
        const fixedExpensesResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses', { headers });
        
        if (fixedExpensesResponse.data.success) {
            const expenses = fixedExpensesResponse.data.fixed_expenses;
            console.log('✅ Despesas fixas encontradas:');
            console.log(`  - Total: ${expenses.length}`);
            
            expenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description}`);
                console.log(`     Valor: R$ ${expense.amount}`);
                console.log(`     Vencimento: Dia ${expense.due_date}`);
                console.log(`     Paga: ${expense.is_paid ? 'Sim' : 'Não'}`);
                console.log(`     Vencida: ${expense.is_overdue ? 'Sim' : 'Não'}`);
                console.log(`     Categoria: ${expense.category || 'Não especificada'}`);
                console.log(`     Conta: ${expense.account_name || 'Não especificada'}`);
                console.log('');
            });
        } else {
            console.log('❌ Erro ao buscar despesas fixas:', fixedExpensesResponse.data.message);
        }
        
        // Testar busca de despesas fixas com transição
        console.log('\n🔄 Testando busca de despesas fixas com transição...');
        const withTransitionResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses/with-transition', { headers });
        
        if (withTransitionResponse.data.success) {
            const expenses = withTransitionResponse.data.expenses;
            console.log('✅ Despesas fixas com transição encontradas:');
            console.log(`  - Total: ${expenses.length}`);
        } else {
            console.log('❌ Erro ao buscar despesas fixas com transição:', withTransitionResponse.data.message);
        }
        
        // Testar contagem de despesas vencidas
        console.log('\n⏰ Testando contagem de despesas vencidas...');
        const overdueCountResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses/overdue-count', { headers });
        
        if (overdueCountResponse.data.success) {
            const count = overdueCountResponse.data.count;
            console.log('✅ Contagem de despesas vencidas:');
            console.log(`  - Total vencidas: ${count}`);
        } else {
            console.log('❌ Erro ao contar despesas vencidas:', overdueCountResponse.data.message);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    } finally {
        process.exit(0);
    }
}

testFixedExpensesApi();
