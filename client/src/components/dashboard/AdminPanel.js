import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ADMIN_USER = 'caioleonni';
const ADMIN_PASS = 'Caio22060122';
const ADMIN_SESSION_KEY = 'admin_panel_logged_in';
const ADMIN_TOKEN_KEY = 'admin_panel_token';

// Instância Axios local para o painel admin
const adminApi = axios.create({
  baseURL: '', // Usa o proxy configurado no package.json
});

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [userCounts, setUserCounts] = useState({ total: 0, ativos: 0 });
  const [guestAccessCount, setGuestAccessCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminLogged, setAdminLogged] = useState(() => {
    const isLogged = localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    return isLogged && token;
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || '');

  const fetchGuestAccessCount = async () => {
    try {
      const guestRes = await adminApi.get('/api/admin/guest-access/count', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setGuestAccessCount(guestRes.data.total || 0);
    } catch {
      setGuestAccessCount(0);
    }
  };

  useEffect(() => {
    if (!adminLogged || !adminToken) return;
    const fetchData = async () => {
      setLoading(true);
      setError(''); // Limpa erros anteriores
      try {
        const usersRes = await adminApi.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const countsRes = await adminApi.get('/api/admin/users/counts', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        setUsers(usersRes.data.users || []);
        setUserCounts({ total: countsRes.data.total, ativos: countsRes.data.ativos });
        await fetchGuestAccessCount();
      } catch (err) {
        console.error('Erro ao carregar dados administrativos:', err);
        setError('Erro ao carregar dados administrativos.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adminLogged, adminToken]);

  const handleBanUser = async (id) => {
    if (!window.confirm('Banir este usuário?')) return;
    try {
      await adminApi.patch(`/api/admin/users/${id}/ban`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: 1 } : u));
    } catch {
      alert('Erro ao banir usuário.');
    }
  };

  const handleUnbanUser = async (id) => {
    if (!window.confirm('Remover banimento deste usuário?')) return;
    try {
      await adminApi.patch(`/api/admin/users/${id}/unban`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: 0 } : u));
    } catch {
      alert('Erro ao remover banimento.');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      // Garante que a requisição vá para o endpoint correto
      const res = await axios.post('/api/admin/login', { username: loginUser, password: loginPass });
      
      if (res.data && res.data.token) {
        setAdminLogged(true);
        setAdminToken(res.data.token);
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
        setLoginError('');
      } else {
        setLoginError('Usuário ou senha inválidos.');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setLoginError('Usuário ou senha inválidos.');
    }
  };

  const handleAdminLogout = () => {
    setAdminLogged(false);
    setAdminToken('');
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  };

  if (!adminLogged) {
    return (
      <div style={{ maxWidth: 350, margin: '80px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
        <h2 style={{marginBottom:16}}>Login Administrador</h2>
        <form onSubmit={handleAdminLogin}>
          <div style={{marginBottom:12}}>
            <label>Usuário<br/>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} style={{width:'100%',padding:8}} autoFocus />
            </label>
          </div>
          <div style={{marginBottom:12}}>
            <label>Senha<br/>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{width:'100%',padding:8}} />
            </label>
          </div>
          {loginError && <div style={{color:'red',marginBottom:8}}>{loginError}</div>}
          <button type="submit" style={{width:'100%',padding:10,background:'#222',color:'#fff',border:'none',borderRadius:4}}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Painel do Administrador</h2>
        <div>
          <button onClick={handleAdminLogout} style={{padding:8,marginRight:8}}>Sair</button>
          <button onClick={fetchGuestAccessCount} style={{padding:8}}>Atualizar visitas</button>
        </div>
      </div>
      {loading ? <p>Carregando...</p> : error ? <p style={{color:'red'}}>{error}</p> : (
        <>
          <div style={{marginBottom: 24}}>
            <strong>Total de usuários cadastrados:</strong> {userCounts.total}<br/>
            <strong>Usuários ativos:</strong> {userCounts.ativos}<br/>
            <strong>Acessos de visitantes não logados:</strong> {guestAccessCount}
          </div>
          <h3>Usuários Cadastrados</h3>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>IP de acesso</th>
                <th>Banido?</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={user.is_banned ? {background:'#ffeaea'} : {}}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.last_ip || '-'}</td>
                  <td>{user.is_banned ? 'Sim' : 'Não'}</td>
                  <td>
                    {user.is_banned ? (
                      <button onClick={() => handleUnbanUser(user.id)} style={{color:'green'}}>Desbanir</button>
                    ) : (
                      <button onClick={() => handleBanUser(user.id)} style={{color:'red'}}>Banir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
