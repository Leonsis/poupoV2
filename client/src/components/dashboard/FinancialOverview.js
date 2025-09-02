import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button, Card, StatCard } from '../ui';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Brain,
  RefreshCw,
  Calendar,
  FileText
} from 'lucide-react';

const FinancialOverview = () => {
  const { 
    summary, 
    financialAdvice, 
    loadSummary, 
    loadFinancialAdvice,
    loadLastFinancialAdvice, // <-- Importa função do contexto
    loadBankAccounts,
    getTotalBankBalance,
    getExpensesByMethod,
    bankAccounts, // <-- Adicionado aqui
    resetMonthlyData
  } = useFinancial();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Só carregar dados se o usuário estiver autenticado
    const token = localStorage.getItem('token');
    if (token) {
      loadSummary(selectedPeriod);
      loadLastFinancialAdvice(); // <-- Carrega o último conselho salvo ao abrir
    }
  }, [selectedPeriod, loadSummary, loadLastFinancialAdvice]);

  // Forçar atualização quando o componente for montado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔄 FinancialOverview montado, carregando dados...');
      loadSummary(selectedPeriod);
      loadBankAccounts();
    }
  }, []); // Executar apenas uma vez ao montar

  // Atualizar dados automaticamente a cada 30 segundos
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const interval = setInterval(() => {
        console.log('🔄 Atualização automática da Visão Geral...');
        loadSummary(selectedPeriod);
        loadBankAccounts();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [selectedPeriod, loadSummary, loadBankAccounts]);

  const handleLoadAdvice = async () => {
    setIsLoadingAdvice(true);
    try {
      await loadFinancialAdvice();
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleUpdateData = async () => {
    try {
      await loadSummary(selectedPeriod);
      await loadBankAccounts();
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
    }
  };

  const handleResetMonthlyData = async () => {
    setIsResetting(true);
    try {
      await resetMonthlyData();
    } catch (error) {
      console.error('Erro ao resetar dados mensais:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPeriodLabel = (period) => {
    const labels = {
      day: 'Hoje',
      week: 'Esta Semana',
      month: 'Este Mês',
      year: 'Este Ano'
    };
    return labels[period] || period;
  };

  // Saldo Líquido: soma dos saldos das contas bancárias de débito
  const getNetBalance = () => {
    // Prioriza o campo do backend se vier correto, senão calcula localmente
    if (summary && typeof summary.net_balance === 'number') {
      return summary.net_balance;
    }
    // Calcula localmente: soma dos saldos das contas de débito
    return (bankAccounts || [])
      .filter(acc => acc.account_category === 'debito')
      .reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
  };

  const expensesByMethod = getExpensesByMethod() || {};

  // Função utilitária para garantir string
  const getAdviceText = (adviceObj) => {
    if (!adviceObj) return '';
    if (typeof adviceObj === 'string') return adviceObj;
    if (typeof adviceObj === 'object' && typeof adviceObj.advice === 'string') return adviceObj.advice;
    return '';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-light">
            Visão Geral Financeira
          </h2>
          <p className="text-gray-600 dark:text-light mt-1">
            Resumo completo das suas finanças e análises inteligentes
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Button
            variant="outline"
            onClick={handleUpdateData}
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={handleResetMonthlyData}
            title="Resetar dados mensais"
            loading={isResetting}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Reset Mensal
          </Button>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-primary"
          >
            <option value="day">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={`Saldo em Contas (${getPeriodLabel(selectedPeriod)})`}
          value={formatCurrency(getTotalBankBalance())}
          icon={TrendingUp}
          trendType="positive"
        />
        
        <StatCard
          title={`Gastos (${getPeriodLabel(selectedPeriod)})`}
          value={formatCurrency(summary?.totalExpenses || 0)}
          icon={TrendingDown}
          trendType="negative"
        />
        
                 <StatCard
           title="Despesas Fixas"
           value={formatCurrency(summary?.totalFixedExpenses || 0)}
           icon={FileText}
         />
         
         <StatCard
           title="Saldo Líquido"
           value={formatCurrency(getNetBalance())}
           icon={PiggyBank}
         />
       </div>

             <div className="grid lg:grid-cols-3 gap-6">
         {/* Saldo por Conta Bancária */}
                  <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                  Saldo por Conta e Cartão
                </h3>
              </Card.Header>
              
              <Card.Content>
             
             <div className="space-y-4">
               {summary?.bankAccounts?.map((account) => {
                 return (
                   <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-lighter rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-primary rounded-full"></div>
                       <div>
                         <h4 className="font-medium text-gray-900 dark:text-light">
                           {account.account_name}
                         </h4>
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                           {account.account_category === 'credito' ? 'Crédito' : 
                            account.account_type === 'corrente' ? 'Conta Corrente' :
                            account.account_type === 'poupanca' ? 'Conta Poupança' :
                            account.account_type === 'investimento' ? 'Conta Investimento' :
                            account.account_type}
                         </p>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                         {account.account_category === 'credito' ? 'Limite' : 'Saldo'}
                       </div>
                       <div className="text-lg font-bold text-gray-900 dark:text-light">
                         {account.account_category === 'credito' 
                           ? formatCurrency(account.credit_limit || 0)
                           : formatCurrency(account.balance || 0)
                         }
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
             </Card.Content>
           </Card>
         </div>

                  {/* Gastos por Método de Pagamento */}
          <div className="lg:col-span-1">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                  Gastos por Método
                </h3>
              </Card.Header>
              
              <Card.Content>
             
             <div className="space-y-3">
               {Object.entries(expensesByMethod).map(([method, amount]) => (
                 <div key={method} className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <div className={`w-3 h-3 rounded-full ${
                       method === 'credito' ? 'bg-blue-500' :
                                                           'bg-purple-500'
                     }`}></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-light capitalize">
                                               {method === 'credito' ? 'Crédito' : 'Débito'}
                     </span>
                   </div>
                   <span className="text-sm font-bold text-gray-900 dark:text-light">
                     {formatCurrency(amount)}
                   </span>
                 </div>
               ))}
             </div>
              </Card.Content>
            </Card>
          </div>
        </div>

      {/* Conselho Financeiro da IA */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-light flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary" />
            <span>Conselho Financeiro Inteligente</span>
          </h3>
          
                     <Button
             variant="primary"
             onClick={handleLoadAdvice}
             loading={isLoadingAdvice}
           >
             <RefreshCw className="w-4 h-4 mr-2" />
             {isLoadingAdvice ? 'Carregando...' : 'Atualizar Conselho'}
           </Button>
        </div>
        
        {financialAdvice ? (
          <div className="prose dark:prose-invert max-w-none">
            {financialAdvice.success && (typeof financialAdvice.advice === 'string' || financialAdvice.advice?.advice) ? (
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-light leading-relaxed">
                  {getAdviceText(financialAdvice.advice)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Última atualização: {new Date(financialAdvice.timestamp || financialAdvice.advice?.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">
                  {financialAdvice.error || financialAdvice.advice?.error || 'Não foi possível gerar conselho financeiro no momento.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Clique em "Atualizar Conselho" para receber análises personalizadas da IA
            </p>
                         <Button
               variant="primary"
               onClick={handleLoadAdvice}
             >
               Obter Primeiro Conselho
             </Button>
          </div>
        )}
      </div>

      {/* Resumo Detalhado */}
      {summary && (
        <Card className="mt-6">
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
              Resumo Detalhado - {getPeriodLabel(selectedPeriod)}
            </h3>
          </Card.Header>
          <Card.Content>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Receitas */}
              <div>
                <h4 className="font-medium text-gray-700 dark:text-light mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  Receitas
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-gray-700 dark:text-light font-medium">Total Ganhos:</span>
                    <span className="font-bold text-green-600">{formatCurrency(summary.totalIncome)}</span>
                  </div>
                  
                  {summary.incomeDetails && summary.incomeDetails.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Detalhamento:</h5>
                      {summary.incomeDetails.map((income) => (
                        <div key={income.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-lighter rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800 dark:text-light">
                              {income.source}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(income.income_date).toLocaleDateString('pt-BR')}
                              {income.account_name && ` • ${income.account_name}`}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(income.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhum ganho registrado neste período
                    </div>
                  )}
                </div>
              </div>
              
              {/* Despesas */}
              <div>
                <h4 className="font-medium text-gray-700 dark:text-light mb-4 flex items-center">
                  <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                  Despesas
                </h4>
                
                <div className="space-y-4">
                  {/* Gastos Variáveis (Débito) */}
                  <div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-3">
                                              <span className="text-gray-700 dark:text-light font-medium">Gastos Variáveis (Débito):</span>
                      <span className="font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</span>
                    </div>
                    
                    {summary.expensesDetails && summary.expensesDetails.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Detalhamento:</h5>
                        {summary.expensesDetails.map((expense) => (
                          <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-lighter rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800 dark:text-light">
                                {expense.description || 'Sem descrição'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
                                <div className="flex items-center gap-1 mt-1">
                                  {expense.bank_account_id && (
                                    <span className="px-1 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      {expense.account_name || `Conta ID: ${expense.bank_account_id}`}
                                    </span>
                                  )}
                                  <span className={`px-1 py-0.5 rounded text-xs ${
                                    expense.payment_method === 'credito'
                                      ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                                      : 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100'
                                  }`}>
                                    {expense.payment_method === 'credito' ? 'Crédito' : 'Débito'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        Nenhum gasto variável registrado neste período
                      </div>
                    )}
                  </div>

                  {/* Gastos com Cartão de Crédito */}
                  {summary.totalCreditCardExpenses > 0 && (
                    <div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
                        <span className="text-gray-700 dark:text-light font-medium">Gastos com Cartão de Crédito:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(summary.totalCreditCardExpenses)}</span>
                      </div>
                      
                      {summary.creditCardExpensesDetails && summary.creditCardExpensesDetails.length > 0 ? (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Detalhamento:</h5>
                          {summary.creditCardExpensesDetails.map((expense) => (
                            <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-lighter rounded">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-800 dark:text-light">
                                  {expense.description || 'Sem descrição'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
                                  {expense.account_name && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {expense.account_name}
                                      </span>
                                      <span className="px-1 py-0.5 rounded text-xs bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100">
                                        Crédito
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(expense.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Despesas Fixas */}
                  <div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg mb-3">
                      <span className="text-gray-700 dark:text-light font-medium">Despesas Fixas:</span>
                      <span className="font-bold text-orange-600">{formatCurrency(summary.totalFixedExpenses || 0)}</span>
                    </div>
                    
                    {summary.fixedExpensesDetails && summary.fixedExpensesDetails.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Detalhamento:</h5>
                        {summary.fixedExpensesDetails.map((expense) => (
                          <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-lighter rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800 dark:text-light">
                                {expense.description}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Vencimento: {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                                {expense.account_name && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                      expense.account_category === 'credito' 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    }`}>
                                      {expense.account_name}
                                    </span>
                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                      expense.account_category === 'credito' 
                                        ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                                        : 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100'
                                    }`}>
                                      {expense.account_category === 'credito' ? 'Crédito' : 'Débito'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-bold text-orange-600">{formatCurrency(expense.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        Nenhuma despesa fixa pendente
                      </div>
                    )}
                  </div>
                  
                  {/* Total Despesas */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Despesas:</span>
                      <span className="text-red-600">{formatCurrency(summary.totalExpenses + (summary.totalFixedExpenses || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t mt-6 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-light">Saldo Líquido:</span>
                <span className={`text-2xl font-bold ${
                  getNetBalance() >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(getNetBalance())}
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default FinancialOverview;
