// Sistema de logs de erro detalhado para o frontend
class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100; // Manter apenas os últimos 100 logs
        this.setupGlobalErrorHandling();
    }

    // Configurar captura global de erros
    setupGlobalErrorHandling() {
        // Capturar erros não tratados
        window.addEventListener('error', (event) => {
            this.log('ERROR', 'Erro não tratado', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Capturar promessas rejeitadas
        window.addEventListener('unhandledrejection', (event) => {
            this.log('PROMISE_ERROR', 'Promessa rejeitada não tratada', {
                reason: event.reason,
                promise: event.promise,
                timestamp: new Date().toISOString()
            });
        });

        // Interceptar console.error
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.log('CONSOLE_ERROR', 'Console.error chamado', {
                message: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' '),
                args: args,
                timestamp: new Date().toISOString()
            });
            originalConsoleError.apply(console, args);
        };

        // Interceptar console.warn
        const originalConsoleWarn = console.warn;
        console.warn = (...args) => {
            this.log('CONSOLE_WARN', 'Console.warn chamado', {
                message: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' '),
                args: args,
                timestamp: new Date().toISOString()
            });
            originalConsoleWarn.apply(console, args);
        };
    }

    // Logar uma mensagem
    log(level, message, data = {}) {
        const logEntry = {
            id: Date.now() + Math.random(),
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logs.push(logEntry);

        // Manter apenas os últimos logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Salvar no localStorage para persistência
        this.saveToStorage();

        // Log no console para debug
        console.log(`[${level}] ${message}`, data);
    }

    // Log específico para erros de API
    logApiError(endpoint, method, requestData, response, error) {
        this.log('API_ERROR', `Erro na requisição ${method} ${endpoint}`, {
            endpoint,
            method,
            requestData,
            response: {
                status: response?.status,
                statusText: response?.statusText,
                data: response?.data,
                headers: response?.headers
            },
            error: {
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            },
            timestamp: new Date().toISOString()
        });
    }

    // Log específico para erros de validação
    logValidationError(field, value, validationRule) {
        this.log('VALIDATION_ERROR', `Erro de validação no campo ${field}`, {
            field,
            value,
            validationRule,
            timestamp: new Date().toISOString()
        });
    }

    // Salvar logs no localStorage
    saveToStorage() {
        try {
            localStorage.setItem('errorLogs', JSON.stringify(this.logs));
        } catch (error) {
            console.warn('Não foi possível salvar logs no localStorage:', error);
        }
    }

    // Carregar logs do localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('errorLogs');
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Não foi possível carregar logs do localStorage:', error);
        }
    }

    // Obter todos os logs
    getLogs() {
        return [...this.logs];
    }

    // Obter logs por nível
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    // Limpar logs
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('errorLogs');
    }

    // Exportar logs
    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Mostrar logs no console de forma organizada
    showLogsInConsole() {
        console.group('📋 Logs de Erro Detalhados');
        this.logs.forEach((log, index) => {
            console.group(`[${index + 1}] ${log.level} - ${log.message}`);
            console.log('Timestamp:', log.timestamp);
            console.log('URL:', log.url);
            console.log('Data:', log.data);
            console.groupEnd();
        });
        console.groupEnd();
    }
}

// Criar instância global
const errorLogger = new ErrorLogger();

// Carregar logs salvos
errorLogger.loadFromStorage();

// Expor no window para acesso global
window.errorLogger = errorLogger;

export default errorLogger;
