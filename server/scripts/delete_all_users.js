const db = require('../config/database');

async function deleteAllUsers() {
    try {
        console.log('🗑️ Iniciando exclusão de todos os usuários...');
        
        // Verificar usuários existentes
        const users = await db.query('SELECT id, email, created_at FROM users');
        console.log(`📋 Usuários encontrados: ${users.length}`);
        
        if (users.length === 0) {
            console.log('ℹ️ Nenhum usuário encontrado para excluir');
            return;
        }
        
        // Mostrar usuários que serão excluídos
        users.forEach(user => {
            console.log(`  - ID ${user.id}: ${user.email} (criado em ${user.created_at})`);
        });
        
        // Excluir todos os usuários (isso também excluirá dados relacionados devido às foreign keys)
        const result = await db.run('DELETE FROM users');
        console.log(`✅ ${result.changes} usuários excluídos com sucesso!`);
        
        // Verificar se ainda existem usuários
        const remainingUsers = await db.query('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Usuários restantes: ${remainingUsers[0].count}`);
        
        console.log('\n🎉 Todos os usuários foram excluídos!');
        console.log('📝 O banco está completamente limpo e pronto para novos testes.');
        
    } catch (error) {
        console.error('❌ Erro ao excluir usuários:', error);
    } finally {
        process.exit(0);
    }
}

deleteAllUsers();
