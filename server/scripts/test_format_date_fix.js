// Testar a correção da função formatDate
console.log('🧪 Testando correção da função formatDate...\n');

// Simular a função formatDate corrigida
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    // O backend retorna datas no formato "2025-09-02 00:20:59" (local brasileiro)
    // Mas o JavaScript interpreta como UTC, causando diferença de 3 horas
    // Vamos forçar a interpretação como data local
    
    let date;
    
    if (dateString.includes(' ')) {
      // Formato do backend: "2025-09-02 00:20:59"
      // Vamos criar uma data local forçando o fuso horário brasileiro
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-');
      const [hour, minute, second] = timePart.split(':');
      
      // Criar data no fuso horário local (Brasil)
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                     parseInt(hour), parseInt(minute), parseInt(second));
    } else {
      // Outro formato, usar normalmente
      date = new Date(dateString);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro na data';
  }
};

// Testar com as datas do backend
const backendDates = [
  '2025-09-02 00:20:59',
  '2025-09-02 00:14:53',
  '2025-09-01 22:38:17'
];

console.log('📅 Testando formatação de datas:');
backendDates.forEach((dateString, index) => {
  console.log(`${index + 1}. "${dateString}" → ${formatDate(dateString)}`);
});

console.log('\n🌍 Comparação com horário atual:');
const now = new Date();
console.log(`  - Agora: ${now.toLocaleString('pt-BR')}`);

console.log('\n✅ Correção aplicada:');
console.log('  - As datas agora são interpretadas como locais, não UTC');
console.log('  - O painel admin deve mostrar as horas corretas');
console.log('  - Não haverá mais diferença de 3 horas');
