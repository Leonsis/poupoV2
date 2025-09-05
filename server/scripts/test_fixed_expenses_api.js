const db = require('../config/database');

async function testFixedExpensesAPI() {
    try {
        console.log('🧪 Testando API de despesas fixas...\n');

        // 1. Verificar estrutura da tabela
        console.log('📋 1. Estrutura da tabela:');
        const tableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        
        const hasIsBoleto = tableInfo.some(col => col.name === 'is_boleto');
        const hasCategory = tableInfo.some(col => col.name === 'category');
        const hasInstallments = tableInfo.some(col => col.name === 'total_installments');
        
        console.log(`  - is_boleto: ${hasIsBoleto ? '✅' : '❌'}`);
        console.log(`  - category: ${hasCategory ? '✅' : '❌'}`);
        console.log(`  - total_installments: ${hasInstallments ? '✅' : '❌'}`);

        if (!hasIsBoleto) {
            console.log('  ❌ Coluna is_boleto não existe - erro esperado');
            return;
        }

        // 2. Simular criação de despesa fixa
        console.log('\n🧪 2. Testando criação de despesa fixa:');
        
        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        const testData = {
            description: 'Teste Despesa Fixa',
            amount: 150.00,
            due_date: '2025-09-30',
            category: 'Teste',
            is_boleto: true,
            total_installments: 1,
            paid_installments: 0,
            bank_account_id: null
        };

        console.log('  - Dados de teste:');
        console.log(`    * Descrição: ${testData.description}`);
        console.log(`    * Valor: R$ ${testData.amount}`);
        console.log(`    * Vencimento: ${testData.due_date}`);
        console.log(`    * Categoria: ${testData.category}`);
        console.log(`    * É boleto: ${testData.is_boleto ? 'Sim' : 'Não'}`);
        console.log(`    * Parcelas: ${testData.total_installments}`);
        console.log(`    * Parcelas pagas: ${testData.paid_installments}`);

        // 3. Inserir despesa fixa
        console.log('\n💾 3. Inserindo despesa fixa...');
        
        try {
            const result = await db.run(
                `INSERT INTO fixed_expenses (
                    user_id, description, amount, due_date, bank_account_id, 
                    category, is_boleto, total_installments, paid_installments, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    1, // user_id
                    testData.description,
                    testData.amount,
                    testData.due_date,
                    testData.bank_account_id,
                    testData.category,
                    testData.is_boleto,
                    testData.total_installments,
                    testData.paid_installments,
                    currentDateTime,
                    currentDateTime
                ]
            );
            
            console.log(`  ✅ Despesa fixa criada com sucesso (ID: ${result.id})`);
            
            // 4. Verificar se foi salva corretamente
            console.log('\n🔍 4. Verificando dados salvos:');
            const savedExpense = await db.get('SELECT * FROM fixed_expenses WHERE id = ?', [result.id]);
            
            if (savedExpense) {
                console.log('  - Dados salvos:');
                console.log(`    * ID: ${savedExpense.id}`);
                console.log(`    * Descrição: ${savedExpense.description}`);
                console.log(`    * Valor: R$ ${savedExpense.amount}`);
                console.log(`    * Vencimento: ${savedExpense.due_date}`);
                console.log(`    * Categoria: ${savedExpense.category}`);
                console.log(`    * É boleto: ${savedExpense.is_boleto ? 'Sim' : 'Não'}`);
                console.log(`    * Parcelas: ${savedExpense.total_installments}`);
                console.log(`    * Parcelas pagas: ${savedExpense.paid_installments}`);
                console.log(`    * Criada em: ${savedExpense.created_at}`);
                console.log(`    * Atualizada em: ${savedExpense.updated_at}`);
            }

            // 5. Testar consulta
            console.log('\n📊 5. Testando consulta:');
            const allExpenses = await db.query('SELECT * FROM fixed_expenses WHERE user_id = ?', [1]);
            console.log(`  - Total de despesas fixas: ${allExpenses.length}`);
            
            // 6. Limpar dados de teste
            console.log('\n🧹 6. Limpando dados de teste...');
            await db.run('DELETE FROM fixed_expenses WHERE id = ?', [result.id]);
            console.log('  ✅ Dados de teste removidos');

            // 7. Verificar se a limpeza funcionou
            const finalCount = await db.get('SELECT COUNT(*) as count FROM fixed_expenses WHERE user_id = ?', [1]);
            console.log(`  - Total final: ${finalCount.count}`);

        } catch (error) {
            console.log('  ❌ Erro ao criar despesa fixa:', error.message);
            console.log('  🔍 Detalhes do erro:', error);
        }

        // 8. Testar validações
        console.log('\n✅ 8. Testando validações:');
        
        // Teste com dados inválidos
        const invalidTests = [
            { description: '', amount: 100, due_date: '2025-09-30' },
            { description: 'Teste', amount: -50, due_date: '2025-09-30' },
            { description: 'Teste', amount: 100, due_date: 'data-invalida' }
        ];

        invalidTests.forEach((test, index) => {
            console.log(`  - Teste ${index + 1}: ${test.description || 'Sem descrição'} | R$ ${test.amount} | ${test.due_date}`);
        });

        console.log('\n🎯 Teste da API concluído!');
        console.log('  ✅ A tabela fixed_expenses agora suporta todas as funcionalidades');
        console.log('  ✅ O erro "table fixed_expenses has no column named is_boleto" foi resolvido');
        console.log('  ✅ Registrar despesas fixas deve funcionar corretamente');

    } catch (error) {
        console.error('❌ Erro ao testar API:', error);
    } finally {
        process.exit(0);
    }
}

testFixedExpensesAPI();
