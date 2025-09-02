const axios = require('axios');

async function testAPI() {
    try {
        console.log('🔍 Testando API diretamente...');
        
        // Primeiro, fazer login para obter o token
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'caiolenni@gmail.com',
            password: '123456'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Token obtido:', token ? 'Sim' : 'Não');
        
        // Testar a rota de despesas fixas
        const fixedExpensesResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses/with-transition', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📋 Resposta da API de despesas fixas:');
        console.log('Status:', fixedExpensesResponse.status);
        console.log('Success:', fixedExpensesResponse.data.success);
        console.log('Expenses count:', fixedExpensesResponse.data.expenses?.length || 0);
        
        if (fixedExpensesResponse.data.expenses) {
            fixedExpensesResponse.data.expenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.description} - R$ ${expense.amount} - Status: ${expense.status}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar API:', error.response?.data || error.message);
    } finally {
        process.exit(0);
    }
}

testAPI();
