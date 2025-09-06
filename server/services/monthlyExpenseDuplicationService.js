const db = require('../config/database');

/**
 * Serviço para duplicação automática de despesas fixas no dia 1 de cada mês
 */
class MonthlyExpenseDuplicationService {
  /**
   * Verifica se é dia 1 do mês
   * @returns {boolean} - true se é dia 1
   */
  static isFirstDayOfMonth() {
    const today = new Date();
    return today.getDate() === 1;
  }

  /**
   * Executa a duplicação automática de despesas fixas para todos os usuários
   * @returns {Object} - Resultado da operação
   */
  static async executeMonthlyDuplication() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    console.log(`🔄 Executando duplicação mensal automática - ${currentDate.toLocaleDateString('pt-BR')}`);
    
    try {
      // Buscar todos os usuários ativos
      const users = await db.query(`
        SELECT id, name, email 
        FROM users 
        WHERE deleted_at IS NULL 
        AND is_banned = 0
      `);
      
      console.log(`👥 Encontrados ${users.length} usuários ativos`);
      
      let totalDuplicated = 0;
      let totalErrors = 0;
      
      for (const user of users) {
        try {
          console.log(`👤 Processando usuário: ${user.name} (ID: ${user.id})`);
          
          const result = await this.duplicateUserExpenses(user.id, currentMonthYear);
          
          if (result.success) {
            console.log(`✅ ${result.duplicatedCount} despesas duplicadas para ${user.name}`);
            totalDuplicated += result.duplicatedCount;
          } else {
            console.log(`❌ Erro para ${user.name}: ${result.message}`);
            totalErrors++;
          }
          
        } catch (error) {
          console.error(`❌ Erro ao processar usuário ${user.name}:`, error.message);
          totalErrors++;
        }
      }
      
      console.log(`\n📊 Resumo da duplicação mensal:`);
      console.log(`✅ Total de despesas duplicadas: ${totalDuplicated}`);
      console.log(`❌ Erros: ${totalErrors}`);
      console.log(`👥 Usuários processados: ${users.length}`);
      
      return {
        success: true,
        totalDuplicated,
        totalErrors,
        totalUsers: users.length,
        monthYear: currentMonthYear
      };
      
    } catch (error) {
      console.error('💥 Erro fatal na duplicação mensal:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Duplica as despesas fixas de um usuário específico
   * @param {number} userId - ID do usuário
   * @param {string} monthYear - Mês/ano no formato YYYY-MM
   * @returns {Object} - Resultado da operação
   */
  static async duplicateUserExpenses(userId, monthYear) {
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Buscar despesas fixas ativas do usuário (não deletadas)
      const activeExpenses = await db.query(`
        SELECT 
          description, amount, due_date, category, 
          is_boleto, total_installments, bank_account_id
        FROM fixed_expenses 
        WHERE user_id = ? 
        AND deleted_at IS NULL
        AND (month_year IS NULL OR month_year = 'null')
        ORDER BY due_date ASC
      `, [userId]);
      
      console.log(`  📋 Encontradas ${activeExpenses.length} despesas ativas`);
      
      let duplicatedCount = 0;
      
      for (const expense of activeExpenses) {
        // Verificar se já existe uma despesa duplicada para este mês
        const existingDuplicate = await db.get(`
          SELECT id FROM fixed_expenses 
          WHERE user_id = ? 
          AND description = ? 
          AND amount = ? 
          AND due_date = ? 
          AND month_year = ?
          AND deleted_at IS NULL
        `, [userId, expense.description, expense.amount, expense.due_date, monthYear]);
        
        if (!existingDuplicate) {
          // Criar nova despesa duplicada
          const { getCurrentDateTime } = require('../utils/dateUtils');
          const currentDateTime = getCurrentDateTime();
          
          await db.run(`
            INSERT INTO fixed_expenses (
              user_id, description, amount, due_date, category,
              is_paid, is_boleto, total_installments, paid_installments,
              bank_account_id, month_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, ?, ?)
          `, [
            userId,
            expense.description,
            expense.amount,
            expense.due_date,
            expense.category,
            expense.is_boleto || 0,
            expense.total_installments || null,
            expense.bank_account_id,
            monthYear,
            currentDateTime,
            currentDateTime
          ]);
          
          duplicatedCount++;
          console.log(`    ✅ Duplicada: ${expense.description} - R$ ${expense.amount}`);
        } else {
          console.log(`    ⏭️ Já existe: ${expense.description} - R$ ${expense.amount}`);
        }
      }
      
      await db.run('COMMIT');
      
      return {
        success: true,
        duplicatedCount,
        message: `${duplicatedCount} despesas duplicadas com sucesso`
      };
      
    } catch (error) {
      await db.run('ROLLBACK');
      console.error(`❌ Erro ao duplicar despesas do usuário ${userId}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Verifica se a duplicação mensal já foi executada para o mês atual
   * @param {string} monthYear - Mês/ano no formato YYYY-MM
   * @returns {boolean} - true se já foi executada
   */
  static async isMonthlyDuplicationExecuted(monthYear) {
    try {
      const result = await db.get(`
        SELECT COUNT(*) as count 
        FROM fixed_expenses 
        WHERE month_year = ? 
        AND created_at >= date('now', 'start of month')
      `, [monthYear]);
      
      return result.count > 0;
    } catch (error) {
      console.error('Erro ao verificar duplicação mensal:', error);
      return false;
    }
  }

  /**
   * Executa a duplicação apenas se for dia 1 e ainda não foi executada
   * @returns {Object} - Resultado da operação
   */
  static async executeIfNeeded() {
    if (!this.isFirstDayOfMonth()) {
      return {
        success: true,
        message: 'Não é dia 1 do mês - duplicação não necessária',
        executed: false
      };
    }
    
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const alreadyExecuted = await this.isMonthlyDuplicationExecuted(currentMonthYear);
    
    if (alreadyExecuted) {
      return {
        success: true,
        message: 'Duplicação mensal já foi executada para este mês',
        executed: false
      };
    }
    
    return await this.executeMonthlyDuplication();
  }
}

module.exports = MonthlyExpenseDuplicationService;
