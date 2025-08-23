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
    
    db.db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar usuários:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      res.json(rows);
    });
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
    db.db.get('SELECT id, name as username FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Banir o usuário
      db.db.run('UPDATE users SET is_banned = 1 WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Erro ao banir usuário:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        res.json({ message: `Usuário ${user.username} foi banido com sucesso` });
      });
    });
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
    db.db.get('SELECT id, name as username FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Desbanir o usuário
      db.db.run('UPDATE users SET is_banned = 0 WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Erro ao desbanir usuário:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        res.json({ message: `Usuário ${user.username} foi desbanido com sucesso` });
      });
    });
  } catch (error) {
    console.error('Erro ao desbanir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
    
    db.db.get(query, [], (err, stats) => {
      if (err) {
        console.error('Erro ao buscar estatísticas:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      res.json(stats);
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
