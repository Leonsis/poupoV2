const db = require('../config/database');

class FixedExpenseTransitionService {
  /**
   * Verifica se é necessário fazer a transição mensal
   * @param {number} userId - ID do usuário
   * @returns {boolean} - true se precisa fazer transição
   */
  static async needsMonthlyTransition(userId) {
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const query = `
      SELECT COUNT(*) as count 
      FROM fixed_expenses 
      WHERE user_id = ? 
      AND transition_month_year IS NULL 
      AND is_overdue = 0
    `;
    
    const result = await db.get(query, [userId]);
    return result.count > 0;
  }

  /**
   * Executa a transição mensal das despesas fixas
   * @param {number} userId - ID do usuário
   * @returns {Object} - Resultado da transição
   */
  static async executeMonthlyTransition(userId) {
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    try {
      await db.run('BEGIN TRANSACTION');

      // 1. Marcar despesas pagas como resetadas (não pagas) para o novo mês
      await db.run(`
        UPDATE fixed_expenses 
        SET is_paid = 0, 
            transition_month_year = ?
        WHERE user_id = ? 
        AND is_paid = 1 
        AND is_overdue = 0
      `, [currentMonthYear, userId]);

      // 2. Para despesas não pagas, criar duplicatas para o novo mês
      const unpaidExpenses = await db.all(`
        SELECT * FROM fixed_expenses 
        WHERE user_id = ? 
        AND is_paid = 0 
        AND is_overdue = 0
        AND transition_month_year IS NULL
      `, [userId]);

      for (const expense of unpaidExpenses) {
        // Marcar a despesa original como vencida
        await db.run(`
          UPDATE fixed_expenses 
          SET is_overdue = 1, 
              transition_month_year = ?
          WHERE id = ?
        `, [currentMonthYear, expense.id]);

        // Criar nova despesa para o próximo mês
        await db.run(`
          INSERT INTO fixed_expenses (
            user_id, description, amount, due_date, is_paid, 
            bank_account_id, category, is_boleto, total_installments, 
            paid_installments, is_overdue, original_fixed_expense_id, transition_month_year
          ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 0, ?, ?)
        `, [
          expense.user_id,
          expense.description,
          expense.amount,
          expense.due_date,
          expense.bank_account_id,
          expense.category,
          expense.is_boleto,
          expense.total_installments,
          expense.paid_installments,
          expense.id,
          currentMonthYear
        ]);
      }

      await db.run('COMMIT');
      
      return {
        success: true,
        message: 'Transição mensal executada com sucesso',
        processedExpenses: unpaidExpenses.length
      };

    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Erro na transição mensal:', error);
      throw error;
    }
  }

  /**
   * Registra o pagamento de uma despesa fixa vencida
   * @param {number} expenseId - ID da despesa
   * @param {number} bankAccountId - ID da conta bancária
   * @returns {Object} - Resultado do pagamento
   */
  static async payOverdueExpense(expenseId, bankAccountId) {
    try {
      await db.run('BEGIN TRANSACTION');

      // Buscar a despesa vencida
      const expense = await db.get(`
        SELECT * FROM fixed_expenses WHERE id = ?
      `, [expenseId]);

      if (!expense || !expense.is_overdue) {
        throw new Error('Despesa não encontrada ou não está vencida');
      }

      // Marcar como paga
      const paymentDate = new Date().toISOString().split('T')[0];
      await db.run(`
        UPDATE fixed_expenses 
        SET is_paid = 1, 
            bank_account_id = ?
        WHERE id = ?
      `, [bankAccountId, expenseId]);

      // Criar um gasto correspondente no mês atual
      await db.run(`
        INSERT INTO expenses (
          user_id, amount, expense_date, payment_method, 
          description, category, bank_account_id
        ) VALUES (?, ?, ?, 'debito', ?, ?, ?)
      `, [
        expense.user_id,
        expense.amount,
        paymentDate,
        expense.description,
        expense.category,
        bankAccountId
      ]);

      // Atualizar o saldo da conta bancária
      await db.run(`
        UPDATE bank_accounts 
        SET balance = balance - ? 
        WHERE id = ?
      `, [expense.amount, bankAccountId]);

      await db.run('COMMIT');

      return {
        success: true,
        message: 'Despesa vencida paga com sucesso',
        expense: expense
      };

    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Erro ao pagar despesa vencida:', error);
      throw error;
    }
  }

  /**
   * Busca despesas fixas com informações de transição mensal
   * @param {number} userId - ID do usuário
   * @returns {Array} - Lista de despesas fixas
   */
  static async getFixedExpensesWithTransition(userId) {
    const query = `
      SELECT 
        fe.*,
        ba.account_name,
        CASE 
          WHEN fe.is_overdue = 1 THEN 'Vencida'
          WHEN fe.is_paid = 1 THEN 'Paga'
          ELSE 'Pendente'
        END as status
      FROM fixed_expenses fe
      LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
      WHERE fe.user_id = ?
      ORDER BY 
        fe.is_overdue DESC,
        fe.is_paid ASC,
        fe.due_date ASC
    `;

    return await db.all(query, [userId]);
  }

  /**
   * Verifica se há despesas vencidas
   * @param {number} userId - ID do usuário
   * @returns {number} - Quantidade de despesas vencidas
   */
  static async getOverdueExpensesCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM fixed_expenses 
      WHERE user_id = ? AND is_overdue = 1
    `;
    
    const result = await db.get(query, [userId]);
    return result.count;
  }
}

module.exports = FixedExpenseTransitionService;
