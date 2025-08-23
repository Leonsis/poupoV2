const db = require('../config/database');

class MonthlySummaryService {
    /**
     * Gera e armazena o resumo mensal para um usuário
     * @param {number} userId - ID do usuário
     * @param {string} monthYear - Mês/ano no formato YYYY-MM
     * @returns {object} - Resultado da operação
     */
    static async generateAndStoreMonthlySummary(userId, monthYear) {
        try {
            // Verificar se já existe um resumo para este mês
            const existingSummary = await this.getMonthlySummary(userId, monthYear);
            if (existingSummary) {
                return { success: false, message: 'Resumo já existe para este mês' };
            }

            // Gerar o resumo do mês
            const summary = await this.generateSummary(userId, monthYear);
            
            // Armazenar no banco
            const result = await this.storeMonthlySummary(userId, monthYear, summary);
            
            return { success: true, summary: result };
        } catch (error) {
            console.error('Erro ao gerar resumo mensal:', error);
            return { success: false, message: 'Erro ao gerar resumo mensal' };
        }
    }

    /**
     * Gera o resumo financeiro para um mês específico
     * @param {number} userId - ID do usuário
     * @param {string} monthYear - Mês/ano no formato YYYY-MM
     * @returns {object} - Resumo financeiro
     */
    static async generateSummary(userId, monthYear) {
        const [year, month] = monthYear.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;

        // Buscar receitas do mês
        const incomeQuery = `
            SELECT i.*, ba.account_name, ba.account_type, ba.account_category
            FROM income i
            LEFT JOIN bank_accounts ba ON i.bank_account_id = ba.id
            WHERE i.user_id = ? AND DATE(i.income_date) BETWEEN ? AND ?
            ORDER BY i.income_date DESC
        `;
        const income = await db.query(incomeQuery, [userId, startDate, endDate]);

        // Buscar despesas do mês (excluindo cartão de crédito)
        const expensesQuery = `
            SELECT e.*, ba.account_name, ba.account_type, ba.account_category
            FROM expenses e
            LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id
            WHERE e.user_id = ? AND DATE(e.expense_date) BETWEEN ? AND ?
            AND (e.payment_method = 'debito' OR ba.account_category = 'debito')
            ORDER BY e.expense_date DESC
        `;
        const expenses = await db.query(expensesQuery, [userId, startDate, endDate]);

        // Buscar despesas de cartão de crédito do mês
        const creditCardExpensesQuery = `
            SELECT e.*, ba.account_name, ba.account_type, ba.account_category
            FROM expenses e
            LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id
            WHERE e.user_id = ? AND DATE(e.expense_date) BETWEEN ? AND ?
            AND ba.account_category = 'credito'
            ORDER BY e.expense_date DESC
        `;
        const creditCardExpenses = await db.query(creditCardExpensesQuery, [userId, startDate, endDate]);

        // Buscar despesas fixas do mês
        const fixedExpensesQuery = `
            SELECT fe.*, ba.account_name, ba.account_type, ba.account_category
            FROM fixed_expenses fe
            LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
            WHERE fe.user_id = ? AND fe.month_year = ?
            ORDER BY fe.due_date
        `;
        const fixedExpenses = await db.query(fixedExpensesQuery, [userId, monthYear]);

        // Buscar contas bancárias
        const bankAccountsQuery = `
            SELECT id, account_name, account_type, account_category, balance, credit_limit
            FROM bank_accounts
            WHERE user_id = ?
            ORDER BY account_name
        `;
        const bankAccounts = await db.query(bankAccountsQuery, [userId]);

        // Calcular totais
        const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalCreditCardExpenses = creditCardExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalFixedExpenses = fixedExpenses.reduce((sum, item) => {
            return sum + (item.is_paid ? parseFloat(item.amount) : 0);
        }, 0);

        // Calcular saldo
        const balance = totalIncome - totalExpenses - totalFixedExpenses;

        return {
            totalIncome,
            totalExpenses,
            totalCreditCardExpenses,
            totalFixedExpenses,
            balance,
            incomeDetails: income,
            expensesDetails: expenses,
            creditCardExpensesDetails: creditCardExpenses,
            fixedExpensesDetails: fixedExpenses,
            bankAccountsSummary: bankAccounts
        };
    }

    /**
     * Armazena o resumo mensal no banco de dados
     * @param {number} userId - ID do usuário
     * @param {string} monthYear - Mês/ano no formato YYYY-MM
     * @param {object} summary - Resumo financeiro
     * @returns {object} - Resultado da operação
     */
    static async storeMonthlySummary(userId, monthYear, summary) {
        const query = `
            INSERT INTO monthly_summaries (
                user_id, month_year, total_income, total_expenses, total_fixed_expenses,
                total_credit_card_expenses, balance, income_details, expenses_details,
                fixed_expenses_details, credit_card_expenses_details, bank_accounts_summary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            userId,
            monthYear,
            summary.totalIncome,
            summary.totalExpenses,
            summary.totalFixedExpenses,
            summary.totalCreditCardExpenses,
            summary.balance,
            JSON.stringify(summary.incomeDetails),
            JSON.stringify(summary.expensesDetails),
            JSON.stringify(summary.fixedExpensesDetails),
            JSON.stringify(summary.creditCardExpensesDetails),
            JSON.stringify(summary.bankAccountsSummary)
        ];

        const result = await db.run(query, params);
        return { id: result.lastID, ...summary };
    }

    /**
     * Recupera um resumo mensal específico
     * @param {number} userId - ID do usuário
     * @param {string} monthYear - Mês/ano no formato YYYY-MM
     * @returns {object|null} - Resumo mensal ou null se não existir
     */
    static async getMonthlySummary(userId, monthYear) {
        const query = `
            SELECT * FROM monthly_summaries
            WHERE user_id = ? AND month_year = ?
        `;
        
        const summaries = await db.query(query, [userId, monthYear]);
        
        if (!summaries || summaries.length === 0) return null;
        
        const summary = summaries[0];

        // Converter JSON strings de volta para objetos
        return {
            ...summary,
            incomeDetails: JSON.parse(summary.income_details || '[]'),
            expensesDetails: JSON.parse(summary.expenses_details || '[]'),
            fixedExpensesDetails: JSON.parse(summary.fixed_expenses_details || '[]'),
            creditCardExpensesDetails: JSON.parse(summary.credit_card_expenses_details || '[]'),
            bankAccountsSummary: JSON.parse(summary.bank_accounts_summary || '[]')
        };
    }

    /**
     * Lista todos os resumos mensais de um usuário
     * @param {number} userId - ID do usuário
     * @returns {Array} - Lista de resumos mensais
     */
    static async listMonthlySummaries(userId) {
        const query = `
            SELECT id, month_year, total_income, total_expenses, total_fixed_expenses,
                   total_credit_card_expenses, balance, created_at
            FROM monthly_summaries
            WHERE user_id = ?
            ORDER BY month_year DESC
        `;
        
        return await db.query(query, [userId]);
    }

    /**
     * Verifica se é necessário gerar o resumo do mês anterior
     * @param {number} userId - ID do usuário
     * @returns {object} - Informações sobre a necessidade de geração
     */
    static async checkMonthlySummaryGeneration(userId) {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthYear = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        
        // Buscar data de criação da conta do usuário
        const userResult = await db.query('SELECT created_at FROM users WHERE id = ?', [userId]);
        if (!userResult || userResult.length === 0) {
            return {
                needsGeneration: false,
                monthYear: lastMonthYear,
                lastMonthName: lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                reason: 'Usuário não encontrado'
            };
        }
        
        const userCreatedAt = new Date(userResult[0].created_at);
        const userCreatedMonth = new Date(userCreatedAt.getFullYear(), userCreatedAt.getMonth(), 1);
        
        // Verificar se o usuário tem pelo menos um mês completo de conta
        // O usuário precisa ter criado a conta antes do início do mês anterior
        if (userCreatedMonth >= lastMonth) {
            return {
                needsGeneration: false,
                monthYear: lastMonthYear,
                lastMonthName: lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                reason: 'Conta muito recente - aguarde pelo menos um mês completo'
            };
        }
        
        // Verificar se já existe resumo para o mês anterior
        const existingSummary = await this.getMonthlySummary(userId, lastMonthYear);
        
        return {
            needsGeneration: !existingSummary,
            monthYear: lastMonthYear,
            lastMonthName: lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            reason: existingSummary ? 'Resumo já existe' : 'Resumo pendente'
        };
    }

    /**
     * Gera resumos para todos os meses pendentes desde a criação da conta
     * @param {number} userId - ID do usuário
     * @param {string} userCreatedAt - Data de criação da conta (YYYY-MM-DD)
     * @returns {object} - Resultado da operação
     */
    static async generateAllPendingSummaries(userId, userCreatedAt) {
        try {
            const createdDate = new Date(userCreatedAt);
            const currentDate = new Date();
            const summaries = [];

            // Gerar resumos para todos os meses desde a criação até o mês anterior
            let currentMonth = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1);
            const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

            while (currentMonth <= lastMonth) {
                const monthYear = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                
                // Verificar se já existe
                const existing = await this.getMonthlySummary(userId, monthYear);
                if (!existing) {
                    const summary = await this.generateAndStoreMonthlySummary(userId, monthYear);
                    if (summary.success) {
                        summaries.push({
                            monthYear,
                            monthName: currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                        });
                    }
                }

                // Avançar para o próximo mês
                currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            }

            return {
                success: true,
                generatedCount: summaries.length,
                summaries
            };
        } catch (error) {
            console.error('Erro ao gerar resumos pendentes:', error);
            return { success: false, message: 'Erro ao gerar resumos pendentes' };
        }
    }
}

module.exports = MonthlySummaryService;
