const MonthlyExpenseDuplicationService = require('../services/monthlyExpenseDuplicationService');

/**
 * Middleware para executar duplicação mensal automaticamente
 * Verifica se é dia 1 e executa a duplicação se necessário
 */
const monthlyDuplicationMiddleware = async (req, res, next) => {
  try {
    // Só executa em rotas autenticadas e se for dia 1
    if (req.user && MonthlyExpenseDuplicationService.isFirstDayOfMonth()) {
      const currentDate = new Date();
      const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Verificar se já foi executada hoje
      const alreadyExecuted = await MonthlyExpenseDuplicationService.isMonthlyDuplicationExecuted(currentMonthYear);
      
      if (!alreadyExecuted) {
        console.log('🔄 Executando duplicação mensal automática...');
        
        // Executar em background para não bloquear a requisição
        setImmediate(async () => {
          try {
            const result = await MonthlyExpenseDuplicationService.executeMonthlyDuplication();
            if (result.success) {
              console.log(`✅ Duplicação mensal concluída: ${result.totalDuplicated} despesas duplicadas`);
            } else {
              console.error('❌ Erro na duplicação mensal:', result.message);
            }
          } catch (error) {
            console.error('❌ Erro na duplicação mensal automática:', error);
          }
        });
      }
    }
  } catch (error) {
    // Não bloquear a requisição se houver erro na duplicação
    console.error('❌ Erro no middleware de duplicação mensal:', error);
  }
  
  next();
};

module.exports = monthlyDuplicationMiddleware;
