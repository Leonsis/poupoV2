import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  FileText,
  PiggyBank,
  Download,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, Button, useNotifications, PrivacyValue } from '../ui';
import jsPDF from 'jspdf';

const DetailedSummaries = () => {
  const { 
    loadSummary, 
    checkMonthlySummaryGeneration, 
    generateMonthlySummary, 
    listMonthlySummaries, 
    getMonthlySummary,
    generateAllPendingSummaries 
  } = useFinancial();
  const { user } = useAuth();
  const { isPrivacyMode } = usePrivacy();
  const { showError, showSuccess } = useNotifications();
  const location = useLocation();
  
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generatingSummaries, setGeneratingSummaries] = useState(false);

  // Gerar lista de meses disponíveis a partir da data de criação da conta
  const generateAvailableMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    // Data de criação da conta do usuário
    const userCreatedAt = user?.created_at ? new Date(user.created_at) : new Date();
    const userCreatedMonth = new Date(userCreatedAt.getFullYear(), userCreatedAt.getMonth(), 1);
    
    // Calcular quantos meses se passaram desde a criação da conta
    const monthsSinceCreation = (currentDate.getFullYear() - userCreatedAt.getFullYear()) * 12 + 
                               (currentDate.getMonth() - userCreatedAt.getMonth());
    
    // Gerar meses a partir da criação da conta até o mês atual
    for (let i = 0; i <= monthsSinceCreation; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      
      // Parar se chegou ao mês anterior à criação da conta
      if (date < userCreatedMonth) {
        break;
      }
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      months.push({
        value: monthYear,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      });
    }
    
    return months;
  };

  const availableMonths = generateAvailableMonths();

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        await loadSummaries();
        await checkForPendingSummaries();
      };
      loadData();
    }
  }, [selectedPeriod, selectedMonth, user]);

  // Forçar atualização quando navegar para esta página
  useEffect(() => {
    if (user && location.pathname === '/dashboard/detailed-summaries') {
      console.log('🔄 Navegação detectada, recarregando resumos...');
      loadSummaries();
    }
  }, [location.pathname, user]);

  // Atualizar dados automaticamente a cada 30 segundos quando estiver na página
  useEffect(() => {
    if (user && location.pathname === '/dashboard/detailed-summaries') {
      const interval = setInterval(() => {
        console.log('🔄 Atualização automática dos resumos...');
        loadSummaries();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [location.pathname, user]);

  // Verificar se há resumos pendentes para gerar
  const checkForPendingSummaries = async () => {
    try {
      console.log('🔍 Verificando resumos pendentes...');
      const result = await checkMonthlySummaryGeneration();
      console.log('📊 Resultado da verificação:', result);
      
      if (result.success && result.needsGeneration) {
        console.log('✅ Mostrando modal de geração');
        setShowGenerationModal(true);
      } else {
        console.log('ℹ️ Modal não será exibido:', result.reason || 'Não necessário');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar resumos pendentes:', error);
    }
  };

  // Gerar resumo do mês anterior
  const handleGenerateLastMonthSummary = async () => {
    try {
      const result = await checkMonthlySummaryGeneration();
      if (result.success && result.needsGeneration) {
        const generateResult = await generateMonthlySummary(result.monthYear);
        if (generateResult.success) {
          showSuccess(`Resumo de ${result.lastMonthName} gerado com sucesso!`);
          setShowGenerationModal(false);
          loadSummaries(); // Recarregar lista
        } else {
          showError(generateResult.message || 'Erro ao gerar resumo');
        }
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      showError('Erro ao gerar resumo mensal');
    }
  };

  // Gerar todos os resumos pendentes
  const handleGenerateAllPendingSummaries = async () => {
    setGeneratingSummaries(true);
    try {
      const result = await generateAllPendingSummaries();
      if (result.success) {
        showSuccess(`${result.generatedCount} resumos gerados com sucesso!`);
        setShowGenerationModal(false);
        loadSummaries(); // Recarregar lista
      } else {
        showError(result.message || 'Erro ao gerar resumos');
      }
    } catch (error) {
      console.error('Erro ao gerar resumos pendentes:', error);
      showError('Erro ao gerar resumos pendentes');
    } finally {
      setGeneratingSummaries(false);
    }
  };

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const summariesData = [];
      
      if (selectedPeriod === 'month' && selectedMonth) {
        // Primeiro tentar buscar resumo armazenado
        const storedSummary = await getMonthlySummary(selectedMonth);
        if (storedSummary.success && storedSummary.summary) {
          summariesData.push({
            period: selectedMonth,
            label: availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth,
            data: storedSummary.summary,
            isStored: true
          });
        } else {
          // Se não existir resumo armazenado, gerar em tempo real
          const summary = await loadSummary(selectedPeriod, selectedMonth);
          if (summary.success) {
            summariesData.push({
              period: selectedMonth,
              label: availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth,
              data: summary.summary,
              isStored: false
            });
          }
        }
      } else {
        // Listar todos os resumos mensais armazenados
        const storedSummaries = await listMonthlySummaries();
        if (storedSummaries.success) {
          // Converter para o formato esperado
          summariesData.push(...storedSummaries.summaries.map(summary => ({
            period: summary.month_year,
            label: new Date(summary.month_year + '-01').toLocaleDateString('pt-BR', { 
              year: 'numeric', 
              month: 'long' 
            }),
            data: {
              totalIncome: summary.total_income,
              totalExpenses: summary.total_expenses,
              totalFixedExpenses: summary.total_fixed_expenses,
              totalCreditCardExpenses: summary.total_credit_card_expenses,
              balance: summary.balance
            },
            isStored: true,
            createdAt: summary.created_at
          })));
        }
        
        // Se não houver resumos armazenados, carregar em tempo real
        if (summariesData.length === 0) {
          const monthsToLoad = availableMonths.slice(0, 6);
          
          for (const month of monthsToLoad) {
            try {
              const summary = await loadSummary('month', month.value);
              if (summary.success) {
                summariesData.push({
                  period: month.value,
                  label: month.label,
                  data: summary.summary,
                  isStored: false
                });
              }
            } catch (error) {
              console.error(`Erro ao carregar resumo para ${month.label}:`, error);
            }
          }
        }
      }
      
      setSummaries(summariesData);
    } catch (error) {
      console.error('Erro ao carregar resumos:', error);
      showError('Erro ao carregar resumos detalhados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportSummary = (summary) => {
    // Criar novo documento PDF
    const doc = new jsPDF();
    
    // Configurações de estilo
    const titleFontSize = 20;
    const subtitleFontSize = 16;
    const normalFontSize = 12;
    const smallFontSize = 10;
    
    let yPosition = 20;
    
    // Título principal
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro Detalhado', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Período
    doc.setFontSize(subtitleFontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${summary.label}`, 105, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Resumo Geral
    doc.setFontSize(subtitleFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 20, yPosition);
    yPosition += 15;
    
    // Tabela de resumo geral simples
    const summaryItems = [
      { label: 'Receitas', value: formatCurrency(summary.data.totalIncome) },
      { label: 'Despesas', value: formatCurrency(summary.data.totalExpenses) },
      { label: 'Despesas Fixas', value: formatCurrency(summary.data.totalFixedExpenses) },
      { label: 'Gastos no Crédito', value: formatCurrency(summary.data.totalCreditCardExpenses) },
      { label: 'Saldo Final', value: formatCurrency(summary.data.balance) }
    ];
    
    summaryItems.forEach((item, index) => {
      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 150, yPosition, { align: 'right' });
      yPosition += 8;
    });
    
    yPosition += 15;
    
    // Verificar se há espaço suficiente para continuar
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Receitas Detalhadas
    if (summary.data.incomeDetails?.length > 0) {
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Receitas Detalhadas', 20, yPosition);
      yPosition += 15;
      
      summary.data.incomeDetails.forEach((income, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(smallFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatDate(income.income_date)} - ${income.source}`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(income.amount), 150, yPosition, { align: 'right' });
        yPosition += 6;
        
        if (income.description) {
          doc.setFontSize(10);
          doc.text(`  ${income.description}`, 25, yPosition);
          yPosition += 6;
        }
        
        yPosition += 3;
      });
      
      yPosition += 10;
    }
    
    // Despesas Detalhadas
    if (summary.data.expensesDetails?.length > 0) {
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Despesas Detalhadas', 20, yPosition);
      yPosition += 15;
      
      summary.data.expensesDetails.forEach((expense, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(smallFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatDate(expense.expense_date)} - ${expense.description}`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(expense.amount), 150, yPosition, { align: 'right' });
        yPosition += 6;
        
        if (expense.category) {
          doc.setFontSize(10);
          doc.text(`  Categoria: ${expense.category} | Método: ${expense.payment_method}`, 25, yPosition);
          yPosition += 6;
        }
        
        yPosition += 3;
      });
      
      yPosition += 10;
    }
    
    // Despesas Fixas
    if (summary.data.fixedExpensesDetails?.length > 0) {
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Despesas Fixas', 20, yPosition);
      yPosition += 15;
      
      summary.data.fixedExpensesDetails.forEach((fixed, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(smallFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(`${fixed.description} - Vencimento: ${fixed.due_date}º`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(fixed.amount), 150, yPosition, { align: 'right' });
        yPosition += 6;
        
        doc.setFontSize(10);
        doc.text(`  Status: ${fixed.is_paid ? 'Paga' : 'Pendente'}`, 25, yPosition);
        yPosition += 6;
        
        yPosition += 3;
      });
      
      yPosition += 10;
    }
    
    // Gastos no Cartão de Crédito
    if (summary.data.creditCardExpensesDetails?.length > 0) {
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Gastos no Cartão de Crédito', 20, yPosition);
      yPosition += 15;
      
      summary.data.creditCardExpensesDetails.forEach((credit, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(smallFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatDate(credit.expense_date)} - ${credit.description}`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(credit.amount), 150, yPosition, { align: 'right' });
        yPosition += 6;
        
        if (credit.category) {
          doc.setFontSize(10);
          doc.text(`  Categoria: ${credit.category}`, 25, yPosition);
          yPosition += 6;
        }
        
        yPosition += 3;
      });
      
      yPosition += 10;
    }
    
    // Contas Bancárias
    if (summary.data.bankAccounts?.length > 0) {
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Contas Bancárias', 20, yPosition);
      yPosition += 15;
      
      summary.data.bankAccounts.forEach((account, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(smallFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(`${account.account_name} - ${account.account_type}`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(account.balance), 150, yPosition, { align: 'right' });
        yPosition += 6;
        
        if (account.credit_limit) {
          doc.setFontSize(10);
          doc.text(`  Limite: ${formatCurrency(account.credit_limit)}`, 25, yPosition);
          yPosition += 6;
        }
        
        yPosition += 3;
      });
    }
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(smallFontSize);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Salvar o PDF
    const fileName = `resumo-financeiro-${summary.period}.pdf`;
    doc.save(fileName);
    
    showSuccess('Resumo exportado em PDF com sucesso!');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-8 h-8"></div>
          <span className="ml-3 text-gray-600 dark:text-light">Carregando resumos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-light">
            Resumos Detalhados
          </h2>
          <p className="text-gray-600 dark:text-light mt-1">
            Visualize resumos financeiros detalhados por período
          </p>
          {loading && (
            <div className="flex items-center mt-2 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Atualizando dados...
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
              Período
            </label>
            <select
              className="input-primary w-full"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="month">Mensal</option>
              <option value="week">Semanal</option>
              <option value="year">Anual</option>
            </select>
          </div>
          
          {selectedPeriod === 'month' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                Mês Específico (opcional)
              </label>
                             <select
                 className="input-primary w-full"
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value)}
               >
                 <option value="">Meses disponíveis (máximo 6)</option>
                {availableMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-end">
            <Button
              onClick={() => {
                console.log('🔄 Atualização manual solicitada...');
                setLoading(true);
                loadSummaries().finally(() => {
                  setLoading(false);
                  showSuccess('Dados atualizados com sucesso!');
                });
              }}
              className="btn-primary"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      </div>

             {/* Lista de Resumos */}
       {availableMonths.length === 0 ? (
         <div className="card text-center py-12">
           <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
           <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
             Bem-vindo aos Resumos Detalhados!
           </h3>
           <p className="text-gray-500 dark:text-gray-400 mb-2">
             Você acabou de criar sua conta - parabéns! 🎉
           </p>
           <p className="text-gray-500 dark:text-gray-400 mb-4">
             Os resumos financeiros detalhados serão gerados automaticamente após você ter pelo menos um mês completo de movimentações financeiras.
           </p>
           <p className="text-sm text-gray-400 dark:text-gray-500">
             Continue registrando suas receitas, despesas e despesas fixas. Seu primeiro resumo ficará disponível no próximo mês!
           </p>
         </div>
       ) : summaries.length === 0 ? (
         <div className="card text-center py-12">
           <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
           <p className="text-gray-500 dark:text-gray-400">
             Nenhum resumo encontrado para o período selecionado
           </p>
         </div>
      ) : (
        <div className="space-y-6">
          {summaries.map((summary) => (
            <Card key={summary.period} className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{summary.label}</h3>
                    <p className="text-[#2a3236]">Resumo Financeiro Detalhado</p>
                    <div className="flex items-center mt-2">
                      {summary.isStored ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          <Download className="w-3 h-3 mr-1" />
                          Armazenado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Tempo Real
                        </span>
                      )}
                      {summary.createdAt && (
                        <span className="ml-2 text-xs opacity-75">
                          Gerado em: {new Date(summary.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportSummary(summary)}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {/* Resumo Geral */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-xl md:text-3xl font-bold text-green-600 mb-2">
                      <PrivacyValue isPrivacyMode={isPrivacyMode}>
                      {formatCurrency(summary.data.totalIncome)}
                      </PrivacyValue>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-light flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Receitas
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl md:text-3xl font-bold text-red-600 mb-2">
                      <PrivacyValue isPrivacyMode={isPrivacyMode}>
                      {formatCurrency(summary.data.totalExpenses)}
                      </PrivacyValue>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-light flex items-center justify-center">
                      <TrendingDown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Despesas
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl md:text-3xl font-bold text-orange-600 mb-2">
                      <PrivacyValue isPrivacyMode={isPrivacyMode}>
                      {formatCurrency(summary.data.totalFixedExpenses)}
                      </PrivacyValue>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-light flex items-center justify-center">
                      <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Despesas Fixas
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-xl md:text-3xl font-bold mb-2 ${
                      summary.data.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <PrivacyValue isPrivacyMode={isPrivacyMode}>
                      {formatCurrency(summary.data.balance)}
                      </PrivacyValue>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-light flex items-center justify-center">
                      <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Saldo
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-xl md:text-3xl font-bold mb-2 ${
                      summary.data.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      <PrivacyValue isPrivacyMode={isPrivacyMode}>
                        {formatCurrency(summary.data.net_balance || 0)}
                      </PrivacyValue>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-light flex items-center justify-center">
                      <PiggyBank className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Saldo Líquido
                    </div>
                  </div>
                </div>

                {/* Detalhamento */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Receitas */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-light mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Receitas Detalhadas
                    </h4>
                    {summary.data.incomeDetails?.length > 0 ? (
                      <div className="space-y-3">
                        {summary.data.incomeDetails.map((income, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-light">
                                {income.source}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(income.income_date)}
                                {income.account_name && ` • ${income.account_name}`}
                              </div>
                              {income.description && (
                                <div className="text-sm text-gray-600 dark:text-light mt-1">
                                  {income.description}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                {formatCurrency(income.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        Nenhuma receita registrada
                      </p>
                    )}
                  </div>

                  {/* Despesas */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-light mb-4 flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                      Despesas Detalhadas
                    </h4>
                    {summary.data.expensesDetails?.length > 0 ? (
                      <div className="space-y-3">
                        {summary.data.expensesDetails.map((expense, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-light">
                                {expense.description || 'Sem descrição'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(expense.expense_date)}
                                {expense.account_name && ` • ${expense.account_name}`}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {expense.category && (
                                  <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {expense.category}
                                  </span>
                                )}
                                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {expense.payment_method}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-red-600">
                                {formatCurrency(expense.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        Nenhuma despesa registrada
                      </p>
                    )}
                  </div>

                  {/* Despesas Fixas */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-light mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-orange-600" />
                      Despesas Fixas
                    </h4>
                    {summary.data.fixedExpensesDetails?.length > 0 ? (
                      <div className="space-y-3">
                        {summary.data.fixedExpensesDetails.map((fixed, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-light">
                                {fixed.description}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Vencimento: Dia {fixed.due_date}
                                {fixed.account_name && ` • ${fixed.account_name}`}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {fixed.category && (
                                  <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {fixed.category}
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded text-xs ${
                                  fixed.is_paid 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                  {fixed.is_paid ? 'Paga' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-orange-600">
                                {formatCurrency(fixed.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        Nenhuma despesa fixa registrada
                      </p>
                    )}
                  </div>

                  {/* Cartão de Crédito */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-light mb-4 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                      Cartão de Crédito
                    </h4>
                    {summary.data.creditCardExpensesDetails?.length > 0 ? (
                      <div className="space-y-3">
                        {summary.data.creditCardExpensesDetails.map((credit, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-light">
                                {credit.description || 'Sem descrição'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(credit.expense_date)}
                                {credit.account_name && ` • ${credit.account_name}`}
                              </div>
                              {credit.category && (
                                <div className="mt-1">
                                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {credit.category}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-600">
                                {formatCurrency(credit.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        Nenhum gasto com cartão de crédito
                      </p>
                    )}
                  </div>
                </div>

                {/* Contas Bancárias */}
                {summary.data.bankAccounts?.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-light mb-4 flex items-center">
                      <PiggyBank className="w-5 h-5 mr-2 text-purple-600" />
                      Contas Bancárias Visíveis
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {summary.data.bankAccounts.filter(account => account.is_visible !== 0 && account.is_visible !== false).map((account, index) => (
                        <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                          <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900 dark:text-light">
                            {account.account_name}
                          </div>
                            <div className="flex items-center space-x-2">
                              {account.account_type === 'poupanca' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                  <PiggyBank className="w-3 h-3 mr-1" />
                                  Poupança
                                </span>
                              )}
                              {account.account_category === 'credito' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Crédito
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {account.account_category === "credito" ? (
                              "Cartão de Crédito"
                            ) : (
                              `${account.account_type} • ${account.account_category}`
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Saldo:</span> 
                              <span className={`ml-1 font-semibold ${
                                account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                <PrivacyValue isPrivacyMode={isPrivacyMode}>
                                  {formatCurrency(account.balance)}
                                </PrivacyValue>
                              </span>
                            </div>
                            {account.account_category === "credito" && account.credit_limit && (
                              <div className="text-sm">
                                <span className="font-medium">Limite:</span> 
                                <span className="ml-1 font-semibold text-purple-600">
                                  <PrivacyValue isPrivacyMode={isPrivacyMode}>
                                    {formatCurrency(account.credit_limit)}
                                  </PrivacyValue>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Contas Invisíveis (apenas para informação) */}
                    {summary.data.bankAccounts.filter(account => account.is_visible === 0 || account.is_visible === false).length > 0 && (
                      <div className="mt-6">
                        <h5 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                          <Eye className="w-4 h-4 mr-2 text-gray-500" />
                          Contas Invisíveis (não incluídas no saldo líquido)
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {summary.data.bankAccounts.filter(account => account.is_visible === 0 || account.is_visible === false).map((account, index) => (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 opacity-75">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-600 dark:text-gray-400">
                                  {account.account_name}
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Invisível
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                                {account.account_category === "credito" ? (
                                  "Cartão de Crédito"
                                ) : (
                                  `${account.account_type} • ${account.account_category}`
                                )}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-500">Saldo:</span> 
                                <span className="ml-1 font-semibold text-gray-600 dark:text-gray-400">
                                  <PrivacyValue isPrivacyMode={isPrivacyMode}>
                                    {formatCurrency(account.balance)}
                                  </PrivacyValue>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Geração de Resumos */}
      {showGenerationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-light">
                Resumos Pendentes
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Existem resumos mensais que ainda não foram gerados. Deseja gerá-los agora?
            </p>
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleGenerateLastMonthSummary}
                className="w-full"
                disabled={generatingSummaries}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generatingSummaries ? 'animate-spin' : ''}`} />
                Gerar Último Mês
              </Button>
              
              <Button
                onClick={handleGenerateAllPendingSummaries}
                className="w-full"
                disabled={generatingSummaries}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generatingSummaries ? 'animate-spin' : ''}`} />
                Gerar Todos os Pendentes
              </Button>
              
              <Button
                onClick={() => setShowGenerationModal(false)}
                variant="outline"
                className="w-full"
                disabled={generatingSummaries}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedSummaries;
