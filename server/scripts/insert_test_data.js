const db = require('../config/database');
const bcrypt = require('bcrypt');

async function insertTestData() {
    try {
        console.log('🔄 Inserindo dados de teste...');
        
        // Verificar se o usuário de teste já existe
        let existingUser = await db.get('SELECT id FROM users WHERE email = ?', ['teste@teste.com']);
        let userId;
        
        if (existingUser) {
            userId = existingUser.id;
            console.log(`✅ Usuário de teste já existe com ID: ${userId}`);
        } else {
            // Criar usuário de teste
            const hashedPassword = await bcrypt.hash('123456', 10);
            const userResult = await db.run(
                'INSERT INTO users (name, email, password_hash, birth_date, phone, gross_salary) VALUES (?, ?, ?, ?, ?, ?)',
                ['Usuário Teste', 'teste@teste.com', hashedPassword, '1990-01-01', '(11) 99999-9999', 5000.00]
            );
            
            userId = userResult.id;
            console.log(`✅ Usuário criado com ID: ${userId}`);
        }
        
        // Criar contas bancárias de teste
        const bankAccounts = [
            {
                name: 'Conta Corrente',
                type: 'corrente',
                category: 'debito',
                balance: 1000.00,
                credit_limit: 0
            },
            {
                name: 'Cartão de Crédito',
                type: 'credito',
                category: 'credito',
                balance: 0,
                credit_limit: 3000.00,
                due_date: '10'
            },
            {
                name: 'Poupança',
                type: 'poupanca',
                category: 'debito',
                balance: 5000.00,
                credit_limit: 0
            }
        ];
        
        for (const account of bankAccounts) {
            const accountResult = await db.run(
                'INSERT INTO bank_accounts (user_id, account_name, account_type, account_category, balance, credit_limit, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, account.name, account.type, account.category, account.balance, account.credit_limit, account.due_date]
            );
            console.log(`✅ Conta bancária criada: ${account.name} (ID: ${accountResult.id})`);
        }
        
        // Criar algumas receitas de teste
        const incomes = [
            {
                amount: 5000.00,
                source: 'Salário',
                income_date: new Date().toISOString().split('T')[0],
                description: 'Salário mensal',
                bank_account_id: 1
            },
            {
                amount: 500.00,
                source: 'Freelance',
                income_date: new Date().toISOString().split('T')[0],
                description: 'Trabalho extra',
                bank_account_id: 1
            }
        ];
        
        for (const income of incomes) {
            const incomeResult = await db.run(
                'INSERT INTO income (user_id, amount, source, income_date, description, bank_account_id) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, income.amount, income.source, income.income_date, income.description, income.bank_account_id]
            );
            console.log(`✅ Receita criada: ${income.source} - R$ ${income.amount}`);
        }
        
        // Criar algumas despesas fixas de teste
        const fixedExpenses = [
            {
                description: 'Aluguel',
                amount: 1200.00,
                due_date: '5',
                category: 'Moradia',
                bank_account_id: 1
            },
            {
                description: 'Conta de Luz',
                amount: 150.00,
                due_date: '15',
                category: 'Contas',
                bank_account_id: 1
            },
            {
                description: 'Internet',
                amount: 89.90,
                due_date: '20',
                category: 'Contas',
                bank_account_id: 1
            }
        ];
        
        for (const expense of fixedExpenses) {
            const expenseResult = await db.run(
                'INSERT INTO fixed_expenses (user_id, description, amount, due_date, category, bank_account_id) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, expense.description, expense.amount, expense.due_date, expense.category, expense.bank_account_id]
            );
            console.log(`✅ Despesa fixa criada: ${expense.description} - R$ ${expense.amount}`);
        }
        
        // Criar algumas despesas variáveis de teste
        const expenses = [
            {
                amount: 200.00,
                description: 'Supermercado',
                category: 'Alimentação',
                payment_method: 'debito',
                expense_date: new Date().toISOString().split('T')[0],
                bank_account_id: 1
            },
            {
                amount: 150.00,
                description: 'Combustível',
                category: 'Transporte',
                payment_method: 'debito',
                expense_date: new Date().toISOString().split('T')[0],
                bank_account_id: 1
            }
        ];
        
        for (const expense of expenses) {
            const expenseResult = await db.run(
                'INSERT INTO expenses (user_id, amount, description, category, payment_method, expense_date, bank_account_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, expense.amount, expense.description, expense.category, expense.payment_method, expense.expense_date, expense.bank_account_id]
            );
            console.log(`✅ Despesa criada: ${expense.description} - R$ ${expense.amount}`);
        }
        
        console.log('✅ Dados de teste inseridos com sucesso!');
        console.log('📝 Credenciais de teste:');
        console.log('   Email: teste@teste.com');
        console.log('   Senha: 123456');
        console.log('   Usuário ID: ' + userId);
        
    } catch (error) {
        console.error('❌ Erro ao inserir dados de teste:', error);
    } finally {
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    insertTestData();
}

module.exports = { insertTestData };
