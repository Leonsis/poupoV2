-- Adiciona campo de banimento na tabela de usuários
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT 0;

-- Tabela para registrar acessos de visitantes não logados
CREATE TABLE IF NOT EXISTS guest_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para registrar IPs de login dos usuários
CREATE TABLE IF NOT EXISTS user_login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip TEXT NOT NULL,
    logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
