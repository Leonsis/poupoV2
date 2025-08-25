import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { 
  FileText, 
  Plus, 
  Calendar, 
  DollarSign, 
  Tag,
  CheckCircle,
  Circle
} from 'lucide-react';
import { ConfirmModal, useNotifications, Input } from '../ui';

const FixedExpenses = () => {
  const { 
    fixedExpenses, 
    bankAccounts, 
    createFixedExpense, 
    updateFixedExpensePayment, 
    deleteFixedExpense,
    updateFixedExpenseAccount,
    checkMonthlyTransition,
    executeMonthlyTransition,
    loadFixedExpensesWithTransition,
    payOverdueExpense,
    getOverdueExpensesCount
  } = useFinancial();
  const { showError, showSuccess } = useNotifications();
  
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, expenseId: null });
  const [selectedBankId, setSelectedBankId] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  const [showOverduePaymentModal, setShowOverduePaymentModal] = useState(false);
  const [selectedOverdueExpense, setSelectedOverdueExpense] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    category: '',
    is_boleto: false, // novo campo
    total_installments: '', // novo campo
    paid_installments: '' // novo campo
  });

  // Edição inline da conta associada
  const [editingFixedId, setEditingFixedId] = useState(null);
  const [selectedFixedAccountId, setSelectedFixedAccountId] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.due_date) {
      showError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createFixedExpense({
        ...formData,
        due_date: parseInt(formData.due_date) // Garantir que seja um número inteiro
      });
      if (result.success) {
        setFormData({
          description: '',
          amount: '',
          due_date: '',
          category: '',
          is_boleto: false,
          total_installments: '',
          paid_installments: ''
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erro ao registrar despesa fixa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePayment = async (id, currentStatus) => {
    if (!currentStatus) {
      // Vai marcar como paga: pedir confirmação e conta
      setConfirmModal({ open: true, expenseId: id });
    } else {
      // Desmarcar como paga: ação direta
      try {
        await updateFixedExpensePayment(id, false);
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBankId) {
      showError('Selecione uma conta bancária para registrar o pagamento.');
      return;
    }
    setConfirmLoading(true);
    try {
      await updateFixedExpensePayment(confirmModal.expenseId, true, selectedBankId);
      setConfirmModal({ open: false, expenseId: null });
      setSelectedBankId('');
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setItemToDelete({ id });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteFixedExpense(itemToDelete.id);
      showSuccess('Despesa fixa excluída com sucesso!');
    } catch (error) {
      showError('Erro ao excluir despesa fixa.');
    } finally {
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // Edição inline da conta associada
  const handleEditFixedAccount = (expense) => {
    setEditingFixedId(expense.id);
    setSelectedFixedAccountId(expense.bank_account_id || '');
  };

  const handleSaveFixedAccount = async (expense) => {
    if (!selectedFixedAccountId) return;
    await updateFixedExpenseAccount(expense.id, { bank_account_id: selectedFixedAccountId });
    setEditingFixedId(null);
    setSelectedFixedAccountId('');
  };

  const handleCancelEditFixed = () => {
    setEditingFixedId(null);
    setSelectedFixedAccountId('');
  };

  // Verificar transição mensal e carregar despesas vencidas
  useEffect(() => {
    const checkTransitionAndLoadData = async () => {
      try {
        // Verificar se precisa fazer transição mensal
        const transitionCheck = await checkMonthlyTransition();
        if (transitionCheck.needsTransition) {
          setShowTransitionModal(true);
        }

        // Carregar despesas com informações de transição
        await loadFixedExpensesWithTransition();

        // Contar despesas vencidas
        await getOverdueExpensesCount();
      } catch (error) {
        console.error('Erro ao verificar transição mensal:', error);
      }
    };

    checkTransitionAndLoadData();
  }, []); // Executar apenas uma vez ao montar o componente

  const handleExecuteTransition = async () => {
    try {
      const result = await executeMonthlyTransition();
      if (result.success) {
        setShowTransitionModal(false);
        // Recarregar dados
        await loadFixedExpensesWithTransition();
        await getOverdueExpensesCount();
      }
    } catch (error) {
      console.error('Erro ao executar transição:', error);
    }
  };

  const handlePayOverdueExpense = async () => {
    if (!selectedOverdueExpense || !selectedBankId) {
      showError('Selecione uma conta bancária para pagar a despesa vencida.');
      return;
    }

    try {
      const result = await payOverdueExpense(selectedOverdueExpense.id, selectedBankId);
      if (result.success) {
        setShowOverduePaymentModal(false);
        setSelectedOverdueExpense(null);
        setSelectedBankId('');
        // Recarregar dados
        await loadFixedExpensesWithTransition();
        await getOverdueExpensesCount();
      }
    } catch (error) {
      console.error('Erro ao pagar despesa vencida:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTotalFixedExpenses = () => {
    return fixedExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  };

  const getPaidExpenses = () => {
    return fixedExpenses.filter(item => item.is_paid);
  };

  const getUnpaidExpenses = () => {
    return fixedExpenses.filter(item => !item.is_paid && !item.is_overdue);
  };

  const getOverdueExpenses = () => {
    return fixedExpenses.filter(item => item.is_overdue);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Modal de confirmação de pagamento */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative mx-4">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-light">Confirmar Pagamento</h4>
            <p className="mb-4 text-gray-700 dark:text-light">Você tem certeza que pagou esta despesa fixa?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">Selecione a conta bancária utilizada *</label>
              <select
                className="input-primary w-full"
                value={selectedBankId}
                onChange={e => setSelectedBankId(e.target.value)}
              >
                <option value="">Selecione uma conta</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="btn-outline"
                onClick={() => {
                  setConfirmModal({ open: false, expenseId: null });
                  setSelectedBankId('');
                }}
                disabled={confirmLoading}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmPayment}
                disabled={confirmLoading}
              >
                {confirmLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner w-4 h-4"></div>
                    <span>Confirmando...</span>
                  </div>
                ) : (
                  'Confirmar Pagamento'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-light">
            Despesas Fixas
          </h2>
          <p className="text-gray-600 dark:text-light mt-1">
            Gerencie suas contas recorrentes mensais
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cancelar' : 'Nova Despesa Fixa'}</span>
        </button>
      </div>

             {/* Estatísticas */}
       <div className="grid md:grid-cols-4 gap-6 mb-6">
         <div className="card text-center">
           <div className="text-3xl font-bold text-primary mb-2">
             {formatCurrency(getTotalFixedExpenses())}
           </div>
           <div className="text-gray-600 dark:text-light">Total Mensal</div>
         </div>
         
         <div className="card text-center">
           <div className="text-3xl font-bold text-green-600 mb-2">
             {getPaidExpenses().length}
           </div>
           <div className="text-gray-600 dark:text-light">Pagas</div>
         </div>
         
         <div className="card text-center">
           <div className="text-3xl font-bold text-red-600 mb-2">
             {getUnpaidExpenses().length}
           </div>
           <div className="text-gray-600 dark:text-light">Pendentes</div>
         </div>

         <div className="card text-center">
           <div className="text-3xl font-bold text-orange-600 mb-2">
             {getOverdueExpenses().length}
           </div>
           <div className="text-gray-600 dark:text-light">Vencidas</div>
         </div>
       </div>

      {/* Formulário */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-light mb-4">
            Nova Despesa Fixa
          </h3>
          
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            {/* Descrição */}
            <div className="md:col-span-2">
              <Input
                type="text"
                name="description"
                label="Descrição *"
                leftIcon={FileText}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ex: Conta de luz, internet, aluguel..."
                required
              />
            </div>

            {/* Valor */}
            <div>
              <Input
                type="number"
                name="amount"
                label="Valor *"
                leftIcon={DollarSign}
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            {/* Dia de Vencimento */}
            <div>
              <Input
                type="number"
                name="due_date"
                label="Dia de Vencimento *"
                leftIcon={Calendar}
                value={formData.due_date}
                onChange={handleInputChange}
                placeholder="1-31"
                min="1"
                max="31"
                required
              />
            </div>

            {/* Categoria */}
            <div>
              <Input
                type="text"
                name="category"
                label="Categoria"
                leftIcon={Tag}
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Ex: Moradia, Serviços, etc."
              />
            </div>

            {/* É boleto ou fatura? */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                É boleto ou fatura?
              </label>
              <input
                type="checkbox"
                name="is_boleto"
                checked={formData.is_boleto}
                onChange={e => {
                  const isChecked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    is_boleto: isChecked,
                    // Limpar campos de parcelas se desmarcar o checkbox
                    total_installments: isChecked ? prev.total_installments : '',
                    paid_installments: isChecked ? prev.paid_installments : ''
                  }));
                }}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-light">Sim</span>
            </div>

            {/* Total de parcelas - Só aparece se for boleto */}
            {formData.is_boleto && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Total de parcelas
                </label>
                <input
                  type="number"
                  name="total_installments"
                  value={formData.total_installments}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="Ex: 12"
                  min="1"
                />
              </div>
            )}

            {/* Parcelas já pagas - Só aparece se for boleto */}
            {formData.is_boleto && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                  Parcelas já pagas
                </label>
                <input
                  type="number"
                  name="paid_installments"
                  value={formData.paid_installments}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="Ex: 3"
                  min="0"
                  max={formData.total_installments || ''}
                />
              </div>
            )}

            {/* Botões */}
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner w-4 h-4"></div>
                    <span>Registrando...</span>
                  </div>
                ) : (
                  'Registrar Despesa Fixa'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Despesas Fixas */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-light mb-4">
          Despesas Fixas Registradas
        </h3>

        {fixedExpenses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma despesa fixa registrada ainda
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fixedExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  expense.is_paid
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                                         <div className="flex items-center space-x-3 mb-2">
                       <h4 className="font-semibold text-gray-900 dark:text-light">
                         {expense.description}
                       </h4>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         expense.is_overdue
                           ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                           : expense.is_paid
                           ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                           : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                       }`}>
                         {expense.is_overdue ? 'Vencida' : expense.is_paid ? 'Paga' : 'Pendente'}
                       </span>
                     </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-light">
                      <div>
                        <span className="font-medium">Valor:</span> {formatCurrency(expense.amount)}
                      </div>
                      <div>
                        <span className="font-medium">Vencimento:</span> Dia {expense.due_date}
                      </div>
                      <div>
                        <span className="font-medium">Categoria:</span> {expense.category || 'Não especificada'}
                      </div>
                    </div>
                    {/* Exibir info de boleto/parcelas SOMENTE se for boleto */}
                    {Boolean(expense.is_boleto) && (
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Boleto:</span> {expense.paid_installments || 0} de {expense.total_installments || 0} pagos
                        {Number.isFinite(Number(expense.total_installments)) && Number.isFinite(Number(expense.paid_installments)) && (
                          <span> ({(expense.total_installments - expense.paid_installments) > 0 ? `${expense.total_installments - expense.paid_installments} a pagar` : 'Todos pagos'})</span>
                        )}
                      </div>
                    )}
                    {editingFixedId === expense.id ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <select
                          className="input-primary"
                          value={selectedFixedAccountId}
                          onChange={e => setSelectedFixedAccountId(e.target.value)}
                        >
                          <option value="">Selecione uma conta</option>
                          {bankAccounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.account_name} - {formatCurrency(account.balance)}
                            </option>
                          ))}
                        </select>
                        <button className="btn-primary px-2 py-1 text-xs" onClick={() => handleSaveFixedAccount(expense)}>Salvar</button>
                        <button className="btn-outline px-2 py-1 text-xs" onClick={handleCancelEditFixed}>Cancelar</button>
                      </div>
                    ) : (
                      expense.account_name && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Conta: {expense.account_name}
                          <button className="btn-outline px-2 py-1 text-xs" onClick={() => handleEditFixedAccount(expense)}>Editar</button>
                        </div>
                      )
                    )}
                  </div>
                                     <div className="flex flex-col items-end space-y-2">
                     {expense.is_overdue ? (
                       <button
                         onClick={() => {
                           setSelectedOverdueExpense(expense);
                           setShowOverduePaymentModal(true);
                         }}
                         className="p-2 rounded-full text-orange-600 hover:text-orange-700 transition-colors"
                         title="Pagar despesa vencida"
                       >
                         <DollarSign className="w-6 h-6" />
                       </button>
                     ) : (
                       <button
                         onClick={() => handleTogglePayment(expense.id, expense.is_paid)}
                         className={`p-2 rounded-full transition-colors ${
                           expense.is_paid
                             ? 'text-green-600 hover:text-green-700'
                             : 'text-yellow-600 hover:text-yellow-700'
                         }`}
                         title={expense.is_paid ? 'Marcar como pendente' : 'Marcar como paga'}
                       >
                         {expense.is_paid ? (
                           <CheckCircle className="w-6 h-6" />
                         ) : (
                           <Circle className="w-6 h-6" />
                         )}
                       </button>
                     )}
                     <button
                       onClick={() => handleDelete(expense.id)}
                       className="p-2 rounded-full text-red-600 hover:text-red-800 transition-colors"
                       title="Excluir despesa fixa"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

             {/* Modal de Confirmação de Exclusão */}
       <ConfirmModal
         isOpen={showDeleteConfirm}
         onClose={() => setShowDeleteConfirm(false)}
         onConfirm={handleConfirmDelete}
         title="Confirmar Exclusão"
         message="Tem certeza que deseja excluir esta despesa fixa?"
         confirmText="Excluir"
         cancelText="Cancelar"
         type="danger"
       />

       {/* Modal de Transição Mensal */}
       {showTransitionModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative mx-4">
             <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-light">Transição Mensal</h4>
             <p className="mb-4 text-gray-700 dark:text-light">
               É necessário fazer a transição para o novo mês. As despesas fixas serão atualizadas:
             </p>
             <ul className="mb-6 text-sm text-gray-600 dark:text-light space-y-2">
               <li>• Despesas pagas serão resetadas para o novo mês</li>
               <li>• Despesas não pagas serão marcadas como vencidas</li>
               <li>• Novas despesas serão criadas para o novo mês</li>
             </ul>
             <div className="flex justify-end space-x-3">
               <button
                 className="btn-outline"
                 onClick={() => setShowTransitionModal(false)}
               >
                 Cancelar
               </button>
               <button
                 className="btn-primary"
                 onClick={handleExecuteTransition}
               >
                 Executar Transição
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Pagamento de Despesa Vencida */}
       {showOverduePaymentModal && selectedOverdueExpense && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative mx-4">
             <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-light">Pagar Despesa Vencida</h4>
             <p className="mb-4 text-gray-700 dark:text-light">
               Você está pagando a despesa vencida: <strong>{selectedOverdueExpense.description}</strong>
             </p>
             <p className="mb-4 text-gray-700 dark:text-light">
               Valor: <strong>{formatCurrency(selectedOverdueExpense.amount)}</strong>
             </p>
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                 Selecione a conta bancária utilizada *
               </label>
               <select
                 className="input-primary w-full"
                 value={selectedBankId}
                 onChange={e => setSelectedBankId(e.target.value)}
               >
                 <option value="">Selecione uma conta</option>
                 {bankAccounts.map(account => (
                   <option key={account.id} value={account.id}>
                     {account.account_name} - {formatCurrency(account.balance)}
                   </option>
                 ))}
               </select>
             </div>
             <div className="flex justify-end space-x-3">
               <button
                 className="btn-outline"
                 onClick={() => {
                   setShowOverduePaymentModal(false);
                   setSelectedOverdueExpense(null);
                   setSelectedBankId('');
                 }}
               >
                 Cancelar
               </button>
               <button
                 className="btn-primary"
                 onClick={handlePayOverdueExpense}
                 disabled={!selectedBankId}
               >
                 Confirmar Pagamento
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default FixedExpenses;
