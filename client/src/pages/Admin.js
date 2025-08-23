import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Ban, 
  UserCheck, 
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, Button, useNotifications } from '../components/ui';
import api from '../services/api';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banningUser, setBanningUser] = useState(null);
  const [unbanningUser, setUnbanningUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  

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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-light mb-2">
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600 dark:text-light">
            Visualize e gerencie todos os usuários do sistema
          </p>
        </div>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                Lista de Usuários ({users.length})
              </h3>
              <Button
                onClick={fetchUsers}
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Atualizar'}
              </Button>
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
                          <div className="flex space-x-2">
                            {!user.is_banned && !user.deleted_at ? (
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
                            ) : user.is_banned && !user.deleted_at ? (
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
    </div>
  );
};

export default Admin;
