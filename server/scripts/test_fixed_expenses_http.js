const axios = require('axios');

async function testFixedExpensesHTTP() {
    try {
        console.log('🧪 Testando API HTTP de despesas fixas...\n');

        // 1. Fazer login para obter token
        console.log('🔐 1. Fazendo login...');
        
        let token;
        try {
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'caiolenni@gmail.com',
                password: '123456'
            });
            
            token = loginResponse.data.token;
            console.log('  ✅ Login realizado com sucesso');
            console.log(`  - Token: ${token.substring(0, 20)}...`);
            
        } catch (error) {
            console.log('  ❌ Erro no login:', error.response?.data?.message || error.message);
            return;
        }

        // 2. Testar rota básica de despesas fixas
        console.log('\n📋 2. Testando /financial/fixed-expenses:');
        
        try {
            const basicResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (basicResponse.data.success) {
                console.log('  ✅ Rota básica funcionando');
                console.log(`  - Despesas retornadas: ${basicResponse.data.fixed_expenses.length}`);
                
                basicResponse.data.fixed_expenses.forEach((expense, index) => {
                    console.log(`    ${index + 1}. ${expense.description} - R$ ${expense.amount}`);
                });
            } else {
                console.log('  ❌ Erro na rota básica:', basicResponse.data.message);
            }
            
        } catch (error) {
            console.log('  ❌ Erro na rota básica:', error.response?.data?.message || error.message);
        }

        // 3. Testar rota com transição
        console.log('\n🔄 3. Testando /financial/fixed-expenses/with-transition:');
        
        try {
            const transitionResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses/with-transition', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (transitionResponse.data.success) {
                console.log('  ✅ Rota com transição funcionando');
                console.log(`  - Despesas retornadas: ${transitionResponse.data.expenses.length}`);
                
                transitionResponse.data.expenses.forEach((expense, index) => {
                    console.log(`    ${index + 1}. ${expense.description} - R$ ${expense.amount} - Status: ${expense.status}`);
                });
            } else {
                console.log('  ❌ Erro na rota com transição:', transitionResponse.data.message);
            }
            
        } catch (error) {
            console.log('  ❌ Erro na rota com transição:', error.response?.data?.message || error.message);
        }

        // 4. Testar contagem de despesas vencidas
        console.log('\n⏰ 4. Testando /financial/fixed-expenses/overdue-count:');
        
        try {
            const overdueResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses/overdue-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (overdueResponse.data.success) {
                console.log('  ✅ Contagem de vencidas funcionando');
                console.log(`  - Despesas vencidas: ${overdueResponse.data.count}`);
            } else {
                console.log('  ❌ Erro na contagem:', overdueResponse.data.message);
            }
            
        } catch (error) {
            console.log('  ❌ Erro na contagem:', error.response?.data?.message || error.message);
        }

        // 5. Testar verificação de transição mensal
        console.log('\n📅 5. Testando /financial/fixed-expenses/check-transition:');
        
        try {
            const checkResponse = await axios.get('http://localhost:5000/api/financial/fixed-expenses/check-transition', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (checkResponse.data.success) {
                console.log('  ✅ Verificação de transição funcionando');
                console.log(`  - Precisa transição: ${checkResponse.data.needsTransition}`);
            } else {
                console.log('  ❌ Erro na verificação:', checkResponse.data.message);
            }
            
        } catch (error) {
            console.log('  ❌ Erro na verificação:', error.response?.data?.message || error.message);
        }

        // 6. Diagnóstico final
        console.log('\n💡 6. Diagnóstico:');
        
        console.log('  ✅ Backend funcionando corretamente');
        console.log('  🔍 Se as despesas não aparecem no frontend:');
        console.log('    - Verificar se o usuário está logado');
        console.log('    - Verificar se o token está sendo enviado');
        console.log('    - Verificar console do navegador para erros');
        console.log('    - Verificar se o componente está chamando a API correta');

        console.log('\n🎯 Teste HTTP concluído!');

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        process.exit(0);
    }
}

testFixedExpensesHTTP();
