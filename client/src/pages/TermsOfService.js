import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, FileText, Shield, AlertTriangle, CheckCircle, XCircle, User, CreditCard, Database, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';

const TermsOfService = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-dark text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Termos de Uso</h1>
                  <p className="text-sm text-gray-500">Última atualização: 06 de setembro de 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className={`rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="p-8">
            {/* Introdução */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Introdução</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Bem-vindo ao <strong>Poupo</strong>, um sistema de organização financeira pessoal desenvolvido 
                para ajudar você a gerenciar suas finanças de forma eficiente e segura. Estes Termos de Uso 
                regem o uso do sistema e estabelecem os direitos e responsabilidades entre você e o desenvolvedor.
              </p>
              <div className={`mt-4 p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-blue-600 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Importante:</strong> Ao usar o sistema Poupo, você concorda com estes termos. 
                  Se não concordar, não utilize o sistema.
                </p>
              </div>
            </div>

            {/* Aceitação dos Termos */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Aceitação dos Termos</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Ao criar uma conta ou usar o sistema, você confirma que leu, entendeu e concorda 
                    com estes Termos de Uso.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Você deve ter pelo menos 18 anos de idade para usar o sistema, ou ter o 
                    consentimento de um responsável legal.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Estes termos se aplicam a todos os usuários do sistema, incluindo visitantes 
                    e usuários registrados.
                  </p>
                </div>
              </div>
            </div>

            {/* Descrição do Serviço */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Descrição do Serviço</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  O Poupo é um sistema web que oferece as seguintes funcionalidades:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Gestão Financeira:</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Registro de receitas e despesas</li>
                      <li>• Controle de despesas fixas</li>
                      <li>• Gestão de contas bancárias</li>
                      <li>• Relatórios e resumos financeiros</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Recursos Avançados:</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Conselhos financeiros com IA</li>
                      <li>• Modo privacidade</li>
                      <li>• Exportação de dados em PDF</li>
                      <li>• Interface responsiva</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conta de Usuário */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Conta de Usuário</h2>
              </div>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2">Criação de Conta</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Você deve fornecer informações verdadeiras e atualizadas</li>
                    <li>• É responsável por manter a confidencialidade de sua senha</li>
                    <li>• Deve notificar imediatamente sobre uso não autorizado</li>
                    <li>• Uma conta por pessoa física</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2">Responsabilidades do Usuário</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Manter informações pessoais atualizadas</li>
                    <li>• Usar o sistema de forma ética e legal</li>
                    <li>• Não compartilhar credenciais de acesso</li>
                    <li>• Reportar problemas ou vulnerabilidades</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Uso Aceitável */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Uso Aceitável</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-green-600 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
                  <h3 className="font-semibold mb-3 flex items-center space-x-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="w-4 h-4" />
                    <span>Uso Permitido</span>
                  </h3>
                  <ul className="text-sm text-green-600 dark:text-green-300 space-y-1">
                    <li>• Gestão de finanças pessoais</li>
                    <li>• Análise de gastos e receitas</li>
                    <li>• Planejamento financeiro</li>
                    <li>• Exportação de relatórios</li>
                    <li>• Uso educacional e pessoal</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-red-600 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
                  <h3 className="font-semibold mb-3 flex items-center space-x-2 text-red-700 dark:text-red-300">
                    <XCircle className="w-4 h-4" />
                    <span>Uso Proibido</span>
                  </h3>
                  <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                    <li>• Atividades ilegais ou fraudulentas</li>
                    <li>• Tentativas de hackear o sistema</li>
                    <li>• Uso comercial não autorizado</li>
                    <li>• Spam ou atividades maliciosas</li>
                    <li>• Violação de direitos de terceiros</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Propriedade Intelectual */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Propriedade Intelectual</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Direitos do Desenvolvedor:</strong> O sistema Poupo, incluindo seu código, 
                    design, funcionalidades e documentação, é propriedade do desenvolvedor Caio Leonni.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Seus Dados:</strong> Você mantém todos os direitos sobre seus dados pessoais 
                    e financeiros. O sistema apenas os processa conforme descrito na Política de Privacidade.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Licença de Uso:</strong> Ao usar o sistema, você recebe uma licença limitada, 
                    não exclusiva e revogável para usar o serviço conforme estes termos.
                  </p>
                </div>
              </div>
            </div>

            {/* Limitação de Responsabilidade */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Limitação de Responsabilidade</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="space-y-3">
                  <p className="text-yellow-700 dark:text-yellow-300">
                    <strong>Isenção de Garantias:</strong> O sistema é fornecido "como está", sem garantias 
                    de qualquer tipo, expressas ou implícitas.
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    <strong>Limitação de Danos:</strong> O desenvolvedor não será responsável por danos 
                    diretos, indiretos, incidentais ou consequenciais resultantes do uso do sistema.
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    <strong>Conselhos Financeiros:</strong> Os conselhos gerados por IA são apenas 
                    sugestões e não substituem o aconselhamento profissional.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacidade e Segurança */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Privacidade e Segurança</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Proteção de Dados:</strong> Implementamos medidas de segurança para proteger 
                    suas informações, mas nenhum sistema é 100% seguro.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Backup:</strong> Realizamos backups regulares, mas recomendamos que você 
                    mantenha cópias de seus dados importantes.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Comunicação:</strong> Podemos entrar em contato para questões relacionadas 
                    à sua conta ou atualizações do sistema.
                  </p>
                </div>
              </div>
            </div>

            {/* Suspensão e Encerramento */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <XCircle className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Suspensão e Encerramento</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Encerramento por Você:</strong> Você pode encerrar sua conta a qualquer 
                    momento através das configurações do sistema.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Suspensão por Nós:</strong> Podemos suspender ou encerrar sua conta se 
                    você violar estes termos ou por motivos de segurança.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Efeitos do Encerramento:</strong> Após o encerramento, você perderá acesso 
                    à sua conta, mas seus dados serão mantidos conforme a Política de Privacidade.
                  </p>
                </div>
              </div>
            </div>

            {/* Modificações */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Modificações dos Termos</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300">
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                  Alterações significativas serão comunicadas através do sistema ou por e-mail. 
                  O uso continuado do sistema após as modificações constitui aceitação dos novos termos.
                </p>
              </div>
            </div>

            {/* Lei Aplicável */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Lei Aplicável</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300">
                  Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida 
                  nos tribunais competentes do Brasil. Se alguma disposição destes termos for 
                  considerada inválida, as demais disposições permanecerão em vigor.
                </p>
              </div>
            </div>

            {/* Contato */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Contato</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Para questões relacionadas a estes Termos de Uso ou ao sistema Poupo:
                </p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p><strong>Desenvolvedor:</strong> Caio Leonni</p>
                  <p><strong>Sistema:</strong> Poupo - Organização Financeira Pessoal</p>
                  <p><strong>Versão:</strong> 2.0</p>
                  <p><strong>Data:</strong> Setembro de 2025</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 mt-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estes Termos de Uso são complementados pela Política de Privacidade do sistema Poupo.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  © 2025 Poupo. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
