const db = require('../config/database');

async function checkFixedExpensesStructure() {
    try {
        console.log('🔍 Verificando estrutura da tabela fixed_expenses...\n');

        // 1. Verificar se a tabela existe
        console.log('📋 1. Verificando existência da tabela:');
        const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='fixed_expenses'");
        
        if (tableExists) {
            console.log('  ✅ Tabela fixed_expenses existe');
        } else {
            console.log('  ❌ Tabela fixed_expenses não existe');
            return;
        }

        // 2. Verificar estrutura atual da tabela
        console.log('\n🏗️  2. Estrutura atual da tabela:');
        const tableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        
        console.log('  Colunas encontradas:');
        tableInfo.forEach(column => {
            console.log(`    - ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
        });

        // 3. Verificar se as colunas de boleto existem
        console.log('\n🎫 3. Verificação das colunas de boleto:');
        
        const hasIsBoleto = tableInfo.some(col => col.name === 'is_boleto');
        const hasTotalInstallments = tableInfo.some(col => col.name === 'total_installments');
        const hasPaidInstallments = tableInfo.some(col => col.name === 'paid_installments');
        
        console.log(`  - is_boleto: ${hasIsBoleto ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - total_installments: ${hasTotalInstallments ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - paid_installments: ${hasPaidInstallments ? '✅ Existe' : '❌ Não existe'}`);

        // 4. Verificar se há dados na tabela
        console.log('\n📊 4. Dados na tabela:');
        const rowCount = await db.get('SELECT COUNT(*) as count FROM fixed_expenses');
        console.log(`  - Total de registros: ${rowCount.count}`);

        if (rowCount.count > 0) {
            const sampleData = await db.query('SELECT * FROM fixed_expenses LIMIT 3');
            console.log('  - Amostra de dados:');
            sampleData.forEach((row, index) => {
                console.log(`    ${index + 1}. ID: ${row.id}, Descrição: ${row.description}, Valor: R$ ${row.amount}`);
            });
        }

        // 5. Verificar se a migração foi executada
        console.log('\n🔧 5. Status da migração:');
        
        if (hasIsBoleto && hasTotalInstallments && hasPaidInstallments) {
            console.log('  ✅ Migração add_boleto_and_installments_to_fixed_expenses foi executada');
        } else {
            console.log('  ❌ Migração add_boleto_and_installments_to_fixed_expenses NÃO foi executada');
            console.log('  🔧 É necessário executar a migração');
        }

        // 6. Verificar se há outras migrações pendentes
        console.log('\n📋 6. Outras migrações relacionadas:');
        
        const hasCategory = tableInfo.some(col => col.name === 'category');
        const hasMonthlyTransition = tableInfo.some(col => col.name === 'monthly_transition');
        
        console.log(`  - category: ${hasCategory ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - monthly_transition: ${hasMonthlyTransition ? '✅ Existe' : '❌ Não existe'}`);

        // 7. Recomendações
        console.log('\n💡 7. Recomendações:');
        
        if (!hasIsBoleto) {
            console.log('  🔧 Executar migração: add_boleto_and_installments_to_fixed_expenses.sql');
            console.log('  📝 Comandos SQL necessários:');
            console.log('    ALTER TABLE fixed_expenses ADD COLUMN is_boleto BOOLEAN DEFAULT 0;');
            console.log('    ALTER TABLE fixed_expenses ADD COLUMN total_installments INTEGER;');
            console.log('    ALTER TABLE fixed_expenses ADD COLUMN paid_installments INTEGER DEFAULT 0;');
        }
        
        if (!hasCategory) {
            console.log('  🔧 Executar migração: add_category_to_fixed_expenses.sql');
        }
        
        if (!hasMonthlyTransition) {
            console.log('  🔧 Executar migração: add_monthly_transition_to_fixed_expenses.sql');
        }

        console.log('\n🎯 Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error);
    } finally {
        process.exit(0);
    }
}

checkFixedExpensesStructure();
