import React, { useState, useEffect } from 'react';
import { Download, Trash2, Eye } from 'lucide-react';

const ErrorLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [showDetails, setShowDetails] = useState({});

    useEffect(() => {
        if (window.errorLogger) {
            setLogs(window.errorLogger.getLogs());
        }
    }, []);

    const refreshLogs = () => {
        if (window.errorLogger) {
            setLogs(window.errorLogger.getLogs());
        }
    };

    const clearLogs = () => {
        if (window.errorLogger) {
            window.errorLogger.clearLogs();
            setLogs([]);
        }
    };

    const exportLogs = () => {
        if (window.errorLogger) {
            window.errorLogger.exportLogs();
        }
    };

    const showLogsInConsole = () => {
        if (window.errorLogger) {
            window.errorLogger.showLogsInConsole();
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'ALL') return true;
        return log.level === filter;
    });

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR':
            case 'API_ERROR':
            case 'EXPENSE_ERROR':
                return 'text-red-600 bg-red-50';
            case 'PROMISE_ERROR':
                return 'text-orange-600 bg-orange-50';
            case 'VALIDATION_ERROR':
                return 'text-yellow-600 bg-yellow-50';
            case 'CONSOLE_ERROR':
                return 'text-red-500 bg-red-50';
            case 'CONSOLE_WARN':
                return 'text-yellow-500 bg-yellow-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('pt-BR');
    };

    const toggleDetails = (logId) => {
        setShowDetails(prev => ({
            ...prev,
            [logId]: !prev[logId]
        }));
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📋 Logs de Erro Detalhados
                    </h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={refreshLogs}
                            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Atualizar
                        </button>
                        <button
                            onClick={showLogsInConsole}
                            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={exportLogs}
                            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={clearLogs}
                            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filtrar por tipo:
                    </label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Todos os logs</option>
                        <option value="ERROR">Erros gerais</option>
                        <option value="API_ERROR">Erros de API</option>
                        <option value="EXPENSE_ERROR">Erros de gastos</option>
                        <option value="VALIDATION_ERROR">Erros de validação</option>
                        <option value="PROMISE_ERROR">Erros de promessa</option>
                        <option value="CONSOLE_ERROR">Console.error</option>
                        <option value="CONSOLE_WARN">Console.warn</option>
                    </select>
                </div>

                <div className="space-y-4">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhum log encontrado
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                                            {log.level}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => toggleDetails(log.id)}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        {showDetails[log.id] ? 'Ocultar' : 'Detalhes'}
                                    </button>
                                </div>
                                
                                <div className="mt-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        {log.message}
                                    </h3>
                                </div>

                                {showDetails[log.id] && (
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                URL:
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                                                {log.url}
                                            </p>
                                        </div>

                                        {log.data && Object.keys(log.data).length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Dados:
                                                </h4>
                                                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-64">
                                                    {JSON.stringify(log.data, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 text-sm text-gray-500 text-center">
                    Total de logs: {filteredLogs.length} / {logs.length}
                </div>
            </div>
        </div>
    );
};

export default ErrorLogViewer;
