import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const FinancialContext = createContext();

export const useFinancial = () => {
    const context = useContext(FinancialContext);
    if (!context) {
        throw new Error('useFinancial deve ser usado dentro de um FinancialProvider');
    }
    return context;
};

export const FinancialProvider = ({ children }) => {
    const [income, setIncome] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [fixedExpenses, setFixedExpenses] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [financialAdvice, setFinancialAdvice] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

    // Carregar dados iniciais apenas uma vez quando houver token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !hasLoadedInitialData) {
            loadInitialData();
        }
    }, [hasLoadedInitialData]);

    // Função para resetar dados (usada no logout)
    const resetData = () => {
        setIncome([]);
        setExpenses([]);
        setFixedExpenses([]);
        setBankAccounts([]);
        setSummary(null);
        setFinancialAdvice(null);
        setHasLoadedInitialData(false);
        setIsLoading(false);
    };

    // Função para verificar se deve carregar dados
    const shouldLoadData = () => {
        const token = localStorage.getItem('token');
        return !!token;
    };

    const loadInitialData = async() => {
        try {
            if (!shouldLoadData()) {
                console.log('Token não encontrado, pulando carregamento de dados');
                return;
            }

            if (hasLoadedInitialData) {
                console.log('Dados já foram carregados, pulando...');
                return;
            }

            setIsLoading(true);
            await Promise.all([
                loadBankAccounts(),
                loadIncome(),
                loadExpenses(),
                loadFixedExpenses(),
                loadSummary()
            ]);
            setHasLoadedInitialData(true);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ===== CONTAS BANCÁRIAS =====
    const loadBankAccounts = async() => {
        try {
            if (!shouldLoadData()) return;

            console.log('Carregando contas bancárias...');
            const response = await api.get('/financial/bank-accounts');

            if (response.data.success) {
                const accounts = response.data.accounts || [];
                console.log('Contas bancárias carregadas:', accounts);
                setBankAccounts(accounts);
            } else {
                console.log('Erro ao carregar contas bancárias:', response.data.message);
                setBankAccounts([]);
            }
        } catch (error) {
            console.error('Erro ao carregar contas bancárias:', error);
            setBankAccounts([]);
        }
    };

    const createBankAccount = async(accountData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };

            console.log('Dados da conta sendo enviados:', accountData);
            const response = await api.post('/financial/bank-accounts', accountData);

            console.log('Resposta do servidor:', response.data);

            if (response.data.success) {
                const newAccount = response.data.account;
                console.log('Nova conta recebida:', newAccount);
                console.log('ID da nova conta:', newAccount.id, 'Tipo:', typeof newAccount.id);

                // Garantir que a nova conta tenha account_category e balance
                const accountWithCategory = {
                    ...newAccount,
                    id: parseInt(newAccount.id, 10), // Garantir que o ID seja um número
                    account_category: newAccount.account_category || accountData.account_category || 'debito',
                    balance: parseFloat(newAccount.balance) || parseFloat(accountData.balance) || 0
                };

                console.log('Conta final para adicionar ao estado:', accountWithCategory);

                // Atualizar o estado com a nova conta
                setBankAccounts(prev => {
                    const updatedAccounts = [...prev, accountWithCategory];
                    return updatedAccounts;
                });
                await loadSummary(); // Atualiza o overview após criar conta
                toast.success('Conta bancária criada com sucesso!');
                return { success: true };
            } else {
                return { success: false, message: response.data.message || 'Erro ao criar conta bancária' };
            }
        } catch (error) {
            console.error('Erro ao criar conta bancária:', error);
            const message = error.response?.data?.message || 'Erro ao criar conta bancária';
            toast.error(message);
            return { success: false, message };
        }
    };

    const updateBankAccount = async(accountId, updateData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.put(`/financial/bank-accounts/${accountId}`, updateData);
            if (response.data.success) {
                setBankAccounts(prev => prev.map(acc => acc.id === accountId ? {...acc, ...updateData } : acc));
                toast.success('Conta bancária atualizada com sucesso!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao atualizar conta bancária');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar conta bancária';
            toast.error(message);
            return { success: false, message };
        }
    };

    const deleteBankAccount = async(accountId) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };

            // Converter accountId para número para garantir consistência
            const numericAccountId = parseInt(accountId, 10);
            console.log('Tentando excluir conta com ID:', numericAccountId);
            console.log('Contas atuais no estado:', bankAccounts);

            const response = await api.delete(`/financial/bank-accounts/${numericAccountId}`);

            if (response.data.success) {
                console.log('Conta excluída no servidor, atualizando estado local...');
                setBankAccounts(prev => {
                    const filteredAccounts = prev.filter(account => account.id !== numericAccountId);
                    console.log('Conta excluída do estado local. Contas restantes:', filteredAccounts.length);
                    return filteredAccounts;
                });
                // Atualiza o resumo imediatamente com o novo saldo líquido e contas
                setSummary(prev => ({
                    ...prev,
                    bankAccounts: response.data.accounts || [],
                    net_balance: response.data.net_balance
                }));
                await loadSummary(); // Garante consistência
                toast.success('Conta bancária excluída com sucesso!');
                return { success: true };
            } else {
                return { success: false, message: response.data.message || 'Erro ao excluir conta bancária' };
            }
        } catch (error) {
            console.error('Erro ao excluir conta bancária:', error);
            const message = error.response?.data?.message || 'Erro ao excluir conta bancária';
            toast.error(message);
            return { success: false, message };
        }
    };

    // ===== GANHOS =====
    const loadIncome = async(filters = {}) => {
        try {
            if (!shouldLoadData()) return;

            const params = new URLSearchParams(filters);
            const response = await api.get(`/financial/income?${params}`);
            if (response.data.success) {
                const incomeData = response.data.income || [];
                setIncome(incomeData);
            } else {
                setIncome([]);
            }
        } catch (error) {
            console.error('Erro ao carregar ganhos:', error);
            setIncome([]);
        }
    };

    const createIncome = async(incomeData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };

            console.log('Registrando ganho:', incomeData);
            const response = await api.post('/financial/income', incomeData);
            if (response.data.success) {
                setIncome(prev => [response.data.income, ...prev]);
                console.log('Ganho registrado, atualizando saldos e resumo...');
                await loadBankAccounts(); // Atualizar saldos
                await loadSummary(); // Atualizar resumo detalhado
                toast.success('Ganho registrado com sucesso!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao registrar ganho';
            toast.error(message);
            return { success: false, message };
        }
    };

    const updateIncome = async(incomeId, updateData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.put(`/financial/income/${incomeId}`, updateData);
            if (response.data.success) {
                setIncome(prev => prev.map(item => item.id === incomeId ? {...item, ...updateData, ...response.data.income } : item));
                await loadBankAccounts();
                await loadSummary();
                toast.success('Ganho atualizado com sucesso!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao atualizar ganho');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar ganho';
            toast.error(message);
            return { success: false, message };
        }
    };

    const deleteIncome = async(incomeId) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.delete(`/financial/income/${incomeId}`);
            if (response.data.success) {
                setIncome(prev => prev.filter(item => item.id !== incomeId));
                await loadBankAccounts();
                await loadSummary();
                toast.success('Ganho excluído com sucesso!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao excluir ganho');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir ganho';
            toast.error(message);
            return { success: false, message };
        }
    };

    // ===== GASTOS =====
    const loadExpenses = async(filters = {}) => {
        try {
            if (!shouldLoadData()) return;

            const params = new URLSearchParams(filters);
            const response = await api.get(`/financial/expenses?${params}`);
            if (response.data.success) {
                const expensesData = response.data.expenses || [];
                setExpenses(expensesData);
            } else {
                setExpenses([]);
            }
        } catch (error) {
            console.error('Erro ao carregar gastos:', error);
            setExpenses([]);
        }
    };

    const createExpense = async(expenseData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };

            // Garantir que amount seja um número
            const processedData = {
                ...expenseData,
                amount: parseFloat(expenseData.amount) || 0
            };

            console.log('Registrando gasto (original):', expenseData);
            console.log('Registrando gasto (processado):', processedData);
            const response = await api.post('/financial/expenses', processedData);
            if (response.data.success) {
                setExpenses(prev => [response.data.expense, ...prev]);
                console.log('Gasto registrado, atualizando saldos...');
                await loadBankAccounts(); // Atualizar saldos
                toast.success('Gasto registrado com sucesso!');
                return { success: true };
            }
        } catch (error) {
            console.error('Erro detalhado ao registrar gasto:', error);
            console.error('Response data:', error.response?.data);

            // Se houver erros de validação, mostrar os detalhes
            if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
                toast.error(`Erro de validação: ${errorMessages}`);
                return { success: false, message: errorMessages };
            }

            const message = error.response?.data?.message || 'Erro ao registrar gasto';
            toast.error(message);
            return { success: false, message };
        }
    };

    const updateExpense = async(expenseId, updateData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.put(`/financial/expenses/${expenseId}`, updateData);
            if (response.data.success) {
                setExpenses(prev => prev.map(item => item.id === expenseId ? {...item, ...updateData, ...response.data.expense } : item));
                await loadBankAccounts();
                await loadSummary();
                toast.success('Conta do gasto atualizada com sucesso!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao atualizar gasto');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar gasto';
            toast.error(message);
            return { success: false, message };
        }
    };

    const deleteExpense = async(expenseId) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.delete(`/financial/expenses/${expenseId}`);
            if (response.data.success) {
                setExpenses(prev => prev.filter(item => item.id !== expenseId));
                await loadBankAccounts();
                await loadSummary();
                toast.success('Gasto excluído com sucesso!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao excluir gasto');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir gasto';
            toast.error(message);
            return { success: false, message };
        }
    };

    // ===== DESPESAS FIXAS =====
    const loadFixedExpenses = async() => {
        try {
            if (!shouldLoadData()) return;

            const response = await api.get('/financial/fixed-expenses');
            if (response.data.success) {
                const fixedExpensesData = response.data.fixed_expenses || [];
                setFixedExpenses(fixedExpensesData);
            } else {
                setFixedExpenses([]);
            }
        } catch (error) {
            console.error('Erro ao carregar despesas fixas:', error);
            setFixedExpenses([]);
        }
    };

    const createFixedExpense = async(expenseData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.post('/financial/fixed-expenses', expenseData);
            if (response.data.success) {
                setFixedExpenses(prev => [...prev, response.data.fixed_expense]);
                await loadSummary(); // Atualiza o overview
                toast.success('Despesa fixa registrada com sucesso!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao registrar despesa fixa';
            toast.error(message);
            return { success: false, message };
        }
    };

    const deleteFixedExpense = async(id) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.delete(`/financial/fixed-expenses/${id}`);
            if (response.data.success) {
                setFixedExpenses(prev => prev.filter(exp => exp.id !== id));
                await loadBankAccounts(); // Atualiza saldos das contas após exclusão
                await loadSummary(); // Atualiza o overview
                toast.success('Despesa fixa excluída com sucesso!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao excluir despesa fixa');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir despesa fixa';
            toast.error(message);
            return { success: false, message };
        }
    };

    const updateFixedExpensePayment = async(id, isPaid, bankAccountId) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const payload = { is_paid: isPaid };
            if (bankAccountId) payload.bank_account_id = bankAccountId;
            const response = await api.put(`/financial/fixed-expenses/${id}/pay`, payload);
            if (response.data.success) {
                const paidInstallments = response.data.fixed_expense?.paid_installments;
                setFixedExpenses(prev =>
                    prev.map(exp => exp.id === id ? {...exp, is_paid: isPaid, paid_installments: paidInstallments !== undefined ? paidInstallments : exp.paid_installments } : exp)
                );
                await loadBankAccounts(); // Atualizar saldos
                await loadSummary(); // Atualiza o overview
                toast.success('Status de pagamento atualizado!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao atualizar status');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar status';
            toast.error(message);
            return { success: false, message };
        }
    };

    // ===== RESUMO E RELATÓRIOS =====
    const loadSummary = async(period = 'month') => {
        try {
            if (!shouldLoadData()) return;

            const response = await api.get(`/financial/summary?period=${period}`);
            if (response.data.success) {
                setSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
        }
    };

    const loadFinancialAdvice = async() => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };

            // Aumenta o timeout apenas para esta requisição
            const response = await api.get('/financial/financial-advice', { timeout: 30000 });
            if (response.data.success) {
                setFinancialAdvice(response.data.advice);
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao carregar conselho financeiro';
            toast.error(message);
            return { success: false, message };
        }
    };

    // Carrega o último conselho salvo do backend
    const loadLastFinancialAdvice = async() => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.get('/financial/financial-advice/last', { timeout: 10000 });
            if (response.data.success && response.data.advice) {
                setFinancialAdvice({
                    advice: response.data.advice.advice,
                    timestamp: response.data.advice.created_at,
                    success: true
                });
                return { success: true };
            } else {
                setFinancialAdvice(null);
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            setFinancialAdvice(null);
            return { success: false, message: 'Erro ao buscar último conselho.' };
        }
    };

    // ===== UTILITÁRIOS =====
    const refreshData = async() => {
        await loadInitialData();
    };

    const getTotalIncome = () => {
        return (income || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    };

    const getTotalExpenses = () => {
        return (expenses || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    };

    const getTotalFixedExpenses = () => {
        return (fixedExpenses || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    };

    const getTotalBankBalance = () => {
        return (bankAccounts || []).reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
    };

    const getExpensesByMethod = () => {
        return (expenses || []).reduce((acc, expense) => {
            const method = expense.payment_method;
            acc[method] = (acc[method] || 0) + parseFloat(expense.amount || 0);
            return acc;
        }, {});
    };

    // Atualizar conta associada a uma despesa fixa
    const updateFixedExpenseAccount = async(expenseId, updateData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.put(`/financial/fixed-expenses/${expenseId}`, updateData);
            if (response.data.success) {
                setFixedExpenses(prev => prev.map(item => item.id === expenseId ? {...item, ...updateData, ...response.data.fixed_expense } : item));
                await loadBankAccounts();
                await loadSummary();
                toast.success('Conta da despesa fixa atualizada com sucesso!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Erro ao atualizar despesa fixa');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar despesa fixa';
            toast.error(message);
            return { success: false, message };
        }
    };

    const value = {
        // Estados
        income,
        expenses,
        fixedExpenses,
        bankAccounts,
        summary,
        financialAdvice,
        isLoading,

        // Funções de carregamento
        loadIncome,
        loadExpenses,
        loadFixedExpenses,
        loadBankAccounts,
        loadSummary,
        loadFinancialAdvice,
        loadLastFinancialAdvice, // <-- Adicionado aqui

        // Funções de criação
        createIncome,
        createExpense,
        createFixedExpense,
        createBankAccount,
        deleteBankAccount,
        deleteFixedExpense, // <-- Adicionado
        deleteIncome, // <-- Corrigido: agora exporta deleteIncome
        deleteExpense, // <-- Corrigido: agora exporta deleteExpense

        // Funções de atualização
        updateFixedExpensePayment,
        updateBankAccount, // <-- Adicionado aqui
        updateIncome, // <-- Adicionado aqui
        updateExpense, // <-- Nova função
        updateFixedExpenseAccount, // <-- Nova função

        // Utilitários
        refreshData,
        resetData,
        getTotalIncome,
        getTotalExpenses,
        getTotalFixedExpenses,
        getTotalBankBalance,
        getExpensesByMethod,
        loadInitialData // <-- Adicionado para exportar corretamente
    };

    return ( <
        FinancialContext.Provider value = { value } > { children } <
        /FinancialContext.Provider>
    );
};