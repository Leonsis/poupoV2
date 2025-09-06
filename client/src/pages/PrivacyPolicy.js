import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Shield, Eye, Lock, Database, User, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';

const PrivacyPolicy = () => {
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
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Política de Privacidade</h1>
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
                O <strong>Poupo</strong> é um sistema de organização financeira pessoal desenvolvido para ajudar 
                usuários a gerenciar suas finanças de forma segura e eficiente. Esta Política de Privacidade 
                descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
              </p>
            </div>

            {/* Informações Coletadas */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Informações que Coletamos</h2>
              </div>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Informações Pessoais</span>
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Nome completo</li>
                    <li>• Endereço de e-mail</li>
                    <li>• Data de nascimento</li>
                    <li>• Número de telefone (opcional)</li>
                    <li>• Salário bruto (opcional)</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Dados Financeiros</span>
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Receitas e despesas</li>
                    <li>• Despesas fixas</li>
                    <li>• Contas bancárias e saldos</li>
                    <li>• Histórico de transações</li>
                    <li>• Resumos financeiros mensais</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Dados de Uso</span>
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Logs de acesso e atividade</li>
                    <li>• Preferências de interface (modo escuro/claro)</li>
                    <li>• Configurações de privacidade</li>
                    <li>• Timestamps de ações</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Como Usamos as Informações */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Como Usamos suas Informações</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Fornecimento do Serviço:</strong> Para criar e manter sua conta, processar transações 
                    financeiras e fornecer funcionalidades do sistema.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Análise Financeira:</strong> Para gerar resumos, gráficos e conselhos financeiros 
                    personalizados usando inteligência artificial.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Comunicação:</strong> Para enviar notificações importantes sobre sua conta e 
                    atualizações do sistema.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Segurança:</strong> Para detectar e prevenir fraudes, proteger contra acesso 
                    não autorizado e manter a integridade do sistema.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Melhorias:</strong> Para analisar o uso do sistema e desenvolver novas 
                    funcionalidades que atendam às suas necessidades.
                  </p>
                </div>
              </div>
            </div>

            {/* Compartilhamento de Informações */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Compartilhamento de Informações</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  <strong>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros</strong>, 
                  exceto nas seguintes circunstâncias:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Inteligência Artificial:</strong> Utilizamos o Google Gemini AI para gerar 
                      conselhos financeiros. Os dados enviados são anonimizados e não incluem informações 
                      pessoais identificáveis.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Obrigação Legal:</strong> Quando exigido por lei, ordem judicial ou 
                      processo legal.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade 
                      ou segurança, ou de nossos usuários.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Segurança dos Dados */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Segurança dos Dados</h2>
              </div>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2">Criptografia</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Todas as senhas são criptografadas usando bcrypt com salt rounds de 12. 
                    Os dados são transmitidos usando HTTPS e armazenados de forma segura.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2">Controle de Acesso</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Implementamos autenticação JWT e controle de acesso baseado em roles. 
                    Apenas usuários autorizados podem acessar dados específicos.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2">Backup e Recuperação</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Realizamos backups regulares dos dados e mantemos sistemas de recuperação 
                    para garantir a disponibilidade e integridade das informações.
                  </p>
                </div>
              </div>
            </div>

            {/* Seus Direitos */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Seus Direitos</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Acesso:</strong> Você pode visualizar e atualizar suas informações pessoais 
                    a qualquer momento através da sua conta.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Correção:</strong> Você pode corrigir informações incorretas ou incompletas.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Exclusão:</strong> Você pode solicitar a exclusão de sua conta e dados 
                    pessoais (soft delete para fins de auditoria).
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Portabilidade:</strong> Você pode exportar seus dados financeiros em 
                    formato PDF através do sistema.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Privacidade:</strong> Você pode ativar o modo privacidade para ocultar 
                    valores financeiros na interface.
                  </p>
                </div>
              </div>
            </div>

            {/* Retenção de Dados */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Retenção de Dados</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300">
                  Mantemos suas informações pessoais e financeiras enquanto sua conta estiver ativa. 
                  Quando você exclui sua conta, implementamos um "soft delete" que marca os dados 
                  como excluídos mas os mantém por um período limitado para fins de auditoria e 
                  recuperação de dados. Após esse período, os dados são permanentemente removidos.
                </p>
              </div>
            </div>

            {/* Cookies e Tecnologias */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Cookies e Tecnologias</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Utilizamos as seguintes tecnologias para melhorar sua experiência:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <strong>JWT Tokens:</strong> Para autenticação segura</li>
                  <li>• <strong>Local Storage:</strong> Para armazenar preferências de interface</li>
                  <li>• <strong>Session Storage:</strong> Para dados temporários da sessão</li>
                  <li>• <strong>Logs de Sistema:</strong> Para monitoramento e segurança</li>
                </ul>
              </div>
            </div>

            {/* Alterações na Política */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Alterações nesta Política</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300">
                  Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos 
                  alterações significativas, notificaremos você através do sistema ou por e-mail. 
                  A data da última atualização será sempre exibida no topo desta página.
                </p>
              </div>
            </div>

            {/* Contato */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Mail className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Contato</h2>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
                  suas informações pessoais, entre em contato conosco:
                </p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p><strong>Desenvolvedor:</strong> Caio Leonni</p>
                  <p><strong>Sistema:</strong> Poupo - Organização Financeira Pessoal</p>
                  <p><strong>Versão:</strong> 2.0</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 mt-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Esta Política de Privacidade é parte integrante dos Termos de Uso do sistema Poupo.
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

export default PrivacyPolicy;
