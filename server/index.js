const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const os = require('os');
require('dotenv').config();

// Gera .env.local do frontend automaticamente ao iniciar o backend
require('./generate-frontend-env');

const authRoutes = require('./routes/auth');
const financialRoutes = require('./routes/financial');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');

const detailedLogger = require('./middleware/detailedLogger');
const { errorLogger, errorLoggerMiddleware } = require('./middleware/errorLogger');
const monthlyDuplicationMiddleware = require('./middleware/monthlyDuplication');

const app = express();
const PORT = process.env.PORT || 5000;

// Função para obter todos os IPs locais da máquina
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(`http://${iface.address}:3000`);
            }
        }
    }
    return ips;
}

// Configurações de segurança
app.use(helmet());

// Rate limiting - DESABILITADO TEMPORARIAMENTE PARA DESENVOLVIMENTO
// const limiter = rateLimit({
//     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
//     max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // mais permissivo em desenvolvimento
//     message: {
//         success: false,
//         message: 'Muitas requisições deste IP, tente novamente mais tarde.'
//     },
//     skip: (req) => {
//         // Pular rate limiting para rotas de health check em desenvolvimento
//         return process.env.NODE_ENV === 'development' && req.path === '/api/health';
//     }
// });
// app.use('/api/', limiter);

// Comentado temporariamente para resolver problema de conexão
console.log('⚠️ Rate limiting desabilitado para desenvolvimento');

// CORS
const corsOptions = {
    origin: true, // Permite qualquer origem
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    const { getCurrentDateTime } = require('./utils/dateUtils');
    console.log(`${getCurrentDateTime()} - ${req.method} ${req.path}`);
    next();
});

// Middleware de logging detalhado
app.use(detailedLogger);

// Middleware de logging de erros
app.use(errorLoggerMiddleware);

// Middleware de duplicação mensal automática
app.use(monthlyDuplicationMiddleware);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema Poupo funcionando!',
        timestamp: require('./utils/dateUtils').getCurrentDateTime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota para visualizar logs de erro (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/logs', (req, res) => {
        const { level, limit = 100 } = req.query;
        const logs = errorLogger.getLogs(level, parseInt(limit));
        res.json({
            success: true,
            logs,
            total: logs.length
        });
    });

    app.delete('/api/logs', (req, res) => {
        errorLogger.clearLogs();
        res.json({
            success: true,
            message: 'Logs limpos com sucesso'
        });
    });

    app.get('/api/logs/export', (req, res) => {
        const exportFile = errorLogger.exportLogs();
        if (exportFile) {
            res.download(exportFile);
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao exportar logs'
            });
        }
    });
}

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Bem-vindo ao Sistema Poupo!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            financial: '/api/financial',
          
            health: '/api/health'
        }
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} (acessível em todas as interfaces de rede)`);
    console.log(`📊 Sistema Poupo iniciado com sucesso!`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
});

// Tratamento de sinais para encerramento graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido, encerrando servidor...');
    process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
    console.error('Erro não capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
    process.exit(1);
});
