const fs = require('fs');
const path = require('path');

class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logFile = path.join(__dirname, '..', 'logs', 'error-logs.json');
        this.ensureLogDirectory();
        this.loadLogs();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    loadLogs() {
        try {
            if (fs.existsSync(this.logFile)) {
                const data = fs.readFileSync(this.logFile, 'utf8');
                this.logs = JSON.parse(data);
            }
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
            this.logs = [];
        }
    }

    saveLogs() {
        try {
            fs.writeFileSync(this.logFile, JSON.stringify(this.logs, null, 2));
        } catch (error) {
            console.error('Erro ao salvar logs:', error);
        }
    }

    log(level, message, data = {}) {
        const logEntry = {
            id: Date.now() + Math.random(),
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            processId: process.pid
        };

        this.logs.push(logEntry);

        // Manter apenas os últimos logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Salvar no arquivo
        this.saveLogs();

        // Log no console
        console.log(`[${level}] ${message}`, data);
    }

    logRequestError(req, error, additionalData = {}) {
        this.log('REQUEST_ERROR', 'Erro na requisição', {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
            query: req.query,
            params: req.params,
            user: req.user,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            ...additionalData
        });
    }

    logValidationError(req, errors) {
        this.log('VALIDATION_ERROR', 'Erro de validação', {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            errors: errors.array ? errors.array() : errors,
            user: req.user
        });
    }

    logDatabaseError(operation, error, query = null, params = null) {
        this.log('DATABASE_ERROR', `Erro no banco de dados: ${operation}`, {
            operation,
            query,
            params,
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code
            }
        });
    }

    logApiError(endpoint, method, requestData, response, error) {
        this.log('API_ERROR', `Erro na API ${method} ${endpoint}`, {
            endpoint,
            method,
            requestData,
            response: {
                status: response?.status,
                statusText: response?.statusText,
                data: response?.data
            },
            error: {
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            }
        });
    }

    getLogs(level = null, limit = 100) {
        let filteredLogs = this.logs;
        if (level) {
            filteredLogs = this.logs.filter(log => log.level === level);
        }
        return filteredLogs.slice(-limit);
    }

    clearLogs() {
        this.logs = [];
        this.saveLogs();
    }

    exportLogs() {
        const exportFile = path.join(__dirname, '..', 'logs', `error-logs-export-${new Date().toISOString().split('T')[0]}.json`);
        try {
            fs.writeFileSync(exportFile, JSON.stringify(this.logs, null, 2));
            return exportFile;
        } catch (error) {
            console.error('Erro ao exportar logs:', error);
            return null;
        }
    }
}

// Criar instância global
const errorLogger = new ErrorLogger();

// Middleware para capturar erros
const errorLoggerMiddleware = (req, res, next) => {
    // Capturar erros de validação
    const originalJson = res.json;
    res.json = function(data) {
        if (data && data.success === false && data.errors) {
            errorLogger.logValidationError(req, data.errors);
        }
        return originalJson.call(this, data);
    };

    // Capturar erros não tratados
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 400) {
            errorLogger.logRequestError(req, new Error(`HTTP ${res.statusCode}`), {
                responseData: data,
                statusCode: res.statusCode
            });
        }
        return originalSend.call(this, data);
    };

    next();
};

module.exports = { errorLogger, errorLoggerMiddleware };
