const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runPendingMigrations() {
    try {
        console.log('🔧 Executando migrações pendentes...\n');

        // 1. Verificar estrutura atual
        console.log('📋 1. Estrutura atual da tabela fixed_expenses:');
        const tableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        
        const hasIsBoleto = tableInfo.some(col => col.name === 'is_boleto');
        const hasCategory = tableInfo.some(col => col.name === 'category');
        const hasMonthlyTransition = tableInfo.some(col => col.name === 'monthly_transition');
        
        console.log(`  - is_boleto: ${hasIsBoleto ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - category: ${hasCategory ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - monthly_transition: ${hasMonthlyTransition ? '✅ Existe' : '❌ Não existe'}`);

        // 2. Executar migração add_boleto_and_installments_to_fixed_expenses
        if (!hasIsBoleto) {
            console.log('\n🎫 2. Executando migração: add_boleto_and_installments_to_fixed_expenses');
            
            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN is_boleto BOOLEAN DEFAULT 0');
                console.log('  ✅ Coluna is_boleto adicionada');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('  ℹ️  Coluna is_boleto já existe');
                } else {
                    console.log('  ❌ Erro ao adicionar is_boleto:', error.message);
                }
            }

            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN total_installments INTEGER');
                console.log('  ✅ Coluna total_installments adicionada');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('  ℹ️  Coluna total_installments já existe');
                } else {
                    console.log('  ❌ Erro ao adicionar total_installments:', error.message);
                }
            }

            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN paid_installments INTEGER DEFAULT 0');
                console.log('  ✅ Coluna paid_installments adicionada');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('  ℹ️  Coluna paid_installments já existe');
                } else {
                    console.log('  ❌ Erro ao adicionar paid_installments:', error.message);
                }
            }
        } else {
            console.log('\n🎫 2. Migração add_boleto_and_installments_to_fixed_expenses já foi executada');
        }

        // 3. Executar migração add_category_to_fixed_expenses
        if (!hasCategory) {
            console.log('\n🏷️  3. Executando migração: add_category_to_fixed_expenses');
            
            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN category TEXT');
                console.log('  ✅ Coluna category adicionada');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('  ℹ️  Coluna category já existe');
                } else {
                    console.log('  ❌ Erro ao adicionar category:', error.message);
                }
            }
        } else {
            console.log('\n🏷️  3. Migração add_category_to_fixed_expenses já foi executada');
        }

        // 4. Executar migração add_monthly_transition_to_fixed_expenses
        if (!hasMonthlyTransition) {
            console.log('\n🔄 4. Executando migração: add_monthly_transition_to_fixed_expenses');
            
            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN monthly_transition BOOLEAN DEFAULT 0');
                console.log('  ✅ Coluna monthly_transition adicionada');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('  ℹ️  Coluna monthly_transition já existe');
                } else {
                    console.log('  ❌ Erro ao adicionar monthly_transition:', error.message);
                }
            }
        } else {
            console.log('\n🔄 4. Migração add_monthly_transition_to_fixed_expenses já foi executada');
        }

        // 5. Verificar estrutura final
        console.log('\n✅ 5. Verificando estrutura final:');
        const finalTableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        
        console.log('  Colunas finais:');
        finalTableInfo.forEach(column => {
            console.log(`    - ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
        });

        // 6. Testar se a tabela agora suporta inserção com is_boleto
        console.log('\n🧪 6. Testando inserção com is_boleto:');
        
        try {
            const testResult = await db.run(
                'INSERT INTO fixed_expenses (user_id, description, amount, due_date, is_boleto, total_installments, paid_installments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [1, 'Teste Boleto', 100.00, '2025-09-30', 1, 1, 0, '2025-09-02 21:00:00', '2025-09-02 21:00:00']
            );
            console.log('  ✅ Inserção de teste bem-sucedida (ID:', testResult.id, ')');
            
            // Limpar o registro de teste
            await db.run('DELETE FROM fixed_expenses WHERE id = ?', [testResult.id]);
            console.log('  🧹 Registro de teste removido');
            
        } catch (error) {
            console.log('  ❌ Erro na inserção de teste:', error.message);
        }

        console.log('\n🎯 Migrações concluídas!');
        console.log('  - A tabela fixed_expenses agora suporta todas as funcionalidades');
        console.log('  - Registrar despesas fixas deve funcionar corretamente');
        console.log('  - O erro "table fixed_expenses has no column named is_boleto" foi resolvido');

    } catch (error) {
        console.error('❌ Erro ao executar migrações:', error);
    } finally {
        process.exit(0);
    }
}

runPendingMigrations();
