import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Ban, 
  UserCheck, 
  LogOut,
  Eye,
  EyeOff,
  Plus,
  X,
  Trash2,
  Key,
  Database
} from 'lucide-react';
import { Card, Button, useNotifications, Input } from '../components/ui';
import api from '../services/api';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banningUser, setBanningUser] = useState(null);
  const [unbanningUser, setUnbanningUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);
  const [clearingDatabase, setClearingDatabase] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birth_date: '',
    phone: ''
  });
  

  const { showSuccess, showError } = useNotifications();

  // Verificar se já está autenticado
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAuthenticated(true);
      const loadUsers = async () => {
        await fetchUsers();
      };
      loadUsers();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (credentials.username !== 'CLAdmin' || credentials.password !== '!@#$%622060122') {
      showError('Credenciais inválidas!');
      return;
    }

    // Simular token de admin
    localStorage.setItem('adminToken', 'admin-auth-token');
    setIsAuthenticated(true);
    showSuccess('Login realizado com sucesso!');
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
    showSuccess('Logout realizado com sucesso!');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (newUser.password !== newUser.confirmPassword) {
      showError('As senhas não coincidem!');
      return;
    }
    
    if (newUser.password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres!');
      return;
    }
    
    if (!newUser.name.trim() || !newUser.email.trim()) {
      showError('Nome e email são obrigatórios!');
      return;
    }
    
    setCreatingUser(true);
    
    try {
      const response = await api.post('/auth/register', {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        birth_date: newUser.birth_date || null,
        phone: newUser.phone || null,
        gross_salary: 0
      });
      
      if (response.data.success) {
        showSuccess('Usuário criado com sucesso!');
        setShowCreateUserModal(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          birth_date: '',
          phone: ''
        });
        // Recarregar lista de usuários
        await fetchUsers();
      } else {
        showError(response.data.message || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar usuário';
      showError(errorMessage);
    } finally {
      setCreatingUser(false);
    }
  };

  const resetCreateUserForm = () => {
    setNewUser({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      birth_date: '',
      phone: ''
    });
    setShowCreateUserModal(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showError('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, username) => {
    try {
      setBanningUser(userId);
      await api.patch(`/admin/users/${userId}/ban`);
      showSuccess(`Usuário ${username} foi banido com sucesso!`);
      fetchUsers(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      showError('Erro ao banir usuário');
    } finally {
      setBanningUser(null);
    }
  };

  const handleUnbanUser = async (userId, username) => {
    try {
      setUnbanningUser(userId);
      await api.patch(`/admin/users/${userId}/unban`);
      showSuccess(`Usuário ${username} foi desbanido com sucesso!`);
      fetchUsers(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao desbanir usuário:', error);
      showError('Erro ao desbanir usuário');
    } finally {
      setUnbanningUser(null);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    const confirmDelete = window.confirm(
      `⚠️ Deletar Usuário\n\n` +
      `Você está prestes a deletar o usuário "${username}" e TODOS os seus dados:\n` +
      `• Contas bancárias\n` +
      `• Receitas e despesas\n` +
      `• Despesas fixas\n` +
      `• Conselhos financeiros\n` +
      `• Resumos mensais\n\n` +
      `As informações básicas do usuário (nome, email, datas) serão mantidas no painel administrativo para histórico.\n\n` +
      `Tem certeza que deseja continuar?`
    );
    
    if (!confirmDelete) return;
    
    setDeletingUser(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      showSuccess(`Usuário ${username} e todos os seus dados foram deletados. Informações básicas mantidas no painel administrativo.`);
      await fetchUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      showError('Erro ao deletar usuário');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleResetPassword = async (userId, username) => {
    const confirmReset = window.confirm(
      `🔑 Resetar Senha\n\n` +
      `Você está prestes a resetar a senha do usuário "${username}" para "123456".\n\n` +
      `O usuário precisará alterar a senha no próximo login por segurança.\n\n` +
      `Deseja continuar?`
    );
    
    if (!confirmReset) return;
    
    setResettingPassword(userId);
    try {
      const response = await api.patch(`/admin/users/${userId}/reset-password`);
      showSuccess(`Senha do usuário ${username} foi resetada para 123456 com sucesso!`);
      await fetchUsers();
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      showError('Erro ao resetar senha');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleClearDatabase = async () => {
    const confirmClear = window.confirm(
      `🗑️ LIMPAR BANCO DE DADOS\n\n` +
      `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
      `Você está prestes a limpar COMPLETAMENTE o banco de dados, removendo:\n` +
      `• Todos os usuários\n` +
      `• Todas as contas bancárias\n` +
      `• Todas as receitas e despesas\n` +
      `• Todas as despesas fixas\n` +
      `• Todos os conselhos financeiros\n` +
      `• Todos os resumos mensais\n\n` +
      `O sistema ficará completamente limpo para novos testes.\n\n` +
      `Tem CERTEZA ABSOLUTA que deseja continuar?`
    );
    
    if (!confirmClear) return;
    
    // Segunda confirmação
    const doubleConfirm = window.confirm(
      `🚨 CONFIRMAÇÃO FINAL 🚨\n\n` +
      `Você está prestes a DELETAR TODOS OS DADOS do sistema.\n\n` +
      `Esta ação NÃO PODE SER DESFEITA!\n\n` +
      `Digite "CONFIRMAR" para continuar:`
    );
    
    if (!doubleConfirm) return;
    
    setClearingDatabase(true);
    try {
      const response = await api.post('/admin/clear-database');
      showSuccess('Banco de dados limpo com sucesso! Todos os dados foram removidos.');
      await fetchUsers();
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      showError('Erro ao limpar banco de dados');
    } finally {
      setClearingDatabase(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // O backend retorna datas no formato "2025-09-02 00:20:59" (local brasileiro)
      // Mas o JavaScript interpreta como UTC, causando diferença de 3 horas
      // Vamos forçar a interpretação como data local
      
      let date;
      
      if (dateString.includes(' ')) {
        // Formato do backend: "2025-09-02 00:20:59"
        // Vamos criar uma data local forçando o fuso horário brasileiro
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        // Criar data no fuso horário local (Brasil)
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                       parseInt(hour), parseInt(minute), parseInt(second));
      } else {
        // Outro formato, usar normalmente
        date = new Date(dateString);
      }
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Erro na data';
    }
  };

  // Tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark dark:via-dark-light dark:to-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-black" />
              </div>
              <h1 className="text-3xl font-bold text-gradient">Admin</h1>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-light">
              Painel Administrativo
            </h2>

            <p className="text-gray-600 dark:text-light mt-2">
              Faça login para acessar o painel
            </p>
          </div>

          {/* Formulário */}
          <Card>
            <Card.Content>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-light text-gray-900 dark:text-light"
                    placeholder="Digite o usuário"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-light text-gray-900 dark:text-light"
                      placeholder="Digite a senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  Entrar
                </Button>
              </form>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  // Painel administrativo
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      {/* Header */}
      <div className="bg-white dark:bg-dark shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-light">
                Painel Administrativo
              </h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="danger"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-light mb-2">
                Gerenciamento de Usuários
              </h2>
              <p className="text-gray-600 dark:text-light">
                Visualize e gerencie todos os usuários do sistema
              </p>
            </div>
            
            <div className="mt-4 lg:mt-0">
              <Button
                onClick={handleClearDatabase}
                disabled={clearingDatabase}
                variant="danger"
                className="bg-red-600 hover:bg-red-700"
              >
                {clearingDatabase ? (
                  <>
                    <div className="spinner w-4 h-4 mr-2"></div>
                    Limpando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Limpar Banco de Dados
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                Lista de Usuários ({users.length})
              </h3>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCreateUserModal(true)}
                  variant="primary"
                  className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Usuário
                </Button>
                <Button
                  onClick={fetchUsers}
                  variant="secondary"
                  disabled={loading}
                >
                  {loading ? 'Carregando...' : 'Atualizar'}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto"></div>
                <p className="text-gray-600 dark:text-light mt-2">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-light">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-dark-light">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data de Criação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data de Exclusão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-light">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center">
                                <span className="text-sm font-medium text-black">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-light">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-light">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-light">
                          {formatDate(user.deleted_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_banned 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                              : user.deleted_at 
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {user.is_banned ? 'Banido' : user.deleted_at ? 'Excluído' : 'Ativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            {!user.deleted_at ? (
                              <>
                                {!user.is_banned ? (
                                  <Button
                                    onClick={() => handleBanUser(user.id, user.username)}
                                    disabled={banningUser === user.id}
                                    variant="danger"
                                    size="sm"
                                  >
                                    {banningUser === user.id ? (
                                      <div className="spinner w-3 h-3"></div>
                                    ) : (
                                      <Ban className="w-3 h-3 mr-1" />
                                    )}
                                    Banir
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleUnbanUser(user.id, user.username)}
                                    disabled={unbanningUser === user.id}
                                    variant="success"
                                    size="sm"
                                  >
                                    {unbanningUser === user.id ? (
                                      <div className="spinner w-3 h-3"></div>
                                    ) : (
                                      <UserCheck className="w-3 h-3 mr-1" />
                                    )}
                                    Desbanir
                                  </Button>
                                )}
                                
                                <Button
                                  onClick={() => handleResetPassword(user.id, user.username)}
                                  disabled={resettingPassword === user.id}
                                  variant="secondary"
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {resettingPassword === user.id ? (
                                    <div className="spinner w-3 h-3"></div>
                                  ) : (
                                    <Key className="w-3 h-3 mr-1" />
                                  )}
                                  Resetar Senha
                                </Button>
                                
                                <Button
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  disabled={deletingUser === user.id}
                                  variant="danger"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deletingUser === user.id ? (
                                    <div className="spinner w-3 h-3"></div>
                                  ) : (
                                    <Trash2 className="w-3 h-3 mr-1" />
                                  )}
                                  Deletar
                                </Button>
                              </>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs">Nenhuma ação disponível</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Criação de Usuário */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-light rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                Criar Novo Usuário
              </h3>
              <button
                onClick={resetCreateUserForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Nome Completo *
                </label>
                <Input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Digite o email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Senha *
                </label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Confirmar Senha *
                </label>
                <Input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  placeholder="Confirme a senha"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Data de Nascimento
                </label>
                <Input
                  type="date"
                  value={newUser.birth_date}
                  onChange={(e) => setNewUser({...newUser, birth_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Telefone
                </label>
                <Input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={resetCreateUserForm}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
