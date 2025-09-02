const db = require('../config/database');

class FixedExpenseTransitionService {
  /**
   * Verifica se é necessário fazer a transição mensal
   * @param {number} userId - ID do usuário
   * @returns {boolean} - true se precisa fazer transição
   */
  static async needsMonthlyTransition(userId) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    console.log(`🔍 Verificando necessidade de transição mensal - Data atual: ${currentDate.toLocaleDateString('pt-BR')} (dia ${currentDay})`);
    
    // Buscar despesas que realmente vencem hoje ou já venceram
    const query = `
      SELECT COUNT(*) as count 
      FROM fixed_expenses 
      WHERE user_id = ? 
      AND month_year IS NULL 
      AND is_paid = 0
      AND is_overdue = 0
      AND CAST(due_date AS INTEGER) <= ?
    `;
    
    const result = await db.get(query, [userId, currentDay]);
    
    console.log(`📋 Despesas que precisam de transição: ${result.count}`);
    
    return result.count > 0;
  }

  /**
   * Executa a transição mensal das despesas fixas
   * @param {number} userId - ID do usuário
   * @returns {Object} - Resultado da transição
   */
  static async executeMonthlyTransition(userId) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    console.log(`🔄 Executando transição mensal - Data atual: ${currentDate.toLocaleDateString('pt-BR')} (dia ${currentDay})`);
    
    try {
      await db.run('BEGIN TRANSACTION');

      // 1. Marcar despesas pagas como resetadas (não pagas) para o novo mês
      await db.run(`
        UPDATE fixed_expenses 
        SET is_paid = 0, 
            month_year = ?
        WHERE user_id = ? 
        AND is_paid = 1 
        AND is_overdue = 0
      `, [currentMonthYear, userId]);

      // 2. Para despesas não pagas que realmente venceram, criar duplicatas para o novo mês
      const unpaidExpenses = await db.query(`
        SELECT * FROM fixed_expenses 
        WHERE user_id = ? 
        AND is_paid = 0 
        AND is_overdue = 0
        AND month_year IS NULL
        AND CAST(due_date AS INTEGER) <= ?
      `, [userId, currentDay]);

      console.log(`📋 Processando ${unpaidExpenses.length} despesas vencidas`);

      for (const expense of unpaidExpenses) {
        console.log(`  📅 Processando: ${expense.description} (vence dia ${expense.due_date})`);
        
        // Marcar a despesa original como vencida
        await db.run(`
          UPDATE fixed_expenses 
          SET is_overdue = 1, 
              month_year = ?
          WHERE id = ?
        `, [currentMonthYear, expense.id]);

        const { getCurrentDateTime } = require('../utils/dateUtils');
        const currentDateTime = getCurrentDateTime();
        
        // Criar nova despesa para o próximo mês
        await db.run(`
          INSERT INTO fixed_expenses (
            user_id, description, amount, due_date, is_paid, 
            bank_account_id, category, is_boleto, total_installments, 
            paid_installments, is_overdue, original_expense_id, month_year,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
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
          currentMonthYear,
          currentDateTime,
          currentDateTime
        ]);
      }

      await db.run('COMMIT');
      
      console.log(`✅ Transição mensal concluída - ${unpaidExpenses.length} despesas processadas`);
      
      return {
        success: true,
        message: 'Transição mensal executada com sucesso',
        processedExpenses: unpaidExpenses.length
      };

    } catch (error) {
      await db.run('ROLLBACK');
      console.error('❌ Erro na transição mensal:', error);
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
              const { formatDateToLocal } = require('../utils/dateUtils');
        const paymentDate = formatDateToLocal(new Date());
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
          description, category, bank_account_id, created_at, updated_at
        ) VALUES (?, ?, ?, 'debito', ?, ?, ?, ?, ?)
      `, [
        expense.user_id,
        expense.amount,
        paymentDate,
        expense.description,
        expense.category,
        bankAccountId,
        currentDateTime,
        currentDateTime
      ]);

      // Atualizar o saldo da conta bancária
      await db.run(`
        UPDATE bank_accounts 
        SET balance = balance - ?, updated_at = ? 
        WHERE id = ?
      `, [expense.amount, currentDateTime, bankAccountId]);

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
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    
    console.log(`🔍 Verificando despesas fixas - Data atual: ${currentDate.toLocaleDateString('pt-BR')} (dia ${currentDay})`);
    
    // Buscar todas as despesas primeiro
    const query = `
      SELECT 
        fe.*,
        ba.account_name
      FROM fixed_expenses fe
      LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
      WHERE fe.user_id = ?
      AND (fe.month_year IS NULL OR fe.month_year = 'null' OR fe.month_year = ?)
      ORDER BY fe.due_date ASC
    `;

    const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const expenses = await db.query(query, [userId, currentMonthYear]);
    
    console.log(`📋 Encontradas ${expenses.length} despesas para o usuário ${userId}`);
    
    // Processar cada despesa para determinar o status correto baseado na data atual
    const processedExpenses = expenses.map(expense => {
      let status = 'Pendente';
      
      if (expense.is_paid) {
        status = 'Paga';
      } else {
        // Construir a data de vencimento completa para o mês atual
        const dueDate = new Date(currentYear, currentMonth - 1, expense.due_date);
        const today = new Date(currentYear, currentMonth - 1, currentDay);
        
        console.log(`  📅 ${expense.description}: vence dia ${expense.due_date} (${dueDate.toLocaleDateString('pt-BR')}) vs hoje (${today.toLocaleDateString('pt-BR')})`);
        
        // Se a data de vencimento já passou neste mês
        if (dueDate < today) {
          status = 'Vencida';
          console.log(`    ❌ Status: Vencida (${dueDate.toLocaleDateString('pt-BR')} < ${today.toLocaleDateString('pt-BR')})`);
        } else {
          console.log(`    ✅ Status: Pendente (${dueDate.toLocaleDateString('pt-BR')} >= ${today.toLocaleDateString('pt-BR')})`);
        }
      }
      
      return {
        ...expense,
        status
      };
    });
    
    // Ordenar: vencidas primeiro, depois pendentes, depois pagas
    const sortedExpenses = processedExpenses.sort((a, b) => {
      if (a.status === 'Vencida' && b.status !== 'Vencida') return -1;
      if (a.status !== 'Vencida' && b.status === 'Vencida') return 1;
      if (a.status === 'Pendente' && b.status === 'Paga') return -1;
      if (a.status === 'Paga' && b.status === 'Pendente') return 1;
      return a.due_date - b.due_date;
    });
    
    console.log(`📊 Resumo: ${sortedExpenses.filter(e => e.status === 'Vencida').length} vencidas, ${sortedExpenses.filter(e => e.status === 'Pendente').length} pendentes, ${sortedExpenses.filter(e => e.status === 'Paga').length} pagas`);
    
    return sortedExpenses;
  }

  /**
   * Verifica se uma despesa está vencida baseada na data de vencimento
   * @param {number} dueDate - Dia do vencimento
   * @returns {boolean} - true se está vencida
   */
  static isExpenseOverdue(dueDate) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    
    const dueDateFull = new Date(currentYear, currentMonth - 1, dueDate);
    const today = new Date(currentYear, currentMonth - 1, currentDay);
    
    return dueDateFull < today;
  }

  /**
   * Verifica se há despesas vencidas baseadas na data real
   * @param {number} userId - ID do usuário
   * @returns {number} - Quantidade de despesas vencidas
   */
  static async getOverdueExpensesCount(userId) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    
    console.log(`🔍 Contando despesas vencidas - Data atual: ${currentDate.toLocaleDateString('pt-BR')} (dia ${currentDay})`);
    
    // Buscar todas as despesas não pagas do mês atual
    const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const query = `
      SELECT id, description, due_date
      FROM fixed_expenses 
      WHERE user_id = ? 
      AND is_paid = 0
      AND (month_year IS NULL OR month_year = 'null' OR month_year = ?)
    `;
    
    const expenses = await db.query(query, [userId, currentMonthYear]);
    
    console.log(`📋 Verificando ${expenses.length} despesas não pagas`);
    
    // Contar quantas estão vencidas baseado na data atual
    let overdueCount = 0;
    expenses.forEach(expense => {
      const dueDate = new Date(currentYear, currentMonth - 1, expense.due_date);
      const today = new Date(currentYear, currentMonth - 1, currentDay);
      
      console.log(`  📅 ${expense.description}: vence dia ${expense.due_date} (${dueDate.toLocaleDateString('pt-BR')}) vs hoje (${today.toLocaleDateString('pt-BR')})`);
      
      if (dueDate < today) {
        overdueCount++;
        console.log(`    ❌ Vencida: ${dueDate.toLocaleDateString('pt-BR')} < ${today.toLocaleDateString('pt-BR')}`);
      } else {
        console.log(`    ✅ Pendente: ${dueDate.toLocaleDateString('pt-BR')} >= ${today.toLocaleDateString('pt-BR')}`);
      }
    });
    
    console.log(`📊 Total de despesas vencidas: ${overdueCount}`);
    
    return overdueCount;
  }
}

module.exports = FixedExpenseTransitionService;
