const jwt = require('jsonwebtoken');
require('dotenv').config();



const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token de acesso não fornecido' 
            });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido ou expirado' 
            });
        }

        // Verificar se o usuário está banido
        const db = require('../config/database');
        const user = await db.get('SELECT is_banned FROM users WHERE id = ?', [decoded.userId]);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }

        if (user.is_banned) {
            return res.status(403).json({ 
                success: false, 
                message: 'Sua conta foi banida. Entre em contato com o administrador.' 
            });
        }

        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido ou expirado' 
        });
    }
};

const optionalAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                // continua sem autenticação
            }
            req.user = decoded;
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = { auth, optionalAuth };
