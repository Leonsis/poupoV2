import axios from 'axios';
import { logRequest, logResponse, logError } from '../utils/detailedLogger';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : 'http://localhost:5000') + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    // Adicionar token se existir
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Adicionar credenciais de admin quando necessário
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken && config.url.includes('/admin/')) {
      config.headers.username = 'CLAdmin';
      config.headers.password = '!@#$%622060122';
    }
    
    // Logging detalhado
    logRequest({
      url: config.url,
      method: config.method,
      body: config.data,
      params: config.params,
      query: config.params,
    });
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    logError({
      url: error.config?.url,
      method: error.config?.method,
      error: error.message,
    });
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    const duration = response.config.metadata && response.config.metadata.startTime
      ? new Date() - response.config.metadata.startTime
      : null;
    logResponse({
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      duration,
      response: response.data,
    });
    return response;
  },
  (error) => {
    // Log detalhado do erro usando o errorLogger
    if (window.errorLogger) {
      window.errorLogger.logApiError(
        error.config?.url,
        error.config?.method,
        error.config?.data,
        error.response,
        error
      );
    }
    
    logError({
      url: error.config?.url,
      method: error.config?.method,
      error: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;
