import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Input } from '../ui';
import {
    TrendingUp,
    Search,
    Plus,
    Calendar,
    DollarSign,
    Building,
    FileText,
    Filter
} from 'lucide-react';

const IncomeForm = () => {
    const {
        income,
        bankAccounts,
        createIncome,
        loadIncome,
        deleteIncome,
        updateIncome
    } = useFinancial();

    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');

    const [formData, setFormData] = useState({
        amount: '',
        income_date: new Date().toISOString().split('T')[0],
        source: '',
        description: '',
        bank_account_id: ''
    });

    // Estado para loading de exclusão por id
    const [deletingId, setDeletingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingAccountId, setEditingAccountId] = useState('');

    useEffect(() => {
        loadIncome();
    }, [loadIncome]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };



    const handleEditAccount = (item) => {
        setEditingId(item.id);
        setEditingAccountId(item.bank_account_id || '');
    };

    const handleSaveAccountEdit = async() => {
        if (!editingId) return;
        await updateIncome(editingId, { bank_account_id: editingAccountId });
        setEditingId(null);
        setEditingAccountId('');
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        if (!formData.amount || !formData.income_date || !formData.source) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }
        setIsLoading(true);
        try {
            const dataToSend = {...formData };
            if (!dataToSend.bank_account_id) {
                delete dataToSend.bank_account_id;
            }
            let result;
            if (editingId) {
                result = await updateIncome(editingId, dataToSend);
            } else {
                result = await createIncome(dataToSend);
            }
            if (result.success) {
                setFormData({
                    amount: '',
                    income_date: new Date().toISOString().split('T')[0],
                    source: '',
                    description: '',
                    bank_account_id: ''
                });
                setShowForm(false);
                setEditingId(null);
            }
        } catch (error) {
            console.error('Erro ao registrar ganho:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        const filters = {};
        if (searchTerm) filters.source = searchTerm;
        if (dateFilter) filters.start_date = dateFilter;
        if (sourceFilter) filters.source = sourceFilter;

        loadIncome(filters);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setDateFilter('');
        setSourceFilter('');
        loadIncome();
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

    const filteredIncome = income.filter(item => {
        const matchesSearch = !searchTerm ||
            item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDate = !dateFilter || item.income_date === dateFilter;
        const matchesSource = !sourceFilter || item.source === sourceFilter;

        return matchesSearch && matchesDate && matchesSource;
    });

    return ( <
        div className = "max-w-6xl mx-auto" > { /* Header */ } <
        div className = "flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6" >
        <
        div >
        <
        h2 className = "text-2xl font-bold text-gray-900 dark:text-light" >
        Registrar Ganhos <
        /h2> <
        p className = "text-gray-600 dark:text-light mt-1" >
        Gerencie suas receitas e fontes de renda <
        /p> <
        /div>

        <
        button onClick = {
            () => setShowForm(!showForm) }
        className = "btn-primary flex items-center space-x-2 mt-4 sm:mt-0" >
        <
        Plus className = "w-4 h-4" / >
        <
        span > { showForm ? 'Cancelar' : 'Novo Ganho' } < /span> <
        /button> <
        /div>

        { /* Formulário */ } {
            showForm && ( <
                div className = "card mb-6" >
                <
                h3 className = "text-lg font-semibold text-gray-900 dark:text-light mb-4" >
                Novo Ganho <
                /h3>

                <
                form onSubmit = { handleSubmit }
                className = "grid md:grid-cols-2 gap-6" > { /* Valor */ } <
                Input type = "number"
                name = "amount"
                label = "Valor *"
                leftIcon = { DollarSign }
                value = { formData.amount }
                onChange = { handleInputChange }
                placeholder = "0.00"
                step = "0.01"
                min = "0.01"
                required /
                >

                { /* Data */ } <
                Input type = "date"
                name = "income_date"
                label = "Data *"
                leftIcon = { Calendar }
                value = { formData.income_date }
                onChange = { handleInputChange }
                required /
                >

                { /* Origem */ } <
                Input type = "text"
                name = "source"
                label = "Origem *"
                leftIcon = { Building }
                value = { formData.source }
                onChange = { handleInputChange }
                placeholder = "Ex: Salário, Freelance, Investimentos"
                required /
                >

                { /* Conta Bancária */ } <
                div >
                <
                label className = "block text-sm font-medium text-gray-700 dark:text-light mb-2" >
                Conta Bancária <
                /label> <
                select name = "bank_account_id"
                value = { formData.bank_account_id }
                onChange = { handleInputChange }
                className = "input-primary" >
                <
                option value = "" > Selecione uma conta < /option> {
                    bankAccounts.filter(account => account.account_category === 'debito').map(account => ( <
                        option key = { account.id }
                        value = { account.id } > { account.account_name } - { formatCurrency(account.balance) } <
                        /option>
                    ))
                } <
                /select> <
                /div>

                { /* Descrição */ } <
                div className = "md:col-span-2" >
                <
                label className = "block text-sm font-medium text-gray-700 dark:text-light mb-2" >
                Descrição <
                /label> <
                div className = "relative" >
                <
                FileText className = "absolute left-3 top-3 text-gray-400 w-5 h-5" / >
                <
                textarea name = "description"
                value = { formData.description }
                onChange = { handleInputChange }
                className = "input-primary pl-10"
                rows = "3"
                placeholder = "Descrição adicional do ganho..." /
                >
                <
                /div> <
                /div>

                { /* Botões */ } <
                div className = "md:col-span-2 flex justify-end space-x-3" >
                <
                button type = "button"
                onClick = {
                    () => { setShowForm(false);
                        setEditingId(null); } }
                className = "btn-outline" >
                Cancelar <
                /button> <
                button type = "submit"
                disabled = { isLoading }
                className = "btn-primary" >
                {
                    isLoading ? ( <
                        div className = "flex items-center space-x-2" >
                        <
                        div className = "spinner w-4 h-4" > < /div> <
                        span > { editingId ? 'Salvando...' : 'Registrando...' } < /span> <
                        /div>
                    ) : (
                        editingId ? 'Salvar Alterações' : 'Registrar Ganho'
                    )
                } <
                /button> <
                /div> <
                /form> <
                /div>
            )
        }

        { /* Filtros */ } <
        div className = "card mb-6" >
        <
        div className = "flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4" >
        <
        h3 className = "text-lg font-semibold text-gray-900 dark:text-light" >
        Filtros e Pesquisa <
        /h3>

        <
        div className = "flex flex-col sm:flex-row gap-3 w-full lg:w-auto" >
        <
        div className = "relative" >
        <
        Search className = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" / >
        <
        input type = "text"
        placeholder = "Pesquisar por origem ou descrição..."
        value = { searchTerm }
        onChange = {
            (e) => setSearchTerm(e.target.value) }
        className = "input-primary pl-10 pr-4 w-full sm:w-64 relative z-0" /
        >
        <
        /div>

        <
        input type = "date"
        value = { dateFilter }
        onChange = {
            (e) => setDateFilter(e.target.value) }
        className = "input-primary" /
        >

        <
        button onClick = { handleSearch }
        className = "btn-primary flex items-center justify-center space-x-2" >
        <
        Filter className = "w-4 h-4" / >
        <
        span > Filtrar < /span> <
        /button>

        <
        button onClick = { handleClearFilters }
        className = "btn-outline" >
        Limpar <
        /button> <
        /div> <
        /div> <
        /div>

        { /* Lista de Ganhos */ } <
        div className = "card" >
        <
        div className = "flex items-center justify-between mb-4" >
        <
        h3 className = "text-lg font-semibold text-gray-900 dark:text-light" >
        Ganhos Registrados <
        /h3> <
        span className = "text-sm text-gray-500 dark:text-gray-400" > { filteredIncome.length }
        ganho(s) encontrado(s) <
        /span> <
        /div>

        {
            filteredIncome.length === 0 ? ( <
                div className = "text-center py-8" >
                <
                TrendingUp className = "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" / >
                <
                p className = "text-gray-500 dark:text-gray-400" >
                Nenhum ganho registrado ainda <
                /p> <
                /div>
            ) : ( <
                div className = "overflow-x-auto" >
                <
                table className = "w-full" >
                <
                thead >
                <
                tr className = "border-b border-gray-200 dark:border-gray-700" >
                <
                th className = "text-left py-3 px-4 font-medium text-gray-700 dark:text-light" >
                Data <
                /th> <
                th className = "text-left py-3 px-4 font-medium text-gray-700 dark:text-light" >
                Origem <
                /th> <
                th className = "text-left py-3 px-4 font-medium text-gray-700 dark:text-light" >
                Valor <
                /th> <
                th className = "text-left py-3 px-4 font-medium text-gray-700 dark:text-light" >
                Conta <
                /th> <
                th className = "text-left py-3 px-4 font-medium text-gray-700 dark:text-light" >
                Descrição <
                /th> <
                th className = "text-left py-3 px-4 font-medium text-gray-700 dark:text-light text-center" >
                Ações <
                /th> <
                /tr> <
                /thead> <
                tbody > {
                    filteredIncome.map((item) => ( <
                        tr key = { item.id }
                        className = "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-lighter" >
                        <
                        td className = "py-3 px-4 text-gray-900 dark:text-light" > { formatDate(item.income_date) } <
                        /td> <
                        td className = "py-3 px-4 text-gray-900 dark:text-light font-medium" > { item.source } <
                        /td> <
                        td className = "py-3 px-4 text-primary font-bold" > { formatCurrency(item.amount) } <
                        /td> <
                        td className = "py-3 px-4 text-gray-600 dark:text-light" > {
                            editingId === item.id ? ( <
                                select value = { editingAccountId }
                                onChange = { e => setEditingAccountId(e.target.value) }
                                className = "input-primary" >
                                <
                                option value = "" > Selecione uma conta < /option> {
                                    bankAccounts.filter(account => account.account_category === 'debito').map(account => ( <
                                        option key = { account.id }
                                        value = { account.id } > { account.account_name } - { formatCurrency(account.balance) } <
                                        /option>
                                    ))
                                } <
                                /select>
                            ) : (
                                item.account_name || 'Não especificada'
                            )
                        } <
                        /td> <
                        td className = "py-3 px-4 text-gray-600 dark:text-light" > { item.description || '-' } <
                        /td> <
                        td className = "py-3 px-4 text-center" > {
                            editingId === item.id ? ( <
                                >
                                <
                                button className = "btn-primary btn-xs mr-2"
                                onClick = { handleSaveAccountEdit }
                                disabled = {!editingAccountId } >
                                Salvar < /button> <
                                button className = "btn-outline btn-xs"
                                onClick = {
                                    () => { setEditingId(null);
                                        setEditingAccountId(''); } } >
                                Cancelar < /button> <
                                />
                            ) : ( <
                                button className = "p-2 rounded-full text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                                title = "Editar conta do ganho"
                                onClick = {
                                    () => handleEditAccount(item) } >
                                <
                                svg xmlns = "http://www.w3.org/2000/svg"
                                className = "w-5 h-5"
                                fill = "none"
                                viewBox = "0 0 24 24"
                                stroke = "currentColor" > < path strokeLinecap = "round"
                                strokeLinejoin = "round"
                                strokeWidth = { 2 }
                                d = "M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l10.293-10.293a1 1 0 00-1.414-1.414L3 17z" / > < /svg> <
                                /button>
                            )
                        } <
                        button className = "p-2 rounded-full text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title = "Excluir ganho"
                        disabled = { deletingId === item.id }
                        onClick = {
                            async() => {
                                if (window.confirm('Tem certeza que deseja excluir este ganho?')) {
                                    setDeletingId(item.id);
                                    await deleteIncome(item.id);
                                    setDeletingId(null);
                                }
                            }
                        } >
                        {
                            deletingId === item.id ? ( <
                                div className = "spinner w-5 h-5 mx-auto" > < /div>
                            ) : ( <
                                svg xmlns = "http://www.w3.org/2000/svg"
                                className = "w-5 h-5"
                                fill = "none"
                                viewBox = "0 0 24 24"
                                stroke = "currentColor" > < path strokeLinecap = "round"
                                strokeLinejoin = "round"
                                strokeWidth = { 2 }
                                d = "M6 18L18 6M6 6l12 12" / > < /svg>
                            )
                        } <
                        /button> <
                        /td> <
                        /tr>
                    ))
                } <
                /tbody> <
                /table> <
                /div>
            )
        } <
        /div> <
        /div>
    );
};

export default IncomeForm;