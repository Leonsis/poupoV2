import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useFinancial } from './FinancialContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { resetData } = useFinancial();

  // Sistema de notificações customizado
  const addNotification = (type, message) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message) => addNotification('success', message);
  const showError = (message) => addNotification('error', message);
  const showWarning = (message) => addNotification('warning', message);
  const showInfo = (message) => addNotification('info', message);

  useEffect(() => {
    // Verificar token ao inicializar
    if (token) {
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user: userData, token: userToken } = response.data;
        
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        resetData(); // Limpa dados financeiros antes de carregar os do novo usuário
        
        showSuccess('Login realizado com sucesso!');
        navigate('/dashboard');
        
        return { success: true };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.message || 'Erro ao fazer login';
      showError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { user: newUser, token: userToken } = response.data;
        
        setUser(newUser);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        resetData(); // Limpa dados financeiros antes de carregar os do novo usuário
        
        showSuccess('Conta criada com sucesso!');
        navigate('/dashboard');
        
        return { success: true };
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      // Captura erros detalhados do backend (array of errors)
      const errorsArray = error.response?.data?.errors;
      if (errorsArray && errorsArray.length > 0) {
        // Monta mensagem detalhada para o usuário
        const detailedMessage = errorsArray.map(e => e.msg).join(' | ');
        showError(detailedMessage);
        return { success: false, message: detailedMessage };
      }
      const message = error.response?.data?.message || 'Erro ao criar conta';
      showError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    resetData(); // Limpa dados financeiros ao sair
    navigate('/');
    showSuccess('Logout realizado com sucesso!');
  };

  const updateUserPreferences = async (preferences) => {
    try {
      const response = await api.put('/auth/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(prev => ({ ...prev, ...response.data.user }));
        showSuccess('Preferências atualizadas com sucesso!');
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      const message = error.response?.data?.message || 'Erro ao atualizar preferências';
      showError(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserPreferences,
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
