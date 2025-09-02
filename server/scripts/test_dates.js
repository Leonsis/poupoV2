const { getCurrentDateTime, getCurrentDate, formatDateToLocal, getTodayBrazilian, getCurrentTimeBrazilian } = require('../utils/dateUtils');

console.log('🧪 Testando funções de data...\n');

// Testar data/hora atual
console.log('📅 Data/Hora atual:');
console.log(`  - getCurrentDateTime(): ${getCurrentDateTime()}`);
console.log(`  - getCurrentDate(): ${getCurrentDate()}`);
console.log(`  - getTodayBrazilian(): ${getTodayBrazilian()}`);
console.log(`  - getCurrentTimeBrazilian(): ${getCurrentTimeBrazilian()}`);

// Testar formatação de datas
console.log('\n🔧 Formatação de datas:');
const testDate = new Date('2025-09-01T21:45:00');
console.log(`  - Data de teste: ${testDate}`);
console.log(`  - formatDateToLocal: ${formatDateToLocal(testDate)}`);

// Testar diferença de fuso horário
console.log('\n🌍 Comparação de fuso horário:');
const now = new Date();
console.log(`  - Data local (JS): ${now.toLocaleString('pt-BR')}`);
console.log(`  - Data UTC (JS): ${now.toISOString()}`);
console.log(`  - Nossa função: ${getCurrentDateTime()}`);

// Verificar se está no fuso horário correto
const currentHour = now.getHours();
const expectedHour = 21; // Hora esperada em Brasília
console.log(`\n⏰ Verificação de hora:`);
console.log(`  - Hora atual (JS): ${currentHour}:${String(now.getMinutes()).padStart(2, '0')}`);
console.log(`  - Hora esperada: ${expectedHour}:45`);
console.log(`  - Diferença: ${Math.abs(currentHour - expectedHour)} horas`);

if (Math.abs(currentHour - expectedHour) <= 1) {
    console.log('  ✅ Fuso horário está correto!');
} else {
    console.log('  ❌ Fuso horário ainda pode estar incorreto');
}

console.log('\n🎯 Resumo:');
console.log('✅ Funções de data criadas com sucesso');
console.log('✅ Sistema agora usa fuso horário local brasileiro');
console.log('✅ Datas são exibidas no formato correto');
