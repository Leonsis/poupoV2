import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Mail,
  Calendar,
  Phone,
  Edit3,
  Save,
  X,
  Trash2,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { ConfirmModal, useNotifications } from '../ui';
import { formatDateToLocal } from '../../utils/dateUtils';

const UserProfile = () => {
  const { user, updateUserPreferences, logout } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    birth_date: user?.birth_date ? user.birth_date.split('T')[0] : '',
    phone: user?.phone || ''
  });
  
  // Estados para alterar senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showError('Todos os campos são obrigatórios');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('A confirmação de senha não confere');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Senha alterada com sucesso!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsChangingPassword(false);
      } else {
        showError(result.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showError('Erro ao alterar senha');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let birthDate = formData.birth_date;
              if (birthDate) {
          const date = new Date(birthDate + 'T00:00:00');
          birthDate = formatDateToLocal(date);
        }
      
      const result = await updateUserPreferences({
        name: formData.name,
        birth_date: birthDate,
        phone: formData.phone
      });
      
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      birth_date: user?.birth_date ? user.birth_date.split('T')[0] : '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/auth/delete-account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir conta.');
      }
      logout();
    } catch (error) {
      showError('Erro ao excluir conta: ' + (error.message || 'Tente novamente.'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Alterar Senha
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-light">
                  Informações Pessoais
                </h2>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-outline flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="spinner w-4 h-4"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Salvar</span>
                  </button>
                  
                  <button
                    onClick={handleCancel}
                    className="btn-outline flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                    Nome Completo
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-primary"
                      placeholder="Digite seu nome completo"
                    />
                  ) : (
                    <p className="text-lg text-gray-900 dark:text-light break-words">
                      {user?.name || 'Não informado'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-secondary to-secondary-light rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                    Email
                  </label>
                  <p className="text-lg text-gray-900 dark:text-light break-words">
                    {user?.email || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                    Data de Nascimento
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      className="input-primary"
                    />
                  ) : (
                    <p className="text-lg text-gray-900 dark:text-light break-words">
                      {formatDate(user?.birth_date)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-secondary to-secondary-light rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                    Telefone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-primary"
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-lg text-gray-900 dark:text-light break-words">
                      {user?.phone || 'Não informado'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger flex items-center justify-center space-x-2 mx-auto w-full sm:w-auto"
            disabled={isDeleting}
          >
            {isDeleting ? <div className="spinner w-4 h-4"></div> : <Trash2 className="w-4 h-4" />}
            <span>Excluir Conta</span>
          </button>
        </div>
      </div>
      )}

      {/* Tab de Alterar Senha */}
      {activeTab === 'password' && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-light">
                Alterar Senha
              </h2>
              
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="btn-outline flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <Key className="w-4 h-4" />
                  <span>Alterar Senha</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleChangePassword}
                    disabled={isPasswordLoading}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    {isPasswordLoading ? (
                      <div className="spinner w-4 h-4"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Salvar</span>
                  </button>
                  
                  <button
                    onClick={handleCancelPasswordChange}
                    className="btn-outline flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>

            {isChangingPassword && (
              <div className="space-y-6">
                {/* Senha Atual */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="input-primary pr-10"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nova Senha */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        className="input-primary pr-10"
                        placeholder="Digite sua nova senha (mín. 6 caracteres)"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        className="input-primary pr-10"
                        placeholder="Confirme sua nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dicas de Segurança */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Dicas para uma senha segura:
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Use pelo menos 6 caracteres</li>
                    <li>• Combine letras maiúsculas e minúsculas</li>
                    <li>• Inclua números e símbolos especiais</li>
                    <li>• Evite informações pessoais óbvias</li>
                  </ul>
                </div>
              </div>
            )}

            {!isChangingPassword && (
              <div className="text-center py-8">
                <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-light mb-2">
                  Alterar Senha
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Clique no botão acima para alterar sua senha de acesso.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Importante:</strong> Você precisará da sua senha atual para fazer a alteração.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir sua conta? Esta ação é irreversível!"
        confirmText="Excluir Conta"
        cancelText="Cancelar"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default UserProfile;
