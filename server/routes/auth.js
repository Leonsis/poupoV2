const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Registro de usuário
router.post('/register', [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('birth_date').optional().isISO8601().withMessage('Data de nascimento inválida'),
    body('phone').optional(), // Aceita qualquer valor, sem validação de formato
    body('gross_salary').optional().isFloat({ min: 0 }).withMessage('Salário deve ser um valor positivo')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, password, birth_date, phone, gross_salary } = req.body;

        // Verificar se o email já existe
        const existingUser = await db.get(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        // Criptografar senha
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Garantir que a data seja armazenada no formato correto
        let formattedBirthDate = birth_date;
        if (birth_date) {
            formattedBirthDate = new Date(birth_date + 'T00:00:00').toISOString().split('T')[0];
        }
        
        // Inserir usuário
        const result = await db.run(
            `INSERT INTO users (name, email, password_hash, birth_date, phone, gross_salary)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, passwordHash, formattedBirthDate, phone, gross_salary || 0]
        );

        const userId = result.id;

        // Buscar usuário criado
        const user = await db.get(
            'SELECT id, name, email, birth_date, phone, gross_salary, created_at FROM users WHERE id = ?',
            [userId]
        );

        // Criar conta bancária padrão
        await db.run(
            'INSERT INTO bank_accounts (user_id, account_name, account_type, balance) VALUES (?, ?, ?, ?)',
            [userId, 'Conta Principal', 'corrente', 0]
        );

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura_aqui_2024',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                birth_date: user.birth_date,
                phone: user.phone,
                gross_salary: user.gross_salary
            },
            token
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Login de usuário
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuário pelo email
        const user = await db.get(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos'
            });
        }

        // Verificar se o usuário está banido
        if (user.is_banned) {
            return res.status(403).json({
                success: false,
                message: 'Sua conta foi banida. Entre em contato com o administrador.'
            });
        }



        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos'
            });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura_aqui_2024',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Registrar IP de acesso
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await db.run('INSERT INTO user_login_logs (user_id, ip) VALUES (?, ?)', [user.id, ip]);

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                birth_date: user.birth_date,
                phone: user.phone,
                gross_salary: user.gross_salary,
                dark_mode: user.dark_mode
            },
            token
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Verificar token
router.get('/verify', auth, async (req, res) => {
    try {
        const user = await db.get(
            'SELECT id, name, email, birth_date, phone, gross_salary, dark_mode, created_at, is_banned FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Verificar se o usuário está banido
        if (user.is_banned) {
            return res.status(403).json({
                success: false,
                message: 'Sua conta foi banida. Entre em contato com o administrador.'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Atualizar preferências do usuário
router.put('/preferences', auth, [
    body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('birth_date').optional().isISO8601().withMessage('Data de nascimento inválida'),
    body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Telefone deve ter entre 10 e 15 caracteres'),
    body('dark_mode').optional().isBoolean().withMessage('Modo escuro deve ser um valor booleano'),
    body('gross_salary').optional().isFloat({ min: 0 }).withMessage('Salário deve ser um valor positivo')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, birth_date, phone, dark_mode, gross_salary } = req.body;
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }

        if (birth_date !== undefined) {
            updateFields.push('birth_date = ?');
            // Garantir que a data seja armazenada no formato correto
            const formattedDate = new Date(birth_date + 'T00:00:00').toISOString().split('T')[0];
            updateValues.push(formattedDate);
        }

        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }

        if (dark_mode !== undefined) {
            updateFields.push('dark_mode = ?');
            updateValues.push(dark_mode);
        }

        if (gross_salary !== undefined) {
            updateFields.push('gross_salary = ?');
            updateValues.push(gross_salary);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(req.user.userId);

        await db.run(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Buscar usuário atualizado
        const user = await db.get(
            'SELECT id, name, email, birth_date, phone, gross_salary, dark_mode, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        res.json({
            success: true,
            message: 'Preferências atualizadas com sucesso',
            user
        });

    } catch (error) {
        console.error('Erro ao atualizar preferências:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Exclusão de conta de usuário e dados relacionados
router.delete('/delete-account', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Remover despesas fixas
        await db.run('DELETE FROM fixed_expenses WHERE user_id = ?', [userId]);
        // Remover ganhos
        await db.run('DELETE FROM income WHERE user_id = ?', [userId]);
        // Remover gastos
        await db.run('DELETE FROM expenses WHERE user_id = ?', [userId]);
        // Remover contas bancárias
        await db.run('DELETE FROM bank_accounts WHERE user_id = ?', [userId]);
        // Marcar usuário como excluído (soft delete)
        await db.run('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'Conta e todos os dados relacionados foram excluídos com sucesso.'
        });
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao excluir conta.'
        });
    }
});

module.exports = router;
