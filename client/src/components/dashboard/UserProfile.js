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
  Trash2
} from 'lucide-react';
import { ConfirmModal, useNotifications } from '../ui';
import { formatDateToLocal } from '../../utils/dateUtils';

const UserProfile = () => {
  const { user, updateUserPreferences, logout } = useAuth();
  const { showError } = useNotifications();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
