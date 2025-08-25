import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

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

    // Função helper para disparar notificações personalizadas
    const showNotification = useCallback((type, message) => {
        const event = new CustomEvent('showNotification', {
            detail: { type, message }
        });
        window.dispatchEvent(event);
    }, []);

    // Função para verificar se deve carregar dados
    const shouldLoadData = () => {
        const token = localStorage.getItem('token');
        return !!token;
    };

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

    // ===== CONTAS BANCÁRIAS =====
    const loadBankAccounts = useCallback(async() => {
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
    }, []);

    // ===== GANHOS =====
    const loadIncome = useCallback(async(filters = {}) => {
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
    }, []);

    // ===== GASTOS =====
    const loadExpenses = useCallback(async(filters = {}) => {
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
    }, []);

    // ===== DESPESAS FIXAS =====
    const loadFixedExpenses = useCallback(async() => {
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
    }, []);

    // ===== RESUMO E RELATÓRIOS =====
    const loadSummary = useCallback(async(period = 'month', customDate = null) => {
        try {
            if (!shouldLoadData()) return { success: false };

            let url = `/financial/summary?period=${period}`;
            if (customDate) {
                url += `&custom_date=${customDate}`;
            }

            const response = await api.get(url);
            if (response.data.success) {
                // Se não for uma chamada customizada, atualiza o estado global
                if (!customDate) {
                    setSummary(response.data.summary);
                }
                return { success: true, summary: response.data.summary };
            }
            return { success: false };
        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // Função para carregar dados iniciais
    const loadInitialData = useCallback(async() => {
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
    }, [hasLoadedInitialData, loadBankAccounts, loadIncome, loadExpenses, loadFixedExpenses, loadSummary]);

    // Carregar dados iniciais apenas uma vez quando houver token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !hasLoadedInitialData) {
            loadInitialData();
        }
    }, [hasLoadedInitialData, loadInitialData]);

    // Função para resetar dados mensais (primeiro dia do mês)
    const resetMonthlyData = useCallback(async () => {
        try {
            console.log('Iniciando reset mensal dos dados...');
            
            // Resetar apenas os dados que são específicos do mês
            setIncome([]);
            setExpenses([]);
            setFixedExpenses([]);
            setSummary(null);
            
            // Recarregar dados para o novo mês
            await loadInitialData();
            
            console.log('Reset mensal concluído com sucesso');
            
            // Mostrar notificação
            showNotification('success', 'Dados mensais resetados automaticamente para o novo mês!');
            
        } catch (error) {
            console.error('Erro ao resetar dados mensais:', error);
            showNotification('error', 'Erro ao resetar dados mensais');
        }
    }, [loadInitialData, showNotification]);

    // Verificar se é o primeiro dia do mês e resetar dados se necessário
    useEffect(() => {
        const checkAndResetMonthlyData = async () => {
            const today = new Date();
            const isFirstDayOfMonth = today.getDate() === 1;
            
            if (isFirstDayOfMonth) {
                const lastResetKey = `lastMonthlyReset_${today.getFullYear()}_${today.getMonth()}`;
                const lastReset = localStorage.getItem(lastResetKey);
                
                if (!lastReset) {
                    console.log('Primeiro dia do mês detectado. Resetando dados mensais...');
                    try {
                        await resetMonthlyData();
                        localStorage.setItem(lastResetKey, today.toISOString());
                    } catch (error) {
                        console.error('Erro no reset mensal automático:', error);
                    }
                }
            }
        };

        // Verificar imediatamente
        checkAndResetMonthlyData();

        // Verificar a cada hora
        const interval = setInterval(checkAndResetMonthlyData, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [resetMonthlyData]);

    // ===== FUNÇÕES DE CRIAÇÃO =====
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
                showNotification('success', 'Conta bancária criada com sucesso!');
                return { success: true };
            } else {
                return { success: false, message: response.data.message || 'Erro ao criar conta bancária' };
            }
        } catch (error) {
            console.error('Erro ao criar conta bancária:', error);
            
            // Tratar erros de validação do backend
            if (error.response?.status === 400) {
                const errors = error.response?.data?.errors;
                if (errors && errors.length > 0) {
                    const errorMessages = errors.map(err => err.msg).join(', ');
                    showNotification('error', `Erro de validação: ${errorMessages}`);
                    return { success: false, message: errorMessages };
                }
            }
            
            const message = error.response?.data?.message || 'Erro ao criar conta bancária';
            showNotification('error', message);
            return { success: false, message };
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
                showNotification('success', 'Ganho registrado com sucesso!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao registrar ganho';
            showNotification('error', message);
            return { success: false, message };
        }
    };

    const createExpense = async(expenseData) => {
        // Garantir que amount seja um número
        const processedData = {
            ...expenseData,
            amount: parseFloat(expenseData.amount) || 0
        };

        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };

            console.log('Registrando gasto (original):', expenseData);
            console.log('Registrando gasto (processado):', processedData);
            const response = await api.post('/financial/expenses', processedData);
            if (response.data.success) {
                setExpenses(prev => [response.data.expense, ...prev]);
                console.log('Gasto registrado, atualizando saldos...');
                await loadBankAccounts(); // Atualizar saldos
                await loadSummary(); // Atualizar resumo
                showNotification('success', 'Gasto registrado com sucesso!');
                return { success: true };
            }
        } catch (error) {
            // Log detalhado do erro
            if (window.errorLogger) {
                window.errorLogger.log('EXPENSE_ERROR', 'Erro ao registrar gasto', {
                    originalData: expenseData,
                    processedData: processedData,
                    error: {
                        message: error.message,
                        stack: error.stack,
                        response: error.response?.data,
                        status: error.response?.status,
                        statusText: error.response?.statusText
                    },
                    timestamp: new Date().toISOString()
                });
            }

            console.error('Erro detalhado ao registrar gasto:', error);
            console.error('Response data:', error.response?.data);

            // Se houver erros de validação, mostrar os detalhes
            if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
                showNotification('error', `Erro de validação: ${errorMessages}`);
                return { success: false, message: errorMessages };
            }

            const message = error.response?.data?.message || 'Erro ao registrar gasto';
            showNotification('error', message);
            return { success: false, message };
        }
    };

    const createFixedExpense = async(expenseData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.post('/financial/fixed-expenses', expenseData);
            if (response.data.success) {
                setFixedExpenses(prev => [...prev, response.data.fixed_expense]);
                await loadSummary(); // Atualiza o overview
                showNotification('success', 'Despesa fixa registrada com sucesso!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao registrar despesa fixa';
            showNotification('error', message);
            return { success: false, message };
        }
    };

    // ===== FUNÇÕES DE ATUALIZAÇÃO =====
    const updateBankAccount = async(accountId, updateData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            
            console.log('Atualizando conta bancária:', { accountId, updateData });
            const response = await api.put(`/financial/bank-accounts/${accountId}`, updateData);
            
            if (response.data.success) {
                console.log('Resposta da atualização:', response.data);
                
                // Atualizar o estado local com os dados retornados do backend
                setBankAccounts(prev => prev.map(acc => 
                    acc.id === accountId ? {...acc, ...response.data.account } : acc
                ));
                
                await loadSummary(); // Atualiza o overview após atualizar conta
                showNotification('success', 'Conta bancária atualizada com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao atualizar conta bancária');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar conta bancária';
            showNotification('error', message);
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
                showNotification('success', 'Ganho atualizado com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao atualizar ganho');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar ganho';
            showNotification('error', message);
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
                showNotification('success', 'Gasto atualizado com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao atualizar gasto');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar gasto';
            showNotification('error', message);
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
                showNotification('success', 'Status de pagamento atualizado!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao atualizar status');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar status';
            showNotification('error', message);
            return { success: false, message };
        }
    };

    const updateFixedExpenseAccount = async(expenseId, updateData) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.put(`/financial/fixed-expenses/${expenseId}`, updateData);
            if (response.data.success) {
                setFixedExpenses(prev => prev.map(item => item.id === expenseId ? {...item, ...updateData, ...response.data.fixed_expense } : item));
                await loadBankAccounts();
                await loadSummary();
                showNotification('success', 'Conta da despesa fixa atualizada com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao atualizar despesa fixa');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar despesa fixa';
            showNotification('error', message);
            return { success: false, message };
        }
    };

    // ===== FUNÇÕES DE EXCLUSÃO =====
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
                
                // Recarregar dados de ganhos e gastos para remover os que foram deletados
                await loadIncome();
                await loadExpenses();
                await loadSummary(); // Garante consistência
                
                showNotification('success', response.data.message || 'Conta bancária excluída com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao excluir conta bancária');
                return { success: false, message: response.data.message || 'Erro ao excluir conta bancária' };
            }
        } catch (error) {
            console.error('Erro ao excluir conta bancária:', error);
            const message = error.response?.data?.message || 'Erro ao excluir conta bancária';
            showNotification('error', message);
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
                showNotification('success', 'Ganho excluído com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao excluir ganho');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir ganho';
            showNotification('error', message);
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
                showNotification('success', 'Gasto excluído com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao excluir gasto');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir gasto';
            showNotification('error', message);
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
                showNotification('success', 'Despesa fixa excluída com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao excluir despesa fixa');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir despesa fixa';
            showNotification('error', message);
            return { success: false, message };
        }
    };

    // ===== TRANSIÇÃO MENSAL DE DESPESAS FIXAS =====
    const checkMonthlyTransition = useCallback(async() => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.get('/financial/fixed-expenses/check-transition');
            return response.data;
        } catch (error) {
            console.error('Erro ao verificar transição mensal:', error);
            return { success: false, message: 'Erro ao verificar transição mensal' };
        }
    }, [shouldLoadData]);

    const executeMonthlyTransition = useCallback(async() => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.post('/financial/fixed-expenses/execute-transition');
            if (response.data.success) {
                await loadFixedExpenses(); // Recarregar despesas fixas
                showNotification('success', 'Transição mensal executada com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao executar transição mensal');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao executar transição mensal';
            showNotification('error', message);
            return { success: false, message };
        }
    }, [shouldLoadData, loadFixedExpenses, showNotification]);

    const loadFixedExpensesWithTransition = useCallback(async() => {
        try {
            if (!shouldLoadData()) return;
            const response = await api.get('/financial/fixed-expenses/with-transition');
            if (response.data.success) {
                setFixedExpenses(response.data.expenses || []);
            } else {
                setFixedExpenses([]);
            }
        } catch (error) {
            console.error('Erro ao carregar despesas fixas com transição:', error);
            setFixedExpenses([]);
        }
    }, [shouldLoadData]);

    const payOverdueExpense = async(expenseId, bankAccountId) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.post(`/financial/fixed-expenses/${expenseId}/pay-overdue`, {
                bank_account_id: bankAccountId
            });
            if (response.data.success) {
                await loadFixedExpenses(); // Recarregar despesas fixas
                await loadBankAccounts(); // Atualizar saldos
                await loadSummary(); // Atualizar overview
                showNotification('success', 'Despesa vencida paga com sucesso!');
                return { success: true };
            } else {
                showNotification('error', response.data.message || 'Erro ao pagar despesa vencida');
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao pagar despesa vencida';
            showNotification('error', message);
            return { success: false, message };
        }
    };

    const getOverdueExpensesCount = useCallback(async() => {
        try {
            if (!shouldLoadData()) return 0;
            const response = await api.get('/financial/fixed-expenses/overdue-count');
            if (response.data.success) {
                return response.data.count || 0;
            }
            return 0;
        } catch (error) {
            console.error('Erro ao contar despesas vencidas:', error);
            return 0;
        }
    }, [shouldLoadData]);

    // ===== CONSELHOS FINANCEIROS =====
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
            showNotification('error', message);
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

    // ===== RESUMOS MENSAIS =====
    const checkMonthlySummaryGeneration = async() => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.get('/financial/monthly-summaries/check-generation');
            return response.data;
        } catch (error) {
            console.error('Erro ao verificar geração de resumo mensal:', error);
            return { success: false, message: 'Erro ao verificar geração de resumo mensal' };
        }
    };

    const generateMonthlySummary = async(monthYear) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.post('/financial/monthly-summaries/generate', { monthYear });
            return response.data;
        } catch (error) {
            console.error('Erro ao gerar resumo mensal:', error);
            return { success: false, message: 'Erro ao gerar resumo mensal' };
        }
    };

    const listMonthlySummaries = async() => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.get('/financial/monthly-summaries');
            return response.data;
        } catch (error) {
            console.error('Erro ao listar resumos mensais:', error);
            return { success: false, message: 'Erro ao listar resumos mensais' };
        }
    };

    const getMonthlySummary = async(monthYear) => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.get(`/financial/monthly-summaries/${monthYear}`);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar resumo mensal:', error);
            return { success: false, message: 'Erro ao buscar resumo mensal' };
        }
    };

    const generateAllPendingSummaries = async() => {
        try {
            if (!shouldLoadData()) return { success: false, message: 'Usuário não autenticado' };
            const response = await api.post('/financial/monthly-summaries/generate-all-pending');
            return response.data;
        } catch (error) {
            console.error('Erro ao gerar resumos pendentes:', error);
            return { success: false, message: 'Erro ao gerar resumos pendentes' };
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
        loadLastFinancialAdvice,

        // Funções de criação
        createIncome,
        createExpense,
        createFixedExpense,
        createBankAccount,
        deleteBankAccount,
        deleteFixedExpense,
        deleteIncome,
        deleteExpense,

        // Funções de atualização
        updateFixedExpensePayment,
        updateBankAccount,
        updateIncome,
        updateExpense,
        updateFixedExpenseAccount,

        // Utilitários
        refreshData,
        resetData,
        resetMonthlyData,
        getTotalIncome,
        getTotalExpenses,
        getTotalFixedExpenses,
        getTotalBankBalance,
        getExpensesByMethod,
        loadInitialData,

        // Funções de transição mensal
        checkMonthlyTransition,
        executeMonthlyTransition,
        loadFixedExpensesWithTransition,
        payOverdueExpense,
        getOverdueExpensesCount,

        // Funções de resumo mensal
        checkMonthlySummaryGeneration,
        generateMonthlySummary,
        listMonthlySummaries,
        getMonthlySummary,
        generateAllPendingSummaries
    };

    return (
        <FinancialContext.Provider value={value}>
            {children}
        </FinancialContext.Provider>
    );
};
