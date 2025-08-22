import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { testBackendConnection, testRegistration, checkEnvironment } from '../utils/testConnection';
import { Button, Input, Card } from '../components/ui';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  Calendar, 
  Phone, 
  DollarSign,
  PiggyBank,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birth_date: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});

  // Função para testar conexão
  const handleTestConnection = async () => {
    console.log('🧪 Testando conexão...');
    checkEnvironment();
    const isConnected = await testBackendConnection();
    if (isConnected) {
      console.log('✅ Backend está funcionando!');
    } else {
      console.log('❌ Backend não está respondendo');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isLogin) {
      if (!formData.email) newErrors.email = 'Email é obrigatório';
      if (!formData.password) newErrors.password = 'Senha é obrigatória';
    } else {
      if (!formData.name) newErrors.name = 'Nome é obrigatório';
      if (!formData.email) newErrors.email = 'Email é obrigatório';
      if (!formData.password) newErrors.password = 'Senha é obrigatória';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
      if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setErrors({ general: result.message });
        }
      } else {
        console.log('📝 Tentando registrar usuário:', formData);
        
        // Testar conexão primeiro
        const isConnected = await testBackendConnection();
        if (!isConnected) {
          setErrors({ general: 'Erro de conexão com o servidor. Verifique se o backend está rodando.' });
          return;
        }

        // Preparar dados para registro (remover campos vazios)
        const registrationData = {
          name: formData.name,
          email: formData.email,
          password: formData.password
        };

        if (formData.birth_date) registrationData.birth_date = formData.birth_date;
        if (formData.phone) registrationData.phone = formData.phone;

        console.log('📝 Dados de registro:', registrationData);

        const result = await register(registrationData);
        if (!result.success) {
          setErrors({ general: result.message });
        }
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      setErrors({ general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      birth_date: '',
      phone: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark dark:via-dark-light dark:to-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 dark:text-light hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-xl flex items-center justify-center">
              <PiggyBank className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">Poupo</h1>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-light">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h2>
          
          <p className="text-gray-600 dark:text-light mt-2">
            {isLogin ? 'Entre para acessar suas finanças' : 'Comece sua jornada financeira'}
          </p>
          
          {/* Botão de teste de conexão (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={handleTestConnection}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              🧪 Testar Conexão
            </button>
          )}
        </div>

        {/* Formulário */}
        <Card>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erro geral */}
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            {/* Nome (apenas para registro) */}
            {!isLogin && (
              <Input
                type="text"
                name="name"
                label="Nome completo"
                leftIcon={User}
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Digite seu nome completo"
                error={errors.name}
              />
            )}

            {/* Email */}
            <Input
              type="email"
              name="email"
              label="Email"
              leftIcon={Mail}
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              error={errors.email}
            />

            {/* Senha */}
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              label="Senha"
              leftIcon={Lock}
              rightIcon={showPassword ? EyeOff : Eye}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Digite sua senha"
              error={errors.password}
              onRightIconClick={() => setShowPassword(!showPassword)}
            />

            {/* Confirmar senha (apenas para registro) */}
            {!isLogin && (
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                label="Confirmar senha"
                leftIcon={Lock}
                rightIcon={showConfirmPassword ? EyeOff : Eye}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirme sua senha"
                error={errors.confirmPassword}
                onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}

            {/* Campos adicionais para registro */}
            {!isLogin && (
              <>
                {/* Data de nascimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                    Data de nascimento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      className="input-primary pl-10"
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-light mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-primary pl-10"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Botão de submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
                      </form>
          </Card.Content>

          {/* Toggle entre login e registro */}
          <Card.Footer>
            <div className="text-center">
              <p className="text-gray-600 dark:text-light">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              </p>
              <button
                onClick={toggleMode}
                className="text-primary hover:text-primary-dark font-medium mt-1 transition-colors"
              >
                {isLogin ? 'Criar conta gratuita' : 'Fazer login'}
              </button>
            </div>
          </Card.Footer>
        </Card>

        {/* Toggle de tema */}
        <div className="text-center mt-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-dark-light shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isDarkMode ? (
              <div className="flex items-center space-x-2 text-primary">
                <Sun className="w-5 h-5" />
                <span className="text-sm">Modo claro</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-secondary">
                <Moon className="w-5 h-5" />
                <span className="text-sm">Modo escuro</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
