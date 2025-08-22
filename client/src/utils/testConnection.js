// Utilitário para testar conexão com o backend
export const testBackendConnection = async () => {
  try {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await fetch(baseUrl + '/api/health');
    const data = await response.json();
    console.log('✅ Backend conectado:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com backend:', error);
    return false;
  }
};

// Teste específico para registro
export const testRegistration = async (testData) => {
  try {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await fetch(baseUrl + '/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const data = await response.json();
    console.log('📝 Resposta do registro:', data);
    
    if (!response.ok) {
      console.error('❌ Erro no registro:', data);
      return { success: false, error: data };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return { success: false, error: error.message };
  }
};

// Verificar variáveis de ambiente
export const checkEnvironment = () => {
  console.log('🔍 Verificando ambiente:');
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Base URL da API:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
};
