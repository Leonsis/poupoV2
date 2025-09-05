const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

// Middleware para verificar credenciais de admin
const verifyAdminCredentials = (req, res, next) => {
  const { username, password } = req.headers;
  
  if (username !== 'CLAdmin' || password !== '!@#$%622060122') {
    return res.status(401).json({ error: 'Credenciais administrativas inválidas' });
  }
  
  next();
};

// GET /admin/users - Listar todos os usuários
router.get('/users', verifyAdminCredentials, async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name as username,
        email,
        created_at,
        deleted_at,
        is_banned
      FROM users 
      ORDER BY created_at DESC
    `;
    
    const users = await db.query(query);
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /admin/users/:id/ban - Banir usuário
router.patch('/users/:id/ban', verifyAdminCredentials, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await db.get('SELECT id, name as username FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Banir o usuário
    await db.run('UPDATE users SET is_banned = 1 WHERE id = ?', [id]);
    
    res.json({ message: `Usuário ${user.username} foi banido com sucesso` });
  } catch (error) {
    console.error('Erro ao banir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /admin/users/:id/unban - Desbanir usuário
router.patch('/users/:id/unban', verifyAdminCredentials, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await db.get('SELECT id, name as username FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Desbanir o usuário
    await db.run('UPDATE users SET is_banned = 0 WHERE id = ?', [id]);
    
    res.json({ message: `Usuário ${user.username} foi desbanido com sucesso` });
  } catch (error) {
    console.error('Erro ao desbanir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /admin/users/:id - Deletar usuário (soft delete)
router.delete('/users/:id', verifyAdminCredentials, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await db.get('SELECT id, name as username FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Deletar todos os dados relacionados do usuário
    await db.run('DELETE FROM fixed_expenses WHERE user_id = ?', [id]);
    await db.run('DELETE FROM income WHERE user_id = ?', [id]);
    await db.run('DELETE FROM expenses WHERE user_id = ?', [id]);
    await db.run('DELETE FROM bank_accounts WHERE user_id = ?', [id]);
    await db.run('DELETE FROM financial_advice WHERE user_id = ?', [id]);
    await db.run('DELETE FROM monthly_summaries WHERE user_id = ?', [id]);
    
    // Marcar usuário como deletado (soft delete) ao invés de deletar permanentemente
    await db.run('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    
    res.json({ message: `Usuário ${user.username} e todos os seus dados foram deletados. Informações básicas mantidas no painel administrativo.` });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /admin/users/:id/reset-password - Resetar senha do usuário
router.patch('/users/:id/reset-password', verifyAdminCredentials, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await db.get('SELECT id, name as username FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Criptografar nova senha (123456)
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash('123456', saltRounds);
    
    // Atualizar senha do usuário
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, id]);
    
    res.json({ 
      message: `Senha do usuário ${user.username} foi resetada para 123456 com sucesso`,
      newPassword: '123456'
    });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /admin/clear-database - Limpar todos os dados do banco
router.post('/clear-database', verifyAdminCredentials, async (req, res) => {
  try {
    // Limpar todas as tabelas em ordem (respeitando foreign keys)
    await db.run('DELETE FROM fixed_expenses');
    await db.run('DELETE FROM income');
    await db.run('DELETE FROM expenses');
    await db.run('DELETE FROM bank_accounts');
    await db.run('DELETE FROM financial_advice');
    await db.run('DELETE FROM monthly_summaries');
    await db.run('DELETE FROM users');
    
    // Resetar auto-increment
    await db.run('DELETE FROM sqlite_sequence WHERE name IN ("users", "bank_accounts", "income", "expenses", "fixed_expenses", "financial_advice", "monthly_summaries")');
    
    res.json({ 
      message: 'Banco de dados limpo com sucesso! Todos os dados foram removidos.',
      clearedTables: [
        'users',
        'bank_accounts', 
        'income',
        'expenses',
        'fixed_expenses',
        'financial_advice',
        'monthly_summaries'
      ]
    });
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao limpar banco de dados' });
  }
});

// GET /admin/stats - Estatísticas do sistema
router.get('/stats', verifyAdminCredentials, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_banned = 1 THEN 1 END) as banned_users,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_users,
        COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_users_month
      FROM users
    `;
    
    const stats = await db.get(query);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
