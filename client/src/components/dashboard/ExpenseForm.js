import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button, Input, Card, ConfirmModal, useNotifications } from '../ui';
import { getCurrentDate } from '../../utils/dateUtils';
import {
    CreditCard,
    Plus,
    Calendar,
    DollarSign,
    Filter,
    Tag
} from 'lucide-react';

const ExpenseForm = () => {
    const {
        expenses,
        bankAccounts,
        createExpense,
        loadExpenses,
        deleteExpense,
        updateExpense
    } = useFinancial();

    const { showError, showSuccess } = useNotifications();
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const [formData, setFormData] = useState({
        amount: '',
        expense_date: getCurrentDate(),
        payment_method: 'debito',
        installments: '',
        description: '',
        category: '',
        bank_account_id: ''
    });

    // Edição inline da conta associada
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState('');

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newFormData = {
                ...prev,
                [name]: value
            };

            // Se o método de pagamento mudou, limpar a conta bancária selecionada
            if (name === 'payment_method') {
                newFormData.bank_account_id = '';
            }

            return newFormData;
        });
    };

    const handleSubmit = async(e) => {
        e.preventDefault();

        // Validação mais rigorosa
        if (!formData.amount || formData.amount <= 0) {
            showError('Por favor, insira um valor válido maior que zero');
            return;
        }

        if (!formData.expense_date) {
            showError('Por favor, selecione uma data');
            return;
        }

        if (!formData.payment_method) {
            showError('Por favor, selecione um método de pagamento');
            return;
        }

        // Preparar dados para envio - remover campos desnecessários
        const dataToSend = {
            ...formData,
            amount: parseFloat(formData.amount)
        };

        // Se não for crédito, remover o campo installments
        if (formData.payment_method !== 'credito') {
            delete dataToSend.installments;
        }

        // Se installments estiver vazio, remover também
        if (!dataToSend.installments || dataToSend.installments === '') {
            delete dataToSend.installments;
        }

        console.log('Dados do formulário antes do envio:', dataToSend);
        console.log('Tipo do amount:', typeof dataToSend.amount);
        console.log('Valor do amount:', dataToSend.amount);

        setIsLoading(true);
        try {
            const result = await createExpense(dataToSend);
            if (result.success) {
                showSuccess('Gasto registrado com sucesso!');
                setFormData({
                    amount: '',
                    expense_date: getCurrentDate(),
                    payment_method: 'debito',
                    installments: '',
                    description: '',
                    category: '',
                    bank_account_id: ''
                });
                setShowForm(false);
            }
        } catch (error) {
            console.error('Erro ao registrar gasto:', error);
            showError('Erro ao registrar gasto. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        const filters = {};
        if (searchTerm) filters.description = searchTerm;
        if (dateFilter) filters.start_date = dateFilter;
        if (methodFilter) filters.payment_method = methodFilter;
        if (categoryFilter) filters.category = categoryFilter;

        loadExpenses(filters);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setDateFilter('');
        setMethodFilter('');
        setCategoryFilter('');
        loadExpenses();
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getPaymentMethodLabel = (method) => {
        const labels = {
            debito: 'Débito',
    
            credito: 'Crédito'
        };
        return labels[method] || method;
    };

    const filteredExpenses = expenses.filter(item => {
        const matchesSearch = !searchTerm ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDate = !dateFilter || item.expense_date === dateFilter;
        const matchesMethod = !methodFilter || item.payment_method === methodFilter;
        const matchesCategory = !categoryFilter || item.category === categoryFilter;

        return matchesSearch && matchesDate && matchesMethod && matchesCategory;
    });

    const handleDeleteExpense = async(id) => {
        setConfirmDelete({ id, type: 'expense' });
    };

    const confirmDeleteAction = async() => {
        if (confirmDelete) {
            try {
                await deleteExpense(confirmDelete.id);
                showSuccess('Gasto excluído com sucesso!');
            } catch (error) {
                showError('Erro ao excluir gasto.');
            }
            setConfirmDelete(null);
        }
    };

    // Edição inline da conta associada
    const handleEditAccount = (expense) => {
        setEditingExpenseId(expense.id);
        setSelectedAccountId(expense.bank_account_id || '');
    };

    const handleSaveAccount = async(expense) => {
        if (!selectedAccountId) return;
        await updateExpense(expense.id, { bank_account_id: selectedAccountId });
        setEditingExpenseId(null);
        setSelectedAccountId('');
    };

    const handleCancelEdit = () => {
        setEditingExpenseId(null);
        setSelectedAccountId('');
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-light">
                        Registrar Gastos
                    </h2>
                    <p className="text-gray-600 dark:text-light mt-1">
                        Controle suas despesas e mantenha o orçamento em dia
                    </p>
                </div>

                <Button 
                    variant="primary"
                    onClick={() => setShowForm(!showForm)}
                    className="mt-4 sm:mt-0"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cancelar' : 'Novo Gasto'}
                </Button>
            </div>

            {/* Formulário */}
            {showForm && (
                <Card className="mb-6">
                    <Card.Header>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                            Novo Gasto
                        </h3>
                    </Card.Header>

                    <Card.Content>
                        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                            {/* Valor */}
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

                            {/* Data */}
                            <Input
                                type="date"
                                name="expense_date"
                                label="Data *"
                                leftIcon={Calendar}
                                value={formData.expense_date}
                                onChange={handleInputChange}
                                required
                            />

                            {/* Método de Pagamento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                    Método de Pagamento *
                                </label>
                                <select
                                    name="payment_method"
                                    value={formData.payment_method}
                                    onChange={handleInputChange}
                                    className="input-primary"
                                    required
                                >
                                    <option value="debito">Débito</option>
                                    <option value="credito">Crédito</option>
                                </select>
                            </div>

                            {/* Quantidade de Parcelas (se crédito) */}
                            {formData.payment_method === 'credito' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                                        Quantidade de Parcelas
                                    </label>
                                    <input
                                        type="number"
                                        name="installments"
                                        value={formData.installments}
                                        onChange={handleInputChange}
                                        className="input-primary"
                                        placeholder="Ex: 3, 6, 12"
                                        min="1"
                                        max="24"
                                    />
                                </div>
                            )}

                            {/* Categoria */}
                            <Input
                                type="text"
                                name="category"
                                label="Categoria"
                                leftIcon={Tag}
                                value={formData.category}
                                onChange={handleInputChange}
                                placeholder="Ex: Alimentação, Transporte, Lazer"
                            />

                            {/* Conta Bancária */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                                    Conta Bancária
                                </label>
                                {(() => {
                            const compatibleAccounts = bankAccounts.filter(account => {
                                // Se o método de pagamento for crédito, mostrar apenas contas de crédito
                                if (formData.payment_method === 'credito') {
                                    return account.account_category === 'credito';
                                }
                                // Se o método for débito, mostrar apenas contas de débito
                                else if (formData.payment_method === 'debito') {
                                    return account.account_category === 'debito';
                                }
                                // Caso padrão, mostrar todas as contas
                                return true;
                            });

                                    return (
                                        <>
                                            <select
                                                name="bank_account_id"
                                                value={formData.bank_account_id}
                                                onChange={handleInputChange}
                                                className="input-primary"
                                            >
                                                <option value="">Selecione uma conta</option>
                                                {compatibleAccounts.map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.account_category === 'credito' ?
                                                            `${account.account_name} - Limite: ${formatCurrency(account.credit_limit || 0)}` :
                                                            `${account.account_name} - Saldo: ${formatCurrency(account.balance || 0)}`
                                                        }
                                                    </option>
                                                ))}
                                            </select>
                                            {compatibleAccounts.length === 0 && (
                                                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                                    ⚠️ Nenhuma conta {formData.payment_method === 'credito' ? 'de crédito' : 'de débito'} encontrada.
                                                    <a href="/dashboard/bank-accounts" className="text-blue-600 dark:text-blue-400 underline ml-1">
                                                        Criar conta
                                                    </a>
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Descrição */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="input-primary"
                                    rows="3"
                                    placeholder="Descrição do gasto..."
                                />
                            </div>

                            {/* Botões */}
                            <div className="md:col-span-2 flex justify-end space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={isLoading}
                                >
                                    {isLoading ? 'Registrando...' : 'Registrar Gasto'}
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            )}

            {/* Filtros */}
            <Card className="mb-6">
                <Card.Header>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                        Filtros e Pesquisa
                    </h3>
                </Card.Header>
                <Card.Content>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="input-primary"
                            />

                            <select
                                value={methodFilter}
                                onChange={(e) => setMethodFilter(e.target.value)}
                                className="input-primary"
                            >
                                <option value="">Todos os métodos</option>
                                <option value="debito">Débito</option>
                                <option value="credito">Crédito</option>
                            </select>

                            <Button variant="primary" onClick={handleSearch}>
                                <Filter className="w-4 h-4 mr-2" />
                                Filtrar
                            </Button>

                            <Button variant="outline" onClick={handleClearFilters}>
                                Limpar
                            </Button>
                        </div>
                        <input
                            type="text"
                            placeholder="Pesquisar por descrição ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-primary w-full sm:w-64"
                        />
                    </div>
                </Card.Content>
            </Card>

            {/* Lista de Gastos */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                            Gastos Registrados
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {filteredExpenses.length} gasto(s) encontrado(s)
                        </span>
                    </div>
                </Card.Header>

                <Card.Content>
                    {filteredExpenses.length === 0 ? (
                        <div className="text-center py-8">
                            <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Nenhum gasto registrado ainda
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light">Data</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light">Descrição</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light">Valor</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light">Método</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light">Parcelas</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light">Categoria</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light">Conta</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-light text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-lighter">
                                            <td className="py-3 px-4 text-gray-900 dark:text-light">
                                                {formatDate(item.expense_date)}
                                            </td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-light font-medium">
                                                {item.description || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-red-600 dark:text-red-400 font-bold">
                                                {formatCurrency(item.amount)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.payment_method === 'credito' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'

                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                }`}>
                                                    {getPaymentMethodLabel(item.payment_method)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-light">
                                                {item.payment_method === 'credito' && item.installments ?
                            `${item.installments}x` : '-'
                                                }
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-light">
                                                {item.category || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-light">
                                                {editingExpenseId === item.id ? (
                                                    <select
                                                        className="input-primary"
                                                        value={selectedAccountId}
                                                        onChange={e => setSelectedAccountId(e.target.value)}
                                                    >
                                                        <option value="">Selecione uma conta</option>
                                                        {bankAccounts
                            .filter(account => {
                                // Se o método de pagamento for crédito, mostrar apenas contas de crédito
                                if (item.payment_method === 'credito') {
                                    return account.account_category === 'credito';
                                }
                                // Se o método for débito, mostrar apenas contas de débito
                                else if (item.payment_method === 'debito') {
                                    return account.account_category === 'debito';
                                }
                                // Caso padrão, mostrar todas as contas
                                return true;
                            })
                                                            .map(account => (
                                                                <option key={account.id} value={account.id}>
                                                                    {account.account_category === 'credito' ?
                                                                        `${account.account_name} - Limite: ${formatCurrency(account.credit_limit || 0)}` :
                                                                        `${account.account_name} - Saldo: ${formatCurrency(account.balance || 0)}`
                                                                    }
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                ) : (
                                                    item.account_name || 'Não especificada'
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {editingExpenseId === item.id ? (
                                                    <>
                                                        <button
                                                            className="bg-primary text-black font-medium px-3 py-1.5 rounded text-xs mr-2 hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleSaveAccount(item)}
                                                            disabled={!selectedAccountId}
                                                        >
                                                            Salvar
                                                        </button>
                                                        <button
                                                            className="border border-primary text-primary font-medium px-3 py-1.5 rounded text-xs hover:bg-primary hover:text-black transition-colors"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="p-2 rounded-full text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                                                        title="Editar conta do gasto"
                                                        onClick={() => handleEditAccount(item)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l10.293-10.293a1 1 0 00-1.414-1.414L3 17z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    className="p-2 rounded-full text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Excluir gasto"
                                                    onClick={() => handleDeleteExpense(item.id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Content>
            </Card>

            {/* Modal de Confirmação */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteAction}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
);
};

export default ExpenseForm;
