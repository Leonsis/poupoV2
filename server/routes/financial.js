const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();
router.use(auth); // Todas as rotas neste arquivo requerem autenticação

// Log detalhado para depuração
router.use((req, res, next) => {
    console.log(`Recebendo ${req.method} em ${req.originalUrl} - Usuário ID: ${req.user.userId}`);
    next();
});

// Listar contas bancárias
router.get('/bank-accounts', async (req, res) => {
    try {
        console.log('Listando contas bancárias para usuário:', req.user.userId);
        const accounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.userId]
        );

        console.log('Contas encontradas:', accounts);

        // Garantir que todas as contas tenham account_category
        const accountsWithCategory = accounts.map(account => ({
            ...account,
            account_category: account.account_category || 'debito'
        }));

        console.log('Contas com categoria:', accountsWithCategory);

        res.json({
            success: true,
            accounts: accountsWithCategory
        });
    } catch (error) {
        console.error('Erro ao listar contas bancárias:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Criar conta bancária
router.post('/bank-accounts', [
    body('account_name').notEmpty().withMessage('Nome da conta é obrigatório'),
    body('account_type').isIn(['corrente', 'poupanca', 'investimento']).withMessage('Tipo de conta inválido'),
    body('account_category').isIn(['debito', 'credito']).withMessage('Categoria de conta inválida'),
    body('balance').optional().isFloat({ min: 0 }).withMessage('Saldo deve ser um valor positivo'),
    body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Limite do cartão deve ser um valor positivo'),
    body('due_date').optional().isInt({ min: 1, max: 31 }).withMessage('Dia de vencimento deve estar entre 1 e 31')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { account_name, account_type, account_category, balance, credit_limit, due_date } = req.body;

        console.log('Criando conta bancária:', { account_name, account_type, account_category, balance, credit_limit, due_date });

        // Garantir que o saldo seja um número
        const numericBalance = balance !== undefined ? parseFloat(balance) || 0 : 0;
        const numericCreditLimit = credit_limit !== undefined ? parseFloat(credit_limit) || 0 : null;
        const numericDueDate = due_date !== undefined ? parseInt(due_date) || null : null;

        const result = await db.run(
            'INSERT INTO bank_accounts (user_id, account_name, account_type, account_category, balance, credit_limit, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, account_name, account_type, account_category, numericBalance, numericCreditLimit, numericDueDate]
        );

        console.log('Resultado da inserção:', result);
        console.log('Conta criada com ID:', result.id);

        const account = await db.get(
            'SELECT * FROM bank_accounts WHERE id = ?',
            [result.id]
        );

        // Garantir que a conta tenha account_category e balance
        const accountWithCategory = {
            ...account,
            account_category: account?.account_category || account_category || 'debito',
            balance: parseFloat(account?.balance) || numericBalance || 0,
            credit_limit: parseFloat(account?.credit_limit) || numericCreditLimit || 0,
            due_date: account?.due_date || numericDueDate
        };

        res.status(201).json({
            success: true,
            message: 'Conta bancária criada com sucesso',
            account: accountWithCategory
        });
    } catch (error) {
        console.error('Erro ao criar conta bancária:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Excluir conta bancária
router.delete('/bank-accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const accountId = parseInt(id, 10);
        
        console.log('Tentando excluir conta com ID:', accountId, 'Tipo:', typeof accountId);

        // Verificar se a conta existe e pertence ao usuário
        const account = await db.get(
            'SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?',
            [accountId, req.user.userId]
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Conta bancária não encontrada'
            });
        }

        // Verificar se há despesas fixas vinculadas a esta conta
        const fixedExpenses = await db.query(
            'SELECT COUNT(*) as count FROM fixed_expenses WHERE bank_account_id = ?',
            [accountId]
        );

        if (fixedExpenses[0]?.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir uma conta que possui despesas fixas vinculadas'
            });
        }

        // Excluir a conta
        await db.run(
            'DELETE FROM bank_accounts WHERE id = ? AND user_id = ?',
            [accountId, req.user.userId]
        );

        // Buscar contas restantes e calcular saldo líquido
        const accounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ?',
            [req.user.userId]
        );
        const net_balance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

        res.json({
            success: true,
            message: 'Conta bancária excluída com sucesso',
            accounts,
            net_balance
        });
    } catch (error) {
        console.error('Erro ao excluir conta bancária:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Atualizar conta bancária (nome, tipo, categoria)
router.put('/bank-accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { account_name, account_type, account_category, credit_limit, due_date } = req.body;
        console.log('Requisição para atualizar conta:', { id, account_name, account_type, account_category, credit_limit, due_date });

        // Verificar se a conta existe e pertence ao usuário
        const account = await db.get(
            'SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Conta bancária não encontrada'
            });
        }

        // Atualizar apenas os campos enviados
        const updates = [];
        const params = [];
        if (account_name !== undefined) {
            updates.push('account_name = ?');
            params.push(account_name);
        }
        if (account_type !== undefined) {
            updates.push('account_type = ?');
            params.push(account_type);
        }
        if (account_category !== undefined) {
            updates.push('account_category = ?');
            params.push(account_category);
        }
        if (credit_limit !== undefined) {
            updates.push('credit_limit = ?');
            params.push(credit_limit);
        }
        if (due_date !== undefined) {
            updates.push('due_date = ?');
            params.push(due_date);
        }
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }
        params.push(id, userId);
        const sql = `UPDATE bank_accounts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
        await db.run(sql, params);

        const updatedAccount = await db.get(
            'SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        res.json({
            success: true,
            message: 'Conta bancária atualizada com sucesso',
            account: updatedAccount
        });
    } catch (error) {
        console.error('Erro ao atualizar conta bancária:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Listar ganhos
router.get('/income', [
    query('start_date').optional().isISO8601().withMessage('Data inicial inválida'),
    query('end_date').optional().isISO8601().withMessage('Data final inválida')
], async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let sql = 'SELECT i.*, ba.account_name FROM income i LEFT JOIN bank_accounts ba ON i.bank_account_id = ba.id WHERE i.user_id = ?';
        let params = [req.user.userId];

        if (start_date && end_date) {
            sql += ' AND i.income_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        sql += ' ORDER BY i.income_date DESC';

        const income = await db.query(sql, params);

        res.json({
            success: true,
            income
        });
    } catch (error) {
        console.error('Erro ao listar ganhos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Registrar ganho
router.post('/income', [
    body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
    body('source').notEmpty().withMessage('Fonte do ganho é obrigatória'),
    body('income_date').isISO8601().withMessage('Data inválida'),
    body('description').optional().isLength({ max: 500 }).withMessage('Descrição muito longa'),
    body('bank_account_id').optional().isInt({ min: 1 }).withMessage('ID da conta bancária inválido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { amount, source, income_date, description, bank_account_id } = req.body;

        // Log detalhado para depuração
        console.log('Recebido para registrar ganho:', { amount, source, income_date, description, bank_account_id, userId: req.user.userId });

        // Garantir tipos corretos
        const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const parsedDate = income_date ? new Date(income_date).toISOString().split('T')[0] : null;
        const desc = typeof description === 'string' ? description : (description ? String(description) : '');
        let validBankAccountId = Number.isInteger(Number(bank_account_id)) && Number(bank_account_id) > 0 ? Number(bank_account_id) : null;
        if (bank_account_id === undefined || bank_account_id === '' || bank_account_id === null) {
            validBankAccountId = null;
        }

        // Inserir ganho, incluindo bank_account_id como null explicitamente se não houver conta
        let insertSql, insertParams;
        if (validBankAccountId !== null) {
            insertSql = 'INSERT INTO income (user_id, amount, source, income_date, description, bank_account_id) VALUES (?, ?, ?, ?, ?, ?)';
            insertParams = [req.user.userId, parsedAmount, source, parsedDate, desc, validBankAccountId];
        } else {
            insertSql = 'INSERT INTO income (user_id, amount, source, income_date, description, bank_account_id) VALUES (?, ?, ?, ?, ?, ?)';
            insertParams = [req.user.userId, parsedAmount, source, parsedDate, desc, null];
        }
        console.log('Comando SQL:', insertSql, insertParams);
        const result = await db.run(insertSql, insertParams);

        // Atualizar saldo da conta bancária se especificada e válida
        if (validBankAccountId) {
            console.log(`Atualizando saldo da conta ${validBankAccountId} com +${parsedAmount}`);
            await db.run(
                'UPDATE bank_accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                [parsedAmount, validBankAccountId, req.user.userId]
            );
            console.log('Saldo atualizado com sucesso');
        }

        const income = await db.get(
            'SELECT * FROM income WHERE id = ?',
            [result.id]
        );

        res.status(201).json({
            success: true,
            message: 'Ganho registrado com sucesso',
            income
        });
    } catch (error) {
        // Log detalhado do erro
        console.error('Erro ao registrar ganho:', error);
        if (error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        // Retornar mensagem real do erro para facilitar debug (remover em produção)
        res.status(500).json({
            success: false,
            message: error.message || 'Erro interno do servidor',
            error: error
        });
    }
});

// Excluir ganho
router.delete('/income/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // Verificar se o ganho existe e pertence ao usuário
        const income = await db.get('SELECT * FROM income WHERE id = ? AND user_id = ?', [id, userId]);
        if (!income) {
            return res.status(404).json({ success: false, message: 'Ganho não encontrado' });
        }
        // Excluir o ganho
        await db.run('DELETE FROM income WHERE id = ? AND user_id = ?', [id, userId]);
        // Se houver bank_account_id, atualizar saldo da conta
        if (income.bank_account_id) {
            await db.run('UPDATE bank_accounts SET balance = balance - ? WHERE id = ? AND user_id = ?', [income.amount, income.bank_account_id, userId]);
        }
        res.json({ success: true, message: 'Ganho excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir ganho:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Atualizar conta de um ganho
router.put('/income/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { bank_account_id } = req.body;
    if (!bank_account_id) {
      return res.status(400).json({ success: false, message: 'Conta bancária obrigatória.' });
    }
    // Verifica se o ganho existe e pertence ao usuário
    const income = await db.get('SELECT * FROM income WHERE id = ? AND user_id = ?', [id, userId]);
    if (!income) {
      return res.status(404).json({ success: false, message: 'Ganho não encontrado.' });
    }
    // Ajustar saldos das contas SEMPRE que trocar a conta
    if (income.bank_account_id && income.bank_account_id !== bank_account_id) {
      // Restituir valor à conta antiga
      await db.run('UPDATE bank_accounts SET balance = balance - ? WHERE id = ? AND user_id = ?', [income.amount, income.bank_account_id, userId]);
    }
    // Creditar valor na nova conta
    await db.run('UPDATE bank_accounts SET balance = balance + ? WHERE id = ? AND user_id = ?', [income.amount, bank_account_id, userId]);
    await db.run('UPDATE income SET bank_account_id = ? WHERE id = ? AND user_id = ?', [bank_account_id, id, userId]);
    // Buscar o ganho atualizado com nome da conta
    const updated = await db.get('SELECT i.*, ba.account_name FROM income i LEFT JOIN bank_accounts ba ON i.bank_account_id = ba.id WHERE i.id = ?', [id]);
    res.json({ success: true, income: updated });
  } catch (error) {
    console.error('Erro ao atualizar conta do ganho:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar conta do ganho.' });
  }
});

// Listar gastos
router.get('/expenses', [
    query('start_date').optional().isISO8601().withMessage('Data inicial inválida'),
    query('end_date').optional().isISO8601().withMessage('Data final inválida'),
    query('payment_method').optional().isIn(['debito', 'credito', 'pix']).withMessage('Método de pagamento inválido')
], async (req, res) => {
    try {
        const { start_date, end_date, payment_method } = req.query;
        let sql = 'SELECT e.*, ba.account_name FROM expenses e LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id WHERE e.user_id = ?';
        let params = [req.user.userId];

        if (start_date && end_date) {
            sql += ' AND expense_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        if (payment_method) {
            sql += ' AND payment_method = ?';
            params.push(payment_method);
        }

        sql += ' ORDER BY expense_date DESC';

        const expenses = await db.query(sql, params);

        res.json({
            success: true,
            expenses
        });
    } catch (error) {
        console.error('Erro ao listar gastos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Registrar gasto
router.post('/expenses', [
    body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
    body('description').optional().isLength({ max: 500 }).withMessage('Descrição muito longa'),
    body('payment_method').isIn(['debito', 'credito', 'pix']).withMessage('Método de pagamento inválido'),
    body('expense_date').isISO8601().withMessage('Data inválida'),
    body('category').optional().isLength({ max: 100 }).withMessage('Categoria muito longa'),
    body('installments').optional().isInt({ min: 1, max: 24 }).withMessage('Número de parcelas deve estar entre 1 e 24'),
    body('bank_account_id').optional().isInt({ min: 1 }).withMessage('ID da conta bancária inválido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { amount, description, payment_method, expense_date, category, installments, bank_account_id } = req.body;

        console.log('Dados recebidos:', { amount, description, payment_method, expense_date, category, installments, bank_account_id });

        // Verificar se há limite suficiente para gastos em crédito
        if (payment_method === 'credito' && bank_account_id) {
            const account = await db.get(
                'SELECT credit_limit FROM bank_accounts WHERE id = ? AND user_id = ? AND account_category = ?',
                [bank_account_id, req.user.userId, 'credito']
            );
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: 'Conta de crédito não encontrada'
                });
            }
            
            if (account.credit_limit < amount) {
                return res.status(400).json({
                    success: false,
                    message: `Limite insuficiente. Limite disponível: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.credit_limit)}`
                });
            }
        }

        const result = await db.run(
            'INSERT INTO expenses (user_id, amount, description, payment_method, expense_date, category, installments, bank_account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, amount, description, payment_method, expense_date, category, installments, bank_account_id]
        );

        // Atualizar saldo/limite da conta bancária se especificada
        if (bank_account_id) {
            if (payment_method === 'debito' || payment_method === 'pix') {
                // Para débito e PIX: deduzir do saldo
                console.log(`Atualizando saldo da conta ${bank_account_id} com -${amount} (${payment_method})`);
                await db.run(
                    'UPDATE bank_accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                    [amount, bank_account_id, req.user.userId]
                );
                console.log('Saldo atualizado com sucesso');
            } else if (payment_method === 'credito') {
                // Para crédito: deduzir do limite disponível
                console.log(`Atualizando limite da conta ${bank_account_id} com -${amount} (crédito)`);
                await db.run(
                    'UPDATE bank_accounts SET credit_limit = credit_limit - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                    [amount, bank_account_id, req.user.userId]
                );
                console.log('Limite atualizado com sucesso');
            }
        }

        const expense = await db.get(
            'SELECT e.*, ba.account_name FROM expenses e LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id WHERE e.id = ?',
            [result.id]
        );

        res.status(201).json({
            success: true,
            message: 'Gasto registrado com sucesso',
            expense
        });
    } catch (error) {
        console.error('Erro ao registrar gasto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Excluir gasto variável
router.delete('/expenses/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    // Verifica se o gasto existe e pertence ao usuário
    const expense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Gasto não encontrado' });
    }
    // Restituir valor à conta bancária
    if (expense.bank_account_id) {
      if (expense.payment_method === 'debito' || expense.payment_method === 'pix') {
        // Restituir ao saldo para débito e PIX
        await db.run('UPDATE bank_accounts SET balance = balance + ? WHERE id = ? AND user_id = ?', [expense.amount, expense.bank_account_id, userId]);
      } else if (expense.payment_method === 'credito') {
        // Restituir ao limite para crédito
        await db.run('UPDATE bank_accounts SET credit_limit = credit_limit + ? WHERE id = ? AND user_id = ?', [expense.amount, expense.bank_account_id, userId]);
      }
    }
    await db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: 'Gasto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir gasto:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir gasto' });
  }
});

// Listar despesas fixas
router.get('/fixed-expenses', async (req, res) => {
    try {
        const expenses = await db.query(
            'SELECT fe.*, ba.account_name FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.user_id = ? ORDER BY fe.due_date ASC',
            [req.user.userId]
        );

        res.json({
            success: true,
            fixed_expenses: expenses
        });
    } catch (error) {
        console.error('Erro ao listar despesas fixas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Criar despesa fixa
router.post('/fixed-expenses', [
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
    body('due_date').isISO8601().withMessage('Data de vencimento inválida'),
    body('category').optional().isLength({ max: 100 }).withMessage('Categoria muito longa'),
    body('bank_account_id').optional().isInt({ min: 1 }).withMessage('ID da conta bancária inválido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { description, amount, due_date, bank_account_id, category, is_boleto, total_installments, paid_installments } = req.body;

        const result = await db.run(
            'INSERT INTO fixed_expenses (user_id, description, amount, due_date, bank_account_id, category, is_boleto, total_installments, paid_installments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, description, amount, due_date, bank_account_id, category, is_boleto ? 1 : 0, total_installments || null, paid_installments || 0]
        );

        const expense = await db.get(
            'SELECT fe.*, ba.account_name FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.id = ?',
            [result.id]
        );

        res.status(201).json({
            success: true,
            message: 'Despesa fixa criada com sucesso',
            fixed_expense: expense
        });
    } catch (error) {
        console.error('Erro ao criar despesa fixa:', error);
        if (error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Erro interno do servidor',
            error: error
        });
    }
});

// Marcar despesa fixa como paga
router.put('/fixed-expenses/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { bank_account_id } = req.body;

        // Verificar se a despesa existe e pertence ao usuário
        const expense = await db.get(
            'SELECT * FROM fixed_expenses WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Despesa não encontrada'
            });
        }

        if (expense.is_paid) {
            return res.status(400).json({
                success: false,
                message: 'Despesa já está paga'
            });
        }

        // Se for boleto, incrementar paid_installments
        let newPaidInstallments = expense.paid_installments;
        let setPaid = false;
        if (expense.is_boleto) {
            const totalInstallments = parseInt(expense.total_installments, 10) || 1;
            newPaidInstallments = (parseInt(expense.paid_installments, 10) || 0) + 1;
            // Só marca como paga se todas as parcelas forem quitadas
            setPaid = newPaidInstallments >= totalInstallments;
            await db.run(
                'UPDATE fixed_expenses SET paid_installments = ?, is_paid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newPaidInstallments, setPaid ? 1 : 0, id]
            );
        } else {
            // Se não for boleto, marca como paga normalmente
            await db.run(
                'UPDATE fixed_expenses SET is_paid = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
        }

        // Atualizar saldo da conta bancária se especificada
        if (bank_account_id) {
            await db.run(
                'UPDATE bank_accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                [expense.amount, bank_account_id, req.user.userId]
            );
            // Atualizar o bank_account_id da despesa fixa para garantir restituição correta na exclusão
            await db.run(
                'UPDATE fixed_expenses SET bank_account_id = ? WHERE id = ? AND user_id = ?',
                [bank_account_id, id, req.user.userId]
            );
        }

        // Buscar despesa atualizada
        const updatedExpense = await db.get(
            'SELECT fe.*, ba.account_name FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.id = ?',
            [id]
        );

        res.json({
            success: true,
            message: setPaid ? 'Despesa marcada como totalmente paga!' : 'Parcela paga com sucesso',
            fixed_expense: updatedExpense
        });
    } catch (error) {
        console.error('Erro ao marcar despesa como paga:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Excluir despesa fixa
router.delete('/fixed-expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const expenseId = parseInt(id, 10);
        const userId = req.user.userId;

        // Verificar se a despesa existe e pertence ao usuário
        const expense = await db.get(
            'SELECT * FROM fixed_expenses WHERE id = ? AND user_id = ?',
            [expenseId, userId]
        );

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Despesa fixa não encontrada'
            });
        }

        // Restituir valor à conta bancária, se necessário
        if (expense.bank_account_id) {
            let valorRestituir = 0;
            if (expense.is_boleto) {
                // Restitui o valor das parcelas já pagas
                const parcelasPagas = parseInt(expense.paid_installments, 10) || 0;
                valorRestituir = parcelasPagas * parseFloat(expense.amount);
                if (valorRestituir > 0) {
                    console.log(`[FIXED-EXPENSE-DELETE] Restituindo R$${valorRestituir} (boleto, ${parcelasPagas} parcelas pagas) para conta ${expense.bank_account_id}`);
                    await db.run(
                        'UPDATE bank_accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                        [valorRestituir, expense.bank_account_id, userId]
                    );
                }
            } else {
                // Para despesas normais, só restitui se estiver paga
                if (expense.is_paid) {
                    valorRestituir = parseFloat(expense.amount);
                    console.log(`[FIXED-EXPENSE-DELETE] Restituindo R$${valorRestituir} (fixa normal paga) para conta ${expense.bank_account_id}`);
                    await db.run(
                        'UPDATE bank_accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                        [valorRestituir, expense.bank_account_id, userId]
                    );
                }
            }
        }

        await db.run(
            'DELETE FROM fixed_expenses WHERE id = ? AND user_id = ?',
            [expenseId, userId]
        );

        res.json({
            success: true,
            message: 'Despesa fixa excluída com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir despesa fixa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Atualizar gasto
router.put('/expenses/:id', [
    body('bank_account_id').optional().isInt({ min: 1 }).withMessage('ID da conta bancária inválido'),
    body('installments').optional().isInt({ min: 1, max: 24 }).withMessage('Número de parcelas deve estar entre 1 e 24')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const expenseId = parseInt(id, 10);
        const userId = req.user.userId;
        const updateData = req.body;

        // Verificar se a despesa existe e pertence ao usuário
        const expense = await db.get(
            'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
            [expenseId, userId]
        );

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Gasto não encontrado'
            });
        }

        // Construir query de atualização dinamicamente
        const updateFields = [];
        const updateValues = [];

        if (updateData.bank_account_id !== undefined) {
            updateFields.push('bank_account_id = ?');
            updateValues.push(updateData.bank_account_id);
        }

        if (updateData.installments !== undefined) {
            updateFields.push('installments = ?');
            updateValues.push(updateData.installments);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo válido para atualização'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(expenseId, userId);

        const updateQuery = `UPDATE expenses SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
        await db.run(updateQuery, updateValues);

        // Buscar despesa atualizada
        const updatedExpense = await db.get(
            'SELECT e.*, ba.account_name FROM expenses e LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id WHERE e.id = ?',
            [expenseId]
        );

        res.json({
            success: true,
            message: 'Gasto atualizado com sucesso',
            expense: updatedExpense
        });
    } catch (error) {
        console.error('Erro ao atualizar gasto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Resumo financeiro
router.get('/summary', [
    query('period').isIn(['day', 'week', 'month', 'year']).withMessage('Período inválido')
], async (req, res) => {
    try {
        const { period } = req.query;
        const userId = req.user.userId;

        // Calcular datas baseado no período
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startDate = new Date(now.getFullYear(), now.getMonth(), diff);
                endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Buscar dados do período
        const income = await db.query(
            'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND income_date BETWEEN ? AND ?',
            [userId, startDateStr, endDateStr]
        );

        // Buscar ganhos detalhados
        const incomeDetails = await db.query(
            'SELECT i.*, ba.account_name FROM income i LEFT JOIN bank_accounts ba ON i.bank_account_id = ba.id WHERE i.user_id = ? AND i.income_date BETWEEN ? AND ? ORDER BY i.income_date DESC',
            [userId, startDateStr, endDateStr]
        );

        const expenses = await db.query(
            'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?',
            [userId, startDateStr, endDateStr]
        );

        // Buscar gastos variáveis detalhados
        const expensesDetails = await db.query(
            'SELECT e.*, ba.account_name, ba.account_category FROM expenses e LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? ORDER BY e.expense_date DESC',
            [userId, startDateStr, endDateStr]
        );

        // Somar apenas despesas fixas não pagas
        const fixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [userId]
        );

        // Buscar despesas fixas detalhadas
        const fixedExpensesDetails = await db.query(
            'SELECT fe.*, ba.account_name, ba.account_category FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.user_id = ? AND fe.is_paid = 0 ORDER BY fe.due_date ASC',
            [userId]
        );

        const expensesByMethod = await db.query(
            'SELECT payment_method, SUM(amount) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ? GROUP BY payment_method',
            [userId, startDateStr, endDateStr]
        );

        const bankAccounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ?',
            [userId]
        );

        // Garantir que todas as contas tenham account_category
        const bankAccountsWithCategory = bankAccounts.map(account => ({
            ...account,
            account_category: account.account_category || 'debito'
        }));

        const summary = {
            period,
            startDate: startDateStr,
            endDate: endDateStr,
            totalIncome: income[0]?.total || 0,
            totalExpenses: expenses[0]?.total || 0,
            totalFixedExpenses: fixedExpenses[0]?.total || 0,
            balance: (income[0]?.total || 0) - (expenses[0]?.total || 0) - (fixedExpenses[0]?.total || 0),
            expensesByMethod,
            bankAccounts: bankAccountsWithCategory,
            // Dados detalhados
            incomeDetails,
            expensesDetails,
            fixedExpensesDetails
        };

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Erro ao gerar resumo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Conselhos financeiros com Gemini
router.get('/financial-advice', async (req, res) => {
    try {
        const userId = req.user.userId;

        // Buscar dados do usuário para análise
        const user = await db.get(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        const income = await db.query(
            'SELECT * FROM income WHERE user_id = ? ORDER BY income_date DESC LIMIT 10',
            [userId]
        );

        const expenses = await db.query(
            'SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC LIMIT 10',
            [userId]
        );

        const fixedExpenses = await db.query(
            'SELECT * FROM fixed_expenses WHERE user_id = ?',
            [userId]
        );

        const bankAccounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ?',
            [userId]
        );

        // Garantir que todas as contas tenham account_category
        const bankAccountsWithCategory = bankAccounts.map(account => ({
            ...account,
            account_category: account.account_category || 'debito'
        }));

        // Buscar o último conselho salvo para o usuário
        const lastAdviceRow = await db.get(
            'SELECT advice FROM financial_advice WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        const lastAdvice = lastAdviceRow ? lastAdviceRow.advice : null;

        const userData = {
            user,
            income,
            expenses,
            fixedExpenses,
            bankAccounts: bankAccountsWithCategory,
            lastAdvice // <-- Passa o último conselho para o Gemini
        };

        const advice = await geminiService.generateFinancialAdvice(userData);

        // Salvar o conselho no banco
        if (advice && advice.success && advice.advice) {
            await db.run(
                'INSERT INTO financial_advice (user_id, advice, created_at) VALUES (?, ?, ?)',
                [userId, advice.advice, advice.timestamp || new Date().toISOString()]
            );
        }

        res.json({
            success: true,
            advice
        });
    } catch (error) {
        console.error('Erro ao gerar conselho financeiro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Buscar o último conselho salvo para o usuário
router.get('/financial-advice/last', async (req, res) => {
    try {
        const userId = req.user.userId;
        const lastAdvice = await db.get(
            'SELECT * FROM financial_advice WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        if (lastAdvice) {
            res.json({ success: true, advice: lastAdvice });
        } else {
            res.json({ success: false, message: 'Nenhum conselho encontrado para este usuário.' });
        }
    } catch (error) {
        console.error('Erro ao buscar último conselho:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
