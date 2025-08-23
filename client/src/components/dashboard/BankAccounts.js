import React, { useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  Wallet,
  PiggyBank,
  TrendingUp
} from 'lucide-react';
import { ConfirmModal, useNotifications } from '../ui';

const BankAccounts = () => {
  const { bankAccounts, createBankAccount, deleteBankAccount, isLoading, updateBankAccount } = useFinancial();
  const { showError, showSuccess } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_name: '',
    account_type: 'corrente',
    account_category: 'debito',
    credit_limit: '',
    due_date: ''
  });
  const [editingNameId, setEditingNameId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [showCreditCardInfo, setShowCreditCardInfo] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async () => {
    if (!formData.account_name) {
      return;
    }
    if (formData.account_category === 'credito' && !showCreditCardInfo) {
      setShowCreditCardInfo(true);
      
      return;
    }
    
    // Preparar dados para envio
    const dataToSend = { ...formData };
    
    // Se for crédito, definir account_type como 'corrente' (padrão para cartões)
    if (formData.account_category === 'credito') {
      dataToSend.account_type = 'corrente';
      // Se não for crédito, não envia credit_limit e due_date
    } else {
      delete dataToSend.credit_limit;
      delete dataToSend.due_date;
    }

    console.log('Criando conta com dados:', dataToSend);

    try {
      const result = await createBankAccount(dataToSend);
      
      console.log('Resultado da criação:', result);
      
      if (result.success) {
        setFormData({
          account_name: '',
          account_type: 'corrente',
          account_category: 'debito',
          credit_limit: '',
          due_date: ''
        });
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Erro ao criar conta bancária:', error);
      
      // Mostrar mensagem de erro genérica
      showError('Erro ao criar conta bancária');
      
      // Mesmo com erro, resetar o formulário para evitar estado inconsistente
      setFormData({
        account_name: '',
        account_type: 'corrente',
        account_category: 'debito',
        credit_limit: '',
        due_date: ''
      });
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      account_name: '',
      account_type: 'corrente',
      account_category: 'debito',
      credit_limit: '',
      due_date: ''
    });
    setIsCreating(false);

  };

  const handleDelete = async (accountId, accountName) => {
    setItemToDelete({ id: accountId, name: accountName });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeletingAccount(itemToDelete.id);
    try {
      const result = await deleteBankAccount(itemToDelete.id);
      if (result.success) {
        showSuccess('Conta excluída com sucesso!');
      } else {
        showError('Erro ao excluir conta: ' + result.message);
      }
    } catch (error) {
      showError('Erro ao excluir conta bancária.');
    } finally {
      setDeletingAccount(null);
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'corrente':
        return <Wallet className="w-5 h-5" />;
      case 'poupanca':
        return <PiggyBank className="w-5 h-5" />;
      case 'investimento':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case 'corrente':
        return 'Conta Corrente';
      case 'poupanca':
        return 'Conta Poupança';
      case 'investimento':
        return 'Conta Investimento';
      default:
        return type;
    }
  };

  const getAccountCategoryLabel = (category) => {
    switch (category) {
      case 'debito':
        return 'Débito';
      case 'credito':
        return 'Crédito';
      default:
        return category;
    }
  };

  const formatCurrency = (value) => {
    console.log('Formatando valor:', value, 'Tipo:', typeof value);
    
    // Garantir que o valor seja um número
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue) || numericValue === 0) {
      console.log('Valor inválido ou zero, retornando R$ 0,00');
      return 'R$ 0,00';
    }
    
    console.log('Valor numérico para formatação:', numericValue);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-light">
            Contas e cartões
          </h2>
          <p className="text-gray-600 dark:text-light mt-1">
            Gerencie suas contas e cartões
          </p>
        </div>
        
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta ou Cartão</span>
          </button>
        )}
      </div>

      {/* Formulário de Criação */}
      {isCreating && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-light mb-4">
            Nova Conta ou Cartão
          </h3>
          {/* Modal de aviso para cartão de crédito */}
          {showCreditCardInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
              <div className="bg-white dark:bg-dark p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h4 className="text-lg font-bold mb-2 text-yellow-700">Atenção!</h4>
                <p className="text-gray-800 dark:text-gray-200 mb-4 text-sm">
                  Lembre-se: o cartão de crédito também é considerado uma despesa. Sempre registre suas compras feitas no cartão como <b>gastos</b>. Depois, crie uma <b>Despesas Fixas</b> da fatura para você acompanhar e pagar.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setShowCreditCardInfo(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      setShowCreditCardInfo(false);
                      await handleCreate();
                    }}
                  >
                    Entendi
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                Nome da Conta
              </label>
              <input
                type="text"
                name="account_name"
                value={formData.account_name}
                onChange={handleInputChange}
                className="input-primary"
                placeholder="Ex: Nubank, Itaú, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                Categoria
              </label>
              <select
                name="account_category"
                value={formData.account_category}
                onChange={handleInputChange}
                className="input-primary"
              >
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            {/* Tipo de Conta só aparece se não for crédito */}
            {formData.account_category !== 'credito' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                  Tipo de Conta
                </label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleInputChange}
                  className="input-primary"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Conta Poupança</option>
                  <option value="investimento">Conta Investimento</option>
                </select>
              </div>
            )}
            {formData.account_category === 'credito' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                  Limite
                </label>
                <input
                  type="number"
                  name="credit_limit"
                  value={formData.credit_limit}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="Ex: 2000.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
            {formData.account_category === 'credito' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-1">
                  Vencimento da Fatura
                </label>
                <input
                  type="number"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="Ex: 15"
                  min="1"
                  max="31"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="btn-outline"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={isLoading || !formData.account_name || showCreditCardInfo}
              className="btn-primary flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="spinner w-4 h-4"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{formData.account_category === 'credito' ? 'Criar Cartão' : 'Criar Conta'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankAccounts && bankAccounts.length > 0 && bankAccounts.map((account) => {
          if (!account) return null;
          return (
            <div key={account.id} className={`card${editingNameId === account.id ? ' min-h-[140px]' : ''}`} style={editingNameId === account.id ? { minHeight: 140 } : {}}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    (account.account_category || 'debito') === 'credito' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                      : 'bg-gradient-to-r from-primary to-primary-dark'
                  }`}>
                    {getAccountTypeIcon(account.account_type)}
                  </div>
                  
                  {editingNameId === account.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={e => setEditingNameValue(e.target.value)}
                        className="input-primary"
                        style={{ minWidth: 120 }}
                      />
                      <button
                        className="btn-primary px-2 py-1"
                        onClick={async () => {
                          await updateBankAccount(account.id, { account_name: editingNameValue });
                          setEditingNameId(null);
                        }}
                        disabled={!editingNameValue.trim()}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-outline px-2 py-1"
                        onClick={() => setEditingNameId(null)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-light">
                        {account.account_name}
                      </h3>
                      <button
                        className="p-1 text-blue-500 hover:text-blue-700"
                        title="Editar nome da conta"
                        onClick={() => {
                          setEditingNameId(account.id);
                          setEditingNameValue(account.account_name);
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Mostrar categoria apenas quando não estiver editando */}
                  {editingNameId !== account.id && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      (account.account_category || 'debito') === 'credito'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {getAccountCategoryLabel(account.account_category || 'debito')}
                    </span>
                  )}
                  
                  {/* Mostrar botão de excluir apenas quando não estiver editando */}
                  {editingNameId !== account.id && (
                    <button
                      onClick={() => handleDelete(account.id, account.account_name)}
                      disabled={deletingAccount === account.id}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Excluir conta"
                    >
                      {deletingAccount === account.id ? (
                        <div className="spinner w-4 h-4"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {/* Saldo ou Limite */}
                {(account.account_category === 'credito') ? (
                  <>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Limite
                      </span>
                      <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                        {account.credit_limit ? formatCurrency(account.credit_limit) : 'Não informado'}
                      </span>
                      <button
                        className="btn-outline px-2 py-1 ml-2"
                        onClick={async () => {
                          const novoLimite = prompt('Informe o novo limite:', account.credit_limit || '');
                          if (novoLimite !== null && novoLimite !== '' && !isNaN(parseFloat(novoLimite))) {
                            await updateBankAccount(account.id, { credit_limit: parseFloat(novoLimite) });
                          }
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    {account.due_date && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Vencimento
                        </span>
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                          {account.due_date}º do mês
                        </span>
                        <button
                          className="btn-outline px-2 py-1 ml-2"
                          onClick={async () => {
                            const novoVencimento = prompt('Informe o novo dia de vencimento (1-31):', account.due_date || '');
                            if (novoVencimento !== null && novoVencimento !== '' && !isNaN(parseInt(novoVencimento)) && parseInt(novoVencimento) >= 1 && parseInt(novoVencimento) <= 31) {
                              await updateBankAccount(account.id, { due_date: parseInt(novoVencimento) });
                            }
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-gray-50 dark:bg-dark-lighter rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-light">
                          Saldo Atual
                        </span>
                        <span className={`text-lg font-bold ${
                          account.balance >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency((account.balance === undefined || account.balance === null || (account.balance === 0 && (!account.hasOwnProperty('balance') || account.balance === 0))) ? 0 : account.balance)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tipo de Conta para contas de débito */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Tipo de Conta
                      </span>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {getAccountTypeLabel(account.account_type)}
                      </span>
                    </div>
                  </>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Criada em {new Date(account.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado Vazio */}
      {bankAccounts.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-light mb-2">
            Nenhuma conta ou cartão
          </h3>
          <p className="text-gray-600 dark:text-light mb-4">
            Comece criando sua primeira conta ou cartão para organizar suas finanças.
          </p>
          <button
             onClick={() => setIsCreating(true)}
             className="mx-auto btn-primary flex items-center justify-center space-x-2"
           >
             <Plus className="w-4 h-4" />
             <span>Criar Primeira Conta ou Cartão</span>
           </button>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a conta "${itemToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={deletingAccount === itemToDelete?.id}
      />
    </div>
  );
};

export default BankAccounts;
