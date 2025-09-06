import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, FileText, Shield, ExternalLink } from 'lucide-react';

const Footer = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <footer className={`py-12 px-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-800 text-white'}`}>
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Poupo</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Sistema de organização financeira inteligente e seguro. 
              Gerencie suas finanças pessoais com facilidade e confiança.
            </p>
            <div className="text-sm text-gray-500">
              © 2025 Poupo. Todos os direitos reservados.
            </div>
          </div>

          {/* Links Legais */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informações Legais</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigate('/privacy-policy')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <Shield className="w-4 h-4" />
                  <span>Política de Privacidade</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('/terms-of-service')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <FileText className="w-4 h-4" />
                  <span>Termos de Uso</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            </ul>
          </div>

          {/* Informações do Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sistema</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Versão 2.0</li>
              <li>Desenvolvido por Caio Leonni</li>
              <li>React + Node.js</li>
              <li>SQLite Database</li>
            </ul>
          </div>
        </div>

        {/* Linha Separadora */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-2 md:mb-0">
              Desenvolvido com ❤️ para ajudar na organização financeira pessoal
            </div>
            <div className="text-xs text-gray-600">
              Última atualização: 06 de setembro de 2025
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
