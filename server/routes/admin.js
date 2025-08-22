const express = require('express');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Usuário e senha fixos do painel admin
const ADMIN_USER = 'caioleonni';
const ADMIN_PASS = 'Caio22060122';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-panel-secret';

// Endpoint de login do painel admin
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // Gera um token especial para o painel admin
    const token = jwt.sign({ isPanelAdmin: true }, ADMIN_JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
});

// Middleware de autenticação (aplicado após /login)
router.use(auth);

// Middleware para checar se é admin
function isAdmin(req, res, next) {
    console.log('[isAdmin] req.user:', req.user);
    if (req.user && req.user.isPanelAdmin) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso restrito ao administrador.' });
}

// Rotas administrativas
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await require('../config/database').query(`
            SELECT u.id, u.name, u.email, u.is_banned, u.created_at,
            (
                SELECT l.ip FROM user_login_logs l
                WHERE l.user_id = u.id
                ORDER BY l.logged_in_at DESC LIMIT 1
            ) as last_ip
            FROM users u
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, users: users || [], total: (users || []).length });
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' });
    }
});

router.get('/bank-accounts', isAdmin, async (req, res) => {
    try {
        const accounts = await require('../config/database').query('SELECT * FROM bank_accounts');
        res.json({ success: true, accounts, total: accounts.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar contas.' });
    }
});

router.delete('/bank-accounts/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await require('../config/database').run('DELETE FROM bank_accounts WHERE id = ?', [id]);
        res.json({ success: true, message: 'Conta bancária excluída pelo admin.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao excluir conta.' });
    }
});

// Banir usuário
router.patch('/users/:id/ban', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await require('../config/database').run('UPDATE users SET is_banned = 1 WHERE id = ?', [id]);
        res.json({ success: true, message: 'Usuário banido.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao banir usuário.' });
    }
});

// Remover banimento de usuário
router.patch('/users/:id/unban', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await require('../config/database').run('UPDATE users SET is_banned = 0 WHERE id = ?', [id]);
        res.json({ success: true, message: 'Banimento removido.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao remover banimento.' });
    }
});

// Quantidade de usuários cadastrados e ativos
router.get('/users/counts', isAdmin, async (req, res) => {
    try {
        const total = await require('../config/database').get('SELECT COUNT(*) as total FROM users');
        const ativos = await require('../config/database').get('SELECT COUNT(*) as ativos FROM users WHERE is_banned = 0');
        res.json({ 
            success: true, 
            total: total?.total || 0, 
            ativos: ativos?.ativos || 0 
        });
    } catch (error) {
        console.error('Erro ao contar usuários:', error);
        res.status(500).json({ success: false, message: 'Erro ao contar usuários.' });
    }
});

// Registrar acesso de visitante (não logado)
router.post('/guest-access', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await require('../config/database').run('INSERT INTO guest_access_logs (ip) VALUES (?)', [ip]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Consultar número de acessos de visitantes
router.get('/guest-access/count', isAdmin, async (req, res) => {
    try {
        const result = await require('../config/database').get('SELECT COUNT(*) as total FROM guest_access_logs');
        res.json({ success: true, total: result.total });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Listar usuários com IPs de acesso (rota duplicada removida)

module.exports = router;
