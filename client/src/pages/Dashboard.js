import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFinancial } from '../contexts/FinancialContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { Button, Card, NotificationContainer, useNotifications } from '../components/ui';
import { 
  Menu, 
  X, 
  User, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  BarChart3, 
  LogOut,
  Sun,
  Moon,
  PiggyBank,
  Eye,
  EyeOff
} from 'lucide-react';

// Componentes das páginas
import UserProfile from '../components/dashboard/UserProfile';
import IncomeForm from '../components/dashboard/IncomeForm';
import ExpenseForm from '../components/dashboard/ExpenseForm';
import FixedExpenses from '../components/dashboard/FixedExpenses';
import FinancialOverview from '../components/dashboard/FinancialOverview';
import BankAccounts from '../components/dashboard/BankAccounts';
import BankSyncForm from './BankSyncForm';

import DetailedSummaries from '../components/dashboard/DetailedSummaries';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { loadInitialData, hasLoadedInitialData } = useFinancial();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Escutar eventos de notificação do AuthContext
  React.useEffect(() => {
    const handleNotification = (event) => {
      const { type, message } = event.detail;
      if (type === 'success') {
        showSuccess(message);
      } else if (type === 'error') {
        showError(message);
      }
    };

    window.addEventListener('showNotification', handleNotification);
    return () => window.removeEventListener('showNotification', handleNotification);
  }, [showSuccess, showError]);

  // Carregar dados financeiros após login
  React.useEffect(() => {
    if (user && !hasLoadedInitialData) {
      loadInitialData();
    }
  }, [user, hasLoadedInitialData, loadInitialData]);



  const menuItems = [
    {
      id: 'profile',
      label: 'Sobre o Usuário',
      icon: <User className="w-5 h-5" />,
      path: '/dashboard/profile'
    },
    {
      id: 'bank-accounts',
      label: 'Contas Bancárias',
      icon: <PiggyBank className="w-5 h-5" />,
      path: '/dashboard/bank-accounts'
    },
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/dashboard/overview'
    },
    {
      id: 'income',
      label: 'Registrar Ganhos',
      icon: <TrendingUp className="w-5 h-5" />,
      path: '/dashboard/income'
    },
    {
      id: 'expenses',
      label: 'Registrar Gastos',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/dashboard/expenses'
    },
    {
      id: 'fixed-expenses',
      label: 'Despesas Fixas',
      icon: <FileText className="w-5 h-5" />,
      path: '/dashboard/fixed-expenses'
    },
    {
      id: 'detailed-summaries',
      label: 'Resumos Detalhados',
      icon: <TrendingUp className="w-5 h-5" />,
      path: '/dashboard/detailed-summaries'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-light shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <Card className="h-16 border-0 rounded-none shadow-none flex-shrink-0">
          <div className="flex items-center justify-center h-full px-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">Poupo</h1>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <nav className="mt-8 px-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Button
                  variant={location.pathname === item.path ? 'primary' : 'ghost'}
                  className={`w-full justify-start h-auto min-h-[44px] py-3 ${location.pathname === item.path ? 'shadow-lg' : ''}`}
                  onClick={() => handleMenuClick(item.path)}
                >
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="ml-3 font-medium text-left leading-tight break-words">{item.label}</span>
                  </div>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Actions */}
        <Card className="m-4 border-0 rounded-lg flex-shrink-0">
          <Card.Content className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-secondary to-secondary-light rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-light truncate">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={toggleTheme}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>

              <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePrivacyMode}
                  title={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}
                  className={isPrivacyMode ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}
                >
                  {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navigation */}
        <Card className="shadow-sm border-0 rounded-none">
          <Card.Content className="py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>

              {/* Page Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-light">
                {getCurrentPageTitle()}
              </h1>

              {/* User Info (Desktop) */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-secondary to-secondary-light rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-light">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || 'email@exemplo.com'}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePrivacyMode}
                  title={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}
                  className={isPrivacyMode ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}
                >
                  {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Page Content */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<FinancialOverview />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/income" element={<IncomeForm />} />
            <Route path="/expenses" element={<ExpenseForm />} />
            <Route path="/fixed-expenses" element={<FixedExpenses />} />
            <Route path="/detailed-summaries" element={<DetailedSummaries />} />
            <Route path="/overview" element={<FinancialOverview />} />
            <Route path="/bank-accounts" element={<BankAccounts />} />
            <Route path="/bank-accounts/import" element={<BankSyncForm />} />
          </Routes>
        </main>
      </div>

    </div>
  );
};

export default Dashboard;
