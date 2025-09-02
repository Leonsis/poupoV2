// Simular como o frontend interpreta as datas recebidas do backend
console.log('🧪 Testando interpretação de datas no frontend...\n');

// Simular as datas que o backend retorna
const backendDates = [
    '2025-09-02 00:20:59',
    '2025-09-02 00:14:53',
    '2025-09-01 22:38:17'
];

console.log('📅 Datas recebidas do backend:');
backendDates.forEach((dateString, index) => {
    console.log(`${index + 1}. ${dateString}`);
});

console.log('\n🔍 Como o JavaScript interpreta essas datas:');
backendDates.forEach((dateString, index) => {
    const date = new Date(dateString);
    console.log(`${index + 1}. "${dateString}" → ${date.toLocaleString('pt-BR')}`);
    console.log(`   - ISO: ${date.toISOString()}`);
    console.log(`   - UTC: ${date.toUTCString()}`);
    console.log(`   - Local: ${date.toString()}`);
    console.log('');
});

console.log('🌍 Comparação com horário atual:');
const now = new Date();
console.log(`  - Agora (JS): ${now.toLocaleString('pt-BR')}`);
console.log(`  - Agora (ISO): ${now.toISOString()}`);

console.log('\n💡 Problema identificado:');
console.log('  - O backend retorna: "2025-09-02 00:20:59"');
console.log('  - O JavaScript interpreta como UTC, não como local');
console.log('  - Resultado: 3 horas de diferença (UTC vs. Brasil)');

console.log('\n🔧 Solução:');
console.log('  - O backend já está correto (usando fuso horário local)');
console.log('  - O frontend precisa interpretar as datas como locais, não UTC');
console.log('  - Vou corrigir a função formatDate no Admin.js');
