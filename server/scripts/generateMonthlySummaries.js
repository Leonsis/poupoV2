const MonthlySummaryService = require('../services/monthlySummaryService');
const db = require('../config/database');

/**
 * Script para gerar resumos mensais automaticamente
 * Este script pode ser executado via cron job no final de cada mês
 */
async function generateMonthlySummaries() {
    try {
        console.log('🔄 Iniciando geração automática de resumos mensais...');
        
            // Buscar todos os usuários
    const users = await db.query('SELECT id, created_at FROM users');
        console.log(`📊 Encontrados ${users.length} usuários ativos`);
        
        let totalGenerated = 0;
        let totalErrors = 0;
        
        for (const user of users) {
            try {
                console.log(`👤 Processando usuário ID: ${user.id}`);
                
                // Verificar se precisa gerar resumo do mês anterior
                const checkResult = await MonthlySummaryService.checkMonthlySummaryGeneration(user.id);
                
                if (checkResult.needsGeneration) {
                    console.log(`📅 Gerando resumo para ${checkResult.lastMonthName}...`);
                    
                    const result = await MonthlySummaryService.generateAndStoreMonthlySummary(
                        user.id, 
                        checkResult.monthYear
                    );
                    
                    if (result.success) {
                        console.log(`✅ Resumo gerado com sucesso para ${checkResult.lastMonthName}`);
                        totalGenerated++;
                    } else {
                        console.log(`❌ Erro ao gerar resumo: ${result.message}`);
                        totalErrors++;
                    }
                } else {
                    console.log(`ℹ️ Resumo já existe para ${checkResult.lastMonthName}`);
                }
                
            } catch (error) {
                console.error(`❌ Erro ao processar usuário ${user.id}:`, error.message);
                totalErrors++;
            }
        }
        
        console.log('\n📈 Resumo da execução:');
        console.log(`✅ Resumos gerados: ${totalGenerated}`);
        console.log(`❌ Erros: ${totalErrors}`);
        console.log(`👥 Usuários processados: ${users.length}`);
        
        return {
            success: true,
            totalGenerated,
            totalErrors,
            totalUsers: users.length
        };
        
    } catch (error) {
        console.error('💥 Erro fatal na geração de resumos:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Função para gerar resumos pendentes para todos os usuários
 * Útil para gerar resumos de meses anteriores
 */
async function generateAllPendingSummaries() {
    try {
        console.log('🔄 Iniciando geração de todos os resumos pendentes...');
        
        const users = await db.query('SELECT id, created_at FROM users');
        console.log(`📊 Encontrados ${users.length} usuários ativos`);
        
        let totalGenerated = 0;
        let totalErrors = 0;
        
        for (const user of users) {
            try {
                console.log(`👤 Processando usuário ID: ${user.id}`);
                
                const result = await MonthlySummaryService.generateAllPendingSummaries(
                    user.id, 
                    user.created_at
                );
                
                if (result.success) {
                    console.log(`✅ ${result.generatedCount} resumos gerados para usuário ${user.id}`);
                    totalGenerated += result.generatedCount;
                } else {
                    console.log(`❌ Erro ao gerar resumos para usuário ${user.id}: ${result.message}`);
                    totalErrors++;
                }
                
            } catch (error) {
                console.error(`❌ Erro ao processar usuário ${user.id}:`, error.message);
                totalErrors++;
            }
        }
        
        console.log('\n📈 Resumo da execução:');
        console.log(`✅ Total de resumos gerados: ${totalGenerated}`);
        console.log(`❌ Erros: ${totalErrors}`);
        console.log(`👥 Usuários processados: ${users.length}`);
        
        return {
            success: true,
            totalGenerated,
            totalErrors,
            totalUsers: users.length
        };
        
    } catch (error) {
        console.error('💥 Erro fatal na geração de resumos pendentes:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Executar se o script for chamado diretamente
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'pending') {
        generateAllPendingSummaries()
            .then(result => {
                console.log('🎉 Script finalizado!');
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                console.error('💥 Erro inesperado:', error);
                process.exit(1);
            });
    } else {
        generateMonthlySummaries()
            .then(result => {
                console.log('🎉 Script finalizado!');
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                console.error('💥 Erro inesperado:', error);
                process.exit(1);
            });
    }
}

module.exports = {
    generateMonthlySummaries,
    generateAllPendingSummaries
};
