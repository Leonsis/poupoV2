const jwt = require('jsonwebtoken');
require('dotenv').config();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-panel-secret';

const auth = (req, res, next) => {
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
            // Tenta decodificar com o segredo do painel admin
            try {
                jwt.verify(token, ADMIN_JWT_SECRET);
                req.user = { isPanelAdmin: true };
            } catch (err2) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Token inválido ou expirado' 
                });
            }
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
                try {
                    decoded = jwt.verify(token, ADMIN_JWT_SECRET);
                } catch (err2) {
                    // continua sem autenticação
                }
            }
            req.user = decoded;
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = { auth, optionalAuth };
