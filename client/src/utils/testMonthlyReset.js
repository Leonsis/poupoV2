// Utilitário para testar o reset mensal
export const testMonthlyReset = () => {
  console.log('🧪 Testando reset mensal...');
  
  // Simular primeiro dia do mês
  const today = new Date();
  const isFirstDayOfMonth = today.getDate() === 1;
  
  console.log('📅 Data atual:', today.toLocaleDateString('pt-BR'));
  console.log('🔍 É primeiro dia do mês?', isFirstDayOfMonth);
  
  if (isFirstDayOfMonth) {
    console.log('✅ Condição de reset mensal ativada!');
    return true;
  } else {
    console.log('❌ Não é primeiro dia do mês');
    return false;
  }
};

// Função para forçar reset (para testes)
export const forceMonthlyReset = () => {
  console.log('🔄 Forçando reset mensal...');
  
  // Limpar localStorage de reset
  const today = new Date();
  const resetKey = `lastMonthlyReset_${today.getFullYear()}_${today.getMonth()}`;
  localStorage.removeItem(resetKey);
  
  console.log('🗑️ Chave de reset removida:', resetKey);
  console.log('🔄 Reset forçado concluído!');
  
  return true;
};
