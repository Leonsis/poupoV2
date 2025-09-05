const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const { errorLogger } = require('../middleware/errorLogger');
const FixedExpenseTransitionService = require('../services/fixedExpenseTransitionService');
const MonthlySummaryService = require('../services/monthlySummaryService');

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

        // Garantir que todas as contas tenham account_category e is_visible
        const accountsWithCategory = accounts.map(account => ({
            ...account,
            account_category: account.account_category || 'debito',
            is_visible: account.is_visible !== undefined ? account.is_visible : true
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

        const { account_name, account_type, account_category, balance, credit_limit, due_date, is_visible } = req.body;

        console.log('Criando conta bancária:', { account_name, account_type, account_category, balance, credit_limit, due_date, is_visible });

        // Garantir que o saldo seja um número
        const numericBalance = balance !== undefined ? parseFloat(balance) || 0 : 0;
        const numericCreditLimit = credit_limit !== undefined ? parseFloat(credit_limit) || 0 : null;
        const numericDueDate = due_date !== undefined ? parseInt(due_date) || null : null;
        const visibleAccount = is_visible !== undefined ? is_visible : true;

        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        const result = await db.run(
            'INSERT INTO bank_accounts (user_id, account_name, account_type, account_category, balance, credit_limit, due_date, is_visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, account_name, account_type, account_category, numericBalance, numericCreditLimit, numericDueDate, visibleAccount, currentDateTime, currentDateTime]
        );

        console.log('Resultado da inserção:', result);
        console.log('Conta criada com ID:', result.id);

        const account = await db.get(
            'SELECT * FROM bank_accounts WHERE id = ?',
            [result.id]
        );

        // Garantir que a conta tenha account_category, balance e is_visible
        const accountWithCategory = {
            ...account,
            account_category: account?.account_category || account_category || 'debito',
            balance: parseFloat(account?.balance) || numericBalance || 0,
            credit_limit: parseFloat(account?.credit_limit) || numericCreditLimit || 0,
            due_date: account?.due_date || numericDueDate,
            is_visible: account?.is_visible !== undefined ? account.is_visible : visibleAccount
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

        // Verificar se há ganhos vinculados a esta conta
        const incomeCount = await db.query(
            'SELECT COUNT(*) as count FROM income WHERE bank_account_id = ?',
            [accountId]
        );

        // Verificar se há gastos vinculados a esta conta
        const expensesCount = await db.query(
            'SELECT COUNT(*) as count FROM expenses WHERE bank_account_id = ?',
            [accountId]
        );

        // Se houver ganhos ou gastos vinculados, deletá-los primeiro
        if (incomeCount[0]?.count > 0) {
            console.log(`Deletando ${incomeCount[0].count} ganhos vinculados à conta ${accountId}`);
            await db.run(
                'DELETE FROM income WHERE bank_account_id = ?',
                [accountId]
            );
        }

        if (expensesCount[0]?.count > 0) {
            console.log(`Deletando ${expensesCount[0].count} gastos vinculados à conta ${accountId}`);
            await db.run(
                'DELETE FROM expenses WHERE bank_account_id = ?',
                [accountId]
            );
        }

        // Excluir a conta
        await db.run(
            'DELETE FROM bank_accounts WHERE id = ? AND user_id = ?',
            [accountId, req.user.userId]
        );

        // Buscar contas restantes e calcular saldo líquido (apenas contas visíveis)
        const accounts = await db.query(
            'SELECT * FROM bank_accounts WHERE user_id = ?',
            [req.user.userId]
        );
        const { calculateNetBalance } = require('../utils/dateUtils');
        const net_balance = calculateNetBalance(accounts);

        // Preparar mensagem informativa
        let message = 'Conta bancária excluída com sucesso';
        if (incomeCount[0]?.count > 0 || expensesCount[0]?.count > 0) {
            const deletedItems = [];
            if (incomeCount[0]?.count > 0) {
                deletedItems.push(`${incomeCount[0].count} ganho(s)`);
            }
            if (expensesCount[0]?.count > 0) {
                deletedItems.push(`${expensesCount[0].count} gasto(s)`);
            }
            message += `. Também foram excluídos: ${deletedItems.join(' e ')} vinculados a esta conta.`;
        }

        res.json({
            success: true,
            message,
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
        const { account_name, account_type, account_category, credit_limit, due_date, is_visible } = req.body;
        console.log('Requisição para atualizar conta:', { id, account_name, account_type, account_category, credit_limit, due_date, is_visible });

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
        if (is_visible !== undefined) {
            updates.push('is_visible = ?');
            params.push(is_visible);
        }
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }
        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        params.push(currentDateTime, id, userId);
        const sql = `UPDATE bank_accounts SET ${updates.join(', ')}, updated_at = ? WHERE id = ? AND user_id = ?`;
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
        const { formatDateToLocal } = require('../utils/dateUtils');
        const parsedDate = income_date ? formatDateToLocal(income_date) : null;
        const desc = typeof description === 'string' ? description : (description ? String(description) : '');
        let validBankAccountId = Number.isInteger(Number(bank_account_id)) && Number(bank_account_id) > 0 ? Number(bank_account_id) : null;
        if (bank_account_id === undefined || bank_account_id === '' || bank_account_id === null) {
            validBankAccountId = null;
        }

        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        // Inserir ganho, incluindo bank_account_id como null explicitamente se não houver conta
        let insertSql, insertParams;
        if (validBankAccountId !== null) {
            insertSql = 'INSERT INTO income (user_id, amount, source, income_date, description, bank_account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            insertParams = [req.user.userId, parsedAmount, source, parsedDate, desc, validBankAccountId, currentDateTime, currentDateTime];
        } else {
            insertSql = 'INSERT INTO income (user_id, amount, source, income_date, description, bank_account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            insertParams = [req.user.userId, parsedAmount, source, parsedDate, desc, null, currentDateTime, currentDateTime];
        }
        console.log('Comando SQL:', insertSql, insertParams);
        const result = await db.run(insertSql, insertParams);

        // Atualizar saldo da conta bancária se especificada e válida
        if (validBankAccountId) {
            console.log(`Atualizando saldo da conta ${validBankAccountId} com +${parsedAmount}`);
            await db.run(
                'UPDATE bank_accounts SET balance = balance + ?, updated_at = ? WHERE id = ? AND user_id = ?',
                [parsedAmount, currentDateTime, validBankAccountId, req.user.userId]
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
            query('payment_method').optional().isIn(['debito', 'credito']).withMessage('Método de pagamento inválido')
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
    body('payment_method').isIn(['debito', 'credito']).withMessage('Método de pagamento inválido'),
    body('expense_date').custom((value) => {
        if (!value) {
            throw new Error('Data é obrigatória');
        }
        // Aceitar tanto formato ISO quanto formato brasileiro
        let date;
        if (typeof value === 'string') {
            // Se for string, tentar diferentes formatos
            if (value.includes('-')) {
                date = new Date(value);
            } else if (value.includes('/')) {
                // Formato brasileiro DD/MM/YYYY
                const parts = value.split('/');
                if (parts.length === 3) {
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                } else {
                    date = new Date(value);
                }
            } else {
                date = new Date(value);
            }
        } else {
            date = new Date(value);
        }
        return !isNaN(date.getTime());
    }).withMessage('Data inválida'),
    body('category').optional().isLength({ max: 100 }).withMessage('Categoria muito longa'),
    body('installments').optional().custom((value) => {
        if (value === '' || value === null || value === undefined) {
            return true; // Permite valores vazios
        }
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 24;
    }).withMessage('Número de parcelas deve estar entre 1 e 24'),
    body('bank_account_id').optional().custom((value) => {
        if (value === '' || value === null || value === undefined) {
            return true; // Permite valores vazios
        }
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
    }).withMessage('ID da conta bancária inválido')
], async (req, res) => {
    try {
        console.log('=== DEBUG EXPENSES ===');
        console.log('Body recebido:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', req.user.userId);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Content-Type:', req.headers['content-type']);
        console.log('========================');
        
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Log detalhado dos erros de validação
            errorLogger.logValidationError(req, errors);
            
            // Log adicional para debug
            console.log('=== ERROS DE VALIDAÇÃO DETALHADOS ===');
            console.log('Body recebido:', JSON.stringify(req.body, null, 2));
            console.log('Erros encontrados:', JSON.stringify(errors.array(), null, 2));
            errors.array().forEach((error, index) => {
                console.log(`Erro ${index + 1}: Campo="${error.path}", Valor="${error.value}", Mensagem="${error.msg}"`);
            });
            console.log('=====================================');
            
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { amount, description, payment_method, expense_date, category, installments, bank_account_id } = req.body;

        // Processar dados antes de inserir no banco
        const processedData = {
            amount: parseFloat(amount),
            description: description || null,
            payment_method,
            expense_date,
            category: category || null,
            installments: installments && installments !== '' ? parseInt(installments) : null,
            bank_account_id: bank_account_id && bank_account_id !== '' ? parseInt(bank_account_id) : null
        };

        console.log('Dados recebidos:', { amount, description, payment_method, expense_date, category, installments, bank_account_id });
        console.log('Dados processados:', processedData);

        // Verificar se há limite suficiente para gastos em crédito
        if (processedData.payment_method === 'credito' && processedData.bank_account_id) {
            const account = await db.get(
                'SELECT credit_limit FROM bank_accounts WHERE id = ? AND user_id = ? AND account_category = ?',
                [processedData.bank_account_id, req.user.userId, 'credito']
            );
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: 'Conta de crédito não encontrada'
                });
            }
            
            if (account.credit_limit < processedData.amount) {
                return res.status(400).json({
                    success: false,
                    message: `Limite insuficiente. Limite disponível: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.credit_limit)}`
                });
            }
        }

        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        const result = await db.run(
            'INSERT INTO expenses (user_id, amount, description, payment_method, expense_date, category, installments, bank_account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, processedData.amount, processedData.description, processedData.payment_method, processedData.expense_date, processedData.category, processedData.installments, processedData.bank_account_id, currentDateTime, currentDateTime]
        );

        // Atualizar saldo/limite da conta bancária se especificada
        if (processedData.bank_account_id) {
            if (processedData.payment_method === 'debito') {
                // Para débito: deduzir do saldo
                console.log(`Atualizando saldo da conta ${processedData.bank_account_id} com -${processedData.amount} (débito)`);
                await db.run(
                    'UPDATE bank_accounts SET balance = balance - ?, updated_at = ? WHERE id = ? AND user_id = ?',
                    [processedData.amount, currentDateTime, processedData.bank_account_id, req.user.userId]
                );
                console.log('Saldo atualizado com sucesso');
            } else if (processedData.payment_method === 'credito') {
                // Para crédito: deduzir do limite disponível
                console.log(`Atualizando limite da conta ${processedData.bank_account_id} com -${processedData.amount} (crédito)`);
                await db.run(
                    'UPDATE bank_accounts SET credit_limit = credit_limit - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                    [processedData.amount, currentDateTime, processedData.bank_account_id, req.user.userId]
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
        // Log detalhado do erro
        errorLogger.logRequestError(req, error, {
            operation: 'registrar_gasto',
            requestData: req.body
        });
        
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
      if (expense.payment_method === 'debito') {
        // Restituir ao saldo para débito
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
    body('due_date').isInt({ min: 1, max: 31 }).withMessage('Dia de vencimento deve estar entre 1 e 31'),
    body('category').optional().isLength({ max: 100 }).withMessage('Categoria muito longa'),
    body('bank_account_id').optional().isInt({ min: 1 }).withMessage('ID da conta bancária inválido'),
    body('is_boleto').optional().isBoolean().withMessage('Campo is_boleto deve ser booleano'),
    body('total_installments').optional().custom((value, { req }) => {
        if (req.body.is_boleto && (!value || value === '' || parseInt(value) < 1)) {
            throw new Error('Total de parcelas é obrigatório e deve ser maior que zero quando é boleto');
        }
        return true;
    }),
    body('paid_installments').optional().custom((value, { req }) => {
        if (req.body.is_boleto && (value === undefined || value === null || parseInt(value) < 0)) {
            throw new Error('Parcelas pagas deve ser zero ou maior quando é boleto');
        }
        return true;
    })
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

        // Tratar campos de boleto e parcelas
        const isBoleto = Boolean(is_boleto);
        const totalInstallments = isBoleto && total_installments && total_installments !== '' ? parseInt(total_installments) : null;
        const paidInstallments = isBoleto && paid_installments && paid_installments !== '' ? parseInt(paid_installments) : 0;

        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        const result = await db.run(
            'INSERT INTO fixed_expenses (user_id, description, amount, due_date, bank_account_id, category, is_boleto, total_installments, paid_installments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, description, amount, due_date, bank_account_id, category, isBoleto ? 1 : 0, totalInstallments, paidInstallments, currentDateTime, currentDateTime]
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
                'UPDATE fixed_expenses SET paid_installments = ?, is_paid = ?, updated_at = ? WHERE id = ?',
                [newPaidInstallments, setPaid ? 1 : 0, currentDateTime, id]
            );
        } else {
            // Se não for boleto, marca como paga normalmente
            await db.run(
                'UPDATE fixed_expenses SET is_paid = 1, updated_at = ? WHERE id = ?',
                [currentDateTime, id]
            );
        }

        // Atualizar saldo da conta bancária se especificada
        if (bank_account_id) {
            await db.run(
                'UPDATE bank_accounts SET balance = balance - ?, updated_at = ? WHERE id = ? AND user_id = ?',
                [expense.amount, currentDateTime, bank_account_id, req.user.userId]
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
            
            // Só restitui se a despesa foi realmente paga
            if (expense.is_paid) {
                if (expense.is_boleto) {
                    // Para boletos, restitui o valor das parcelas já pagas
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
                    // Para despesas normais, restitui o valor total se estiver paga
                    valorRestituir = parseFloat(expense.amount);
                    console.log(`[FIXED-EXPENSE-DELETE] Restituindo R$${valorRestituir} (fixa normal paga) para conta ${expense.bank_account_id}`);
                    await db.run(
                        'UPDATE bank_accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                        [valorRestituir, expense.bank_account_id, userId]
                    );
                }
            } else {
                console.log(`[FIXED-EXPENSE-DELETE] Despesa não estava paga, não há restituição necessária`);
            }
        }

        // Deletar gastos relacionados criados pelo pagamento de despesas vencidas
        // Buscar gastos que foram criados pelo pagamento desta despesa fixa
        const relatedExpenses = await db.query(
            'SELECT id FROM expenses WHERE description = ? AND user_id = ? AND amount = ? AND payment_method = ?',
            [expense.description, userId, expense.amount, 'debito']
        );
        
        if (relatedExpenses.length > 0) {
            console.log(`[FIXED-EXPENSE-DELETE] Deletando ${relatedExpenses.length} gastos relacionados`);
            for (const relatedExpense of relatedExpenses) {
                // Restituir valor do gasto relacionado se necessário
                const relatedExpenseData = await db.get(
                    'SELECT * FROM expenses WHERE id = ?',
                    [relatedExpense.id]
                );
                
                if (relatedExpenseData && relatedExpenseData.bank_account_id) {
                    console.log(`[FIXED-EXPENSE-DELETE] Restituindo R$${relatedExpenseData.amount} do gasto relacionado para conta ${relatedExpenseData.bank_account_id}`);
                    await db.run(
                        'UPDATE bank_accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                        [relatedExpenseData.amount, relatedExpenseData.bank_account_id, userId]
                    );
                }
                
                // Deletar o gasto relacionado
                await db.run(
                    'DELETE FROM expenses WHERE id = ?',
                    [relatedExpense.id]
                );
            }
        }

        // Deletar apenas a despesa fixa específica (não as relacionadas)
        console.log(`[FIXED-EXPENSE-DELETE] Deletando apenas a despesa específica ID ${expenseId}`);
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
    query('period').isIn(['day', 'week', 'month', 'year']).withMessage('Período inválido'),
    query('custom_date').optional().isISO8601().withMessage('Data customizada inválida')
], async (req, res) => {
    try {
        const { period, custom_date } = req.query;
        const userId = req.user.userId;

        // Calcular datas baseado no período
        let startDate, endDate;
        
        if (custom_date && period === 'month') {
            // Se for uma data customizada no formato YYYY-MM, usar essa data
            const [year, month] = custom_date.split('-');
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 1);
        } else {
            // Usar a data atual
            const now = new Date();

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
        }

        const { formatDateToLocal } = require('../utils/dateUtils');
        const startDateStr = formatDateToLocal(startDate);
        const endDateStr = formatDateToLocal(endDate);

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

        // Buscar apenas gastos de débito (excluir cartão de crédito das despesas)
        const expenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')`,
            [userId, startDateStr, endDateStr]
        );

        // Buscar gastos variáveis detalhados (apenas débito)
        const expensesDetails = await db.query(
            `SELECT e.*, ba.account_name, ba.account_category 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'debito' OR ba.account_category = 'debito')
             ORDER BY e.expense_date DESC`,
            [userId, startDateStr, endDateStr]
        );



        // Buscar gastos com cartão de crédito separadamente
        const creditCardExpenses = await db.query(
            `SELECT SUM(e.amount) as total 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'credito' OR ba.account_category = 'credito')`,
            [userId, startDateStr, endDateStr]
        );

        // Buscar detalhes dos gastos com cartão de crédito
        const creditCardExpensesDetails = await db.query(
            `SELECT e.*, ba.account_name, ba.account_category 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
             AND (e.payment_method = 'credito' OR ba.account_category = 'credito')
             ORDER BY e.expense_date DESC`,
            [userId, startDateStr, endDateStr]
        );

        // Buscar TODAS as despesas fixas (pagas + não pagas) para exibição
        const fixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ?',
            [userId]
        );

        // Buscar apenas despesas fixas NÃO PAGAS para cálculo do saldo
        const unpaidFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 0',
            [userId]
        );

        // Buscar apenas despesas fixas PAGAS para cálculo do saldo
        const paidFixedExpenses = await db.query(
            'SELECT SUM(amount) as total FROM fixed_expenses WHERE user_id = ? AND is_paid = 1',
            [userId]
        );

        // Buscar despesas fixas detalhadas (todas para exibição)
        const fixedExpensesDetails = await db.query(
            'SELECT fe.*, ba.account_name, ba.account_category FROM fixed_expenses fe LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id WHERE fe.user_id = ? ORDER BY fe.due_date ASC',
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

        // Garantir que todas as contas tenham account_category, is_visible e calcular saldo para cartões de crédito
        const bankAccountsWithCategory = bankAccounts.map(account => {
            let calculatedBalance = account.balance;
            
            // Para cartões de crédito, calcular saldo como (limite - gastos)
            if (account.account_category === 'credito' && account.credit_limit) {
                // Buscar gastos específicos deste cartão de crédito
                const cardExpenses = creditCardExpensesDetails.filter(expense => 
                    expense.bank_account_id === account.id
                );
                
                const totalCardExpenses = cardExpenses.reduce((sum, expense) => 
                    sum + parseFloat(expense.amount || 0), 0
                );
                
                // Saldo = Limite - Gastos
                calculatedBalance = parseFloat(account.credit_limit) - totalCardExpenses;
            }
            
            return {
                ...account,
                account_category: account.account_category || 'debito',
                is_visible: account.is_visible !== undefined ? account.is_visible : true,
                balance: calculatedBalance,
                // Para cartões de crédito, manter o limite original
                original_credit_limit: account.account_category === 'credito' ? account.credit_limit : null
            };
        });





        // Calcular saldo líquido (soma dos saldos das contas de débito visíveis)
        const { calculateNetBalance } = require('../utils/dateUtils');
        const net_balance = calculateNetBalance(bankAccountsWithCategory);

        const summary = {
            period,
            startDate: startDateStr,
            endDate: endDateStr,
            totalIncome: income[0]?.total || 0,
            totalExpenses: expenses[0]?.total || 0,
            totalFixedExpenses: fixedExpenses[0]?.total || 0,
            totalCreditCardExpenses: creditCardExpenses[0]?.total || 0,
            // Saldo = Receitas - Despesas Variáveis - Despesas Fixas PAGAS
            balance: (income[0]?.total || 0) - (expenses[0]?.total || 0) - (paidFixedExpenses[0]?.total || 0),
            // Saldo Líquido = Soma dos saldos das contas de débito
            net_balance,
            expensesByMethod,
            bankAccounts: bankAccountsWithCategory,
            // Dados detalhados
            incomeDetails,
            expensesDetails,
            fixedExpensesDetails,
            creditCardExpensesDetails
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

        // Buscar gastos com cartão de crédito para cálculo de saldo
        const creditCardExpenses = await db.query(
            `SELECT e.*, ba.account_name, ba.account_category 
             FROM expenses e 
             LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id 
             WHERE e.user_id = ? AND (e.payment_method = 'credito' OR ba.account_category = 'credito')`,
            [userId]
        );

        // Garantir que todas as contas tenham account_category e calcular saldo para cartões de crédito
        const bankAccountsWithCategory = bankAccounts.map(account => {
            let calculatedBalance = account.balance;
            
            // Para cartões de crédito, calcular saldo como (limite - gastos)
            if (account.account_category === 'credito' && account.credit_limit) {
                // Buscar gastos específicos deste cartão de crédito
                const cardExpenses = creditCardExpenses.filter(expense => 
                    expense.bank_account_id === account.id
                );
                
                const totalCardExpenses = cardExpenses.reduce((sum, expense) => 
                    sum + parseFloat(expense.amount || 0), 0
                );
                
                // Saldo = Limite - Gastos
                calculatedBalance = parseFloat(account.credit_limit) - totalCardExpenses;
            }
            
            return {
                ...account,
                account_category: account.account_category || 'debito',
                balance: calculatedBalance,
                // Para cartões de crédito, manter o limite original
                original_credit_limit: account.account_category === 'credito' ? account.credit_limit : null
            };
        });

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
                [userId, advice.advice, advice.timestamp || require('../utils/dateUtils').getCurrentDateTime()]
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

// ===== ROTAS PARA TRANSIÇÃO MENSAL DE DESPESAS FIXAS =====

// Verificar se precisa fazer transição mensal
router.get('/fixed-expenses/check-transition', async (req, res) => {
    try {
        const userId = req.user.userId;
        const needsTransition = await FixedExpenseTransitionService.needsMonthlyTransition(userId);
        
        res.json({
            success: true,
            needsTransition,
            message: needsTransition ? 'Transição mensal necessária' : 'Transição mensal não necessária'
        });
    } catch (error) {
        console.error('Erro ao verificar transição mensal:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Executar transição mensal
router.post('/fixed-expenses/execute-transition', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await FixedExpenseTransitionService.executeMonthlyTransition(userId);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Erro ao executar transição mensal:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Buscar despesas fixas com informações de transição
router.get('/fixed-expenses/with-transition', async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenses = await FixedExpenseTransitionService.getFixedExpensesWithTransition(userId);
        
        res.json({
            success: true,
            expenses
        });
    } catch (error) {
        console.error('Erro ao buscar despesas fixas com transição:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Pagar despesa vencida
router.post('/fixed-expenses/:id/pay-overdue', [
    body('bank_account_id').isInt().withMessage('ID da conta bancária é obrigatório')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const expenseId = parseInt(req.params.id);
        const { bank_account_id } = req.body;
        const userId = req.user.userId;

        const result = await FixedExpenseTransitionService.payOverdueExpense(expenseId, bank_account_id);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Erro ao pagar despesa vencida:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro interno do servidor'
        });
    }
});

// Contar despesas vencidas
router.get('/fixed-expenses/overdue-count', async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await FixedExpenseTransitionService.getOverdueExpensesCount(userId);
        
        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Erro ao contar despesas vencidas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ===== ROTAS PARA RESUMOS MENSAIS =====

// Verificar se é necessário gerar resumo do mês anterior
router.get('/monthly-summaries/check-generation', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await MonthlySummaryService.checkMonthlySummaryGeneration(userId);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Erro ao verificar geração de resumo mensal:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Gerar resumo mensal específico
router.post('/monthly-summaries/generate', [
    body('monthYear').matches(/^\d{4}-\d{2}$/).withMessage('Formato de mês/ano inválido (YYYY-MM)')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userId = req.user.userId;
        const { monthYear } = req.body;

        const result = await MonthlySummaryService.generateAndStoreMonthlySummary(userId, monthYear);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Erro ao gerar resumo mensal:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Listar todos os resumos mensais
router.get('/monthly-summaries', async (req, res) => {
    try {
        const userId = req.user.userId;
        const summaries = await MonthlySummaryService.listMonthlySummaries(userId);
        
        res.json({
            success: true,
            summaries
        });
    } catch (error) {
        console.error('Erro ao listar resumos mensais:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Buscar resumo mensal específico
router.get('/monthly-summaries/:monthYear', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { monthYear } = req.params;

        const summary = await MonthlySummaryService.getMonthlySummary(userId, monthYear);
        
        if (!summary) {
            return res.status(404).json({
                success: false,
                message: 'Resumo mensal não encontrado'
            });
        }

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Erro ao buscar resumo mensal:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Gerar todos os resumos pendentes desde a criação da conta
router.post('/monthly-summaries/generate-all-pending', async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Buscar data de criação da conta do usuário
        const user = await db.get('SELECT created_at FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        const result = await MonthlySummaryService.generateAllPendingSummaries(userId, user.created_at);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Erro ao gerar resumos pendentes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
