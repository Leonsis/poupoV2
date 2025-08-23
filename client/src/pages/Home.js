import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card } from '../components/ui';
import { 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Brain, 
  ArrowRight,
  Moon,
  Sun,
  Zap,
  DollarSign,
  PiggyBank
} from 'lucide-react';

const Home = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Controle Total',
      description: 'Gerencie seus ganhos, gastos e despesas fixas com facilidade'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Segurança Garantida',
      description: 'Seus dados financeiros protegidos com criptografia avançada'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Relatórios Inteligentes',
      description: 'Visualize seus padrões financeiros com gráficos e análises'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'IA Gemini',
      description: 'Receba conselhos financeiros personalizados da inteligência artificial'
    }
  ];

  const stats = [
    { icon: <DollarSign className="w-6 h-6" />, value: '100%', label: 'Gratuito' },
    { icon: <Zap className="w-6 h-6" />, value: '24/7', label: 'Disponível' },
    { icon: <PiggyBank className="w-6 h-6" />, value: '∞', label: 'Economias' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark dark:via-dark-light dark:to-dark">
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">Poupo</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-dark-light shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-secondary" />}
              </button>
              
              <Button as={Link} to="/login" variant="primary">
                Entrar
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">Organize</span> suas{' '}
              <span className="text-secondary dark:text-primary">finanças</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-light mb-8 max-w-3xl mx-auto">
              Sistema completo de organização financeira com inteligência artificial. 
              Controle seus gastos, planeje seu futuro e alcance suas metas financeiras.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button as={Link} to="/login" variant="primary" size="xl">
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
                          
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white dark:bg-dark-light">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-light mb-4">
              Por que escolher o Poupo?
            </h2>
            <p className="text-xl text-gray-600 dark:text-light max-w-2xl mx-auto">
              Ferramentas poderosas para transformar sua relação com o dinheiro
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="elevated"
                className="text-center group"
              >
                <Card.Content>
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-light mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-light">
                    {feature.description}
                  </p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="w-16 h-16 bg-white dark:bg-dark-light rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <div className="text-primary">
                    {stat.icon}
                  </div>
                </div>
                
                <div className="text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                
                <div className="text-lg text-gray-600 dark:text-light">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-light mb-6">
              Pronto para transformar suas finanças?
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-light mb-8">
              Junte-se a milhares de usuários que já organizaram suas vidas financeiras
            </p>
            
            <Button as={Link} to="/login" variant="primary" size="xl">
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Poupo</span>
          </div>
          
          <p className="text-gray-400 mb-6">
            Sistema de organização financeira inteligente e seguro
          </p>
          
          <div className="text-sm text-gray-500">
            © 2024 Poupo. Todos os direitos reservados.
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Desenvolvido por <span className="font-medium">Caio Leonni</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
