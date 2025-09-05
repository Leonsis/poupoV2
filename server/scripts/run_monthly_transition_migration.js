const db = require('../config/database');

async function runMonthlyTransitionMigration() {
    try {
        console.log('🔧 Executando migração de transição mensal...\n');

        // 1. Verificar estrutura atual
        console.log('📋 1. Estrutura atual da tabela fixed_expenses:');
        const tableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        
        const hasMonthYear = tableInfo.some(col => col.name === 'month_year');
        const hasIsOverdue = tableInfo.some(col => col.name === 'is_overdue');
        const hasOriginalExpenseId = tableInfo.some(col => col.name === 'original_expense_id');
        const hasPaymentDate = tableInfo.some(col => col.name === 'payment_date');
        
        console.log(`  - month_year: ${hasMonthYear ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - is_overdue: ${hasIsOverdue ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - original_expense_id: ${hasOriginalExpenseId ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`  - payment_date: ${hasPaymentDate ? '✅ Existe' : '❌ Não existe'}`);

        // 2. Executar migrações pendentes
        if (!hasIsOverdue) {
            console.log('\n⏰ 2. Adicionando coluna is_overdue...');
            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN is_overdue BOOLEAN DEFAULT 0');
                console.log('  ✅ Coluna is_overdue adicionada');
            } catch (error) {
                console.log('  ℹ️  Coluna is_overdue já existe ou erro:', error.message);
            }
        }

        if (!hasOriginalExpenseId) {
            console.log('\n🔄 3. Adicionando coluna original_expense_id...');
            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN original_expense_id INTEGER');
                console.log('  ✅ Coluna original_expense_id adicionada');
            } catch (error) {
                console.log('  ℹ️  Coluna original_expense_id já existe ou erro:', error.message);
            }
        }

        if (!hasMonthYear) {
            console.log('\n📅 4. Adicionando coluna month_year...');
            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN month_year TEXT');
                console.log('  ✅ Coluna month_year adicionada');
            } catch (error) {
                console.log('  ℹ️  Coluna month_year já existe ou erro:', error.message);
            }
        }

        if (!hasPaymentDate) {
            console.log('\n💳 5. Adicionando coluna payment_date...');
            try {
                await db.run('ALTER TABLE fixed_expenses ADD COLUMN payment_date DATE');
                console.log('  ✅ Coluna payment_date adicionada');
            } catch (error) {
                console.log('  ℹ️  Coluna payment_date já existe ou erro:', error.message);
            }
        }

        // 3. Verificar estrutura final
        console.log('\n✅ 6. Verificando estrutura final:');
        const finalTableInfo = await db.query("PRAGMA table_info(fixed_expenses)");
        
        console.log('  Colunas finais:');
        finalTableInfo.forEach(column => {
            console.log(`    - ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
        });

        // 4. Testar se a API agora funciona
        console.log('\n🧪 7. Testando se a API agora funciona...');
        
        const userId = 1;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        try {
            const testQuery = await db.query(`
                SELECT 
                    fe.*,
                    ba.account_name
                FROM fixed_expenses fe
                LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
                WHERE fe.user_id = ?
                AND (fe.month_year IS NULL OR fe.month_year = 'null' OR fe.month_year = ?)
                ORDER BY fe.due_date ASC
            `, [userId, currentMonthYear]);
            
            console.log(`  ✅ API funcionando: ${testQuery.length} despesas retornadas`);
            
            if (testQuery.length > 0) {
                testQuery.forEach((expense, index) => {
                    console.log(`    ${index + 1}. ${expense.description} - R$ ${expense.amount}`);
                });
            }
            
        } catch (error) {
            console.log('  ❌ API ainda com erro:', error.message);
        }

        // 5. Atualizar despesas existentes
        console.log('\n🔧 8. Atualizando despesas existentes...');
        
        try {
            const updateResult = await db.run(`
                UPDATE fixed_expenses 
                SET month_year = NULL, 
                    is_overdue = 0, 
                    original_expense_id = NULL 
                WHERE month_year IS NULL 
                AND user_id = ?
            `, [userId]);
            
            console.log(`  ✅ ${updateResult.changes} despesas atualizadas`);
            
        } catch (error) {
            console.log('  ❌ Erro ao atualizar despesas:', error.message);
        }

        console.log('\n🎯 Migração concluída!');
        console.log('  - A tabela fixed_expenses agora suporta transição mensal');
        console.log('  - A API /fixed-expenses/with-transition deve funcionar');
        console.log('  - As despesas fixas devem aparecer no frontend');

    } catch (error) {
        console.error('❌ Erro ao executar migração:', error);
    } finally {
        process.exit(0);
    }
}

runMonthlyTransitionMigration();
