const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async generateFinancialAdvice(userData) {
        try {
            const prompt = this.buildFinancialPrompt(userData);
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return {
                success: true,
                advice: text,
                timestamp: require('../utils/dateUtils').getCurrentDateTime()
            };
        } catch (error) {
            console.error('Erro na Gemini API:', error);
            return {
                success: false,
                error: 'Não foi possível gerar conselho financeiro no momento',
                timestamp: require('../utils/dateUtils').getCurrentDateTime()
            };
        }
    }

    buildFinancialPrompt(userData) {
        const {
            income,
            expenses,
            fixedExpenses,
            bankAccounts,
            grossSalary,
            spendingPatterns
        } = userData;

        return `
        Você é um consultor financeiro especializado. Analise os dados financeiros do usuário e forneça conselhos práticos e acionáveis.

        DADOS DO USUÁRIO:
        - Contas bancárias: ${bankAccounts.length}
        
        GANHOS (últimos 3 meses):
        ${this.formatIncomeData(income)}
        
        GASTOS (últimos 3 meses):
        ${this.formatExpenseData(expenses)}
        
        DESPESAS FIXAS:
        ${this.formatFixedExpensesData(fixedExpenses)}
        
        PADRÕES DE GASTO:
        ${this.formatSpendingPatterns(spendingPatterns)}
        
        ÚLTIMO CONSELHO GERADO PELO SISTEMA PARA ESTE USUÁRIO (caso exista):
        ${userData.lastAdvice ? userData.lastAdvice : 'Nenhum conselho anterior.'}
        
        INSTRUÇÕES:
        1. Compare a situação financeira ATUAL do usuário com o último conselho gerado, identificando se houve evolução, estagnação ou retrocesso em relação ao que foi sugerido anteriormente.
        2. Destaque pontos positivos, pontos de atenção e se o usuário seguiu ou não o conselho anterior.
        3. Em seguida, dê um novo conselho para o FUTURO financeiro do usuário, sugerindo um próximo passo ou meta realista.
        4. Seja específico, prático e motivacional.
        5. Use linguagem clara, SEMPRE responda em texto simples, sem formatação Markdown, sem listas, sem títulos, sem negrito, sem itálico, sem emojis.
        
        Responda em português brasileiro, de forma simples, sem formatação, e nunca use Markdown.
        `;
    }

    formatIncomeData(income) {
        if (!income || income.length === 0) {
            return "Nenhum ganho registrado";
        }

        const total = income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const sources = [...new Set(income.map(item => item.source))];
        
        return `
        - Total: R$ ${total.toFixed(2)}
        - Fontes: ${sources.join(', ')}
        - Quantidade de registros: ${income.length}
        `;
    }

    formatExpenseData(expenses) {
        if (!expenses || expenses.length === 0) {
            return "Nenhum gasto registrado";
        }

        const total = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const byMethod = expenses.reduce((acc, item) => {
            acc[item.payment_method] = (acc[item.payment_method] || 0) + parseFloat(item.amount);
            return acc;
        }, {});

        return `
        - Total: R$ ${total.toFixed(2)}
        - Por método de pagamento:
          ${Object.entries(byMethod).map(([method, amount]) => `  * ${method}: R$ ${amount.toFixed(2)}`).join('\n')}
        - Quantidade de registros: ${expenses.length}
        `;
    }

    formatFixedExpensesData(fixedExpenses) {
        if (!fixedExpenses || fixedExpenses.length === 0) {
            return "Nenhuma despesa fixa registrada";
        }

        const total = fixedExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const paid = fixedExpenses.filter(item => item.is_paid).length;
        const unpaid = fixedExpenses.length - paid;

        return `
        - Total mensal: R$ ${total.toFixed(2)}
        - Pagas: ${paid}
        - Pendentes: ${unpaid}
        - Categorias: ${[...new Set(fixedExpenses.map(item => item.category))].join(', ')}
        `;
    }

    formatSpendingPatterns(patterns) {
        if (!patterns) return "Padrões não disponíveis";

        return `
        - Maior categoria de gasto: ${patterns.topCategory || 'N/A'}
        - Média de gastos por dia: R$ ${patterns.averageDaily || 'N/A'}
        - Dias com mais gastos: ${patterns.peakDays || 'N/A'}
        - Tendência: ${patterns.trend || 'N/A'}
        `;
    }

    async analyzeSpendingTrends(expenses) {
        try {
            const prompt = `
            Analise os seguintes gastos e identifique padrões e tendências:
            
            ${expenses.map(exp => `- ${exp.expense_date}: R$ ${exp.amount} (${exp.payment_method}) - ${exp.description}`).join('\n')}
            
            Forneça:
            1. Categorias de gastos mais frequentes
            2. Padrões temporais (dias da semana, mês)
            3. Tendências de aumento/diminuição
            4. Alertas sobre gastos excessivos
            
            Responda de forma concisa e estruturada.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            
            return {
                success: true,
                analysis: response.text(),
                timestamp: require('../utils/dateUtils').getCurrentDateTime()
            };
        } catch (error) {
            console.error('Erro na análise de tendências:', error);
            return {
                success: false,
                error: 'Não foi possível analisar as tendências',
                timestamp: require('../utils/dateUtils').getCurrentDateTime()
            };
        }
    }

    async generateSavingsGoals(userData) {
        try {
            const prompt = `
            Com base nos dados financeiros do usuário, sugira metas de economia realistas e acionáveis.
            
            DADOS:
            - Salário: R$ ${userData.grossSalary}
            - Gastos mensais médios: R$ ${userData.averageMonthlyExpenses || 'N/A'}
            - Economia atual: R$ ${userData.currentSavings || 'N/A'}
            
            SUGESTÕES:
            1. Meta de economia mensal
            2. Estratégias para atingir a meta
            3. Cronograma sugerido
            4. Benefícios de cada meta
            
            Seja específico e motivacional.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            
            return {
                success: true,
                goals: response.text(),
                timestamp: require('../utils/dateUtils').getCurrentDateTime()
            };
        } catch (error) {
            console.error('Erro na geração de metas:', error);
            return {
                success: false,
                error: 'Não foi possível gerar metas de economia',
                timestamp: require('../utils/dateUtils').getCurrentDateTime()
            };
        }
    }
}

module.exports = new GeminiService();
