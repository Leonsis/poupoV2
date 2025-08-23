-- Schema do Banco de Dados - Sistema Poupo (compatível com SQLite)

-- Tabela de Usuários
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    birth_date DATE,
    phone TEXT,
    gross_salary DECIMAL(10,2) DEFAULT 0.00,
    dark_mode BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT 0,
    deleted_at TIMESTAMP
);

-- Tabela de Contas Bancárias
CREATE TABLE bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_type TEXT DEFAULT 'corrente',
    account_category TEXT DEFAULT 'debito', -- Adicione esta linha
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Ganhos
CREATE TABLE income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    income_date DATE NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    bank_account_id INTEGER REFERENCES bank_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Gastos
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method TEXT NOT NULL, -- debito, credito
    card_name TEXT,
    description TEXT,
    category TEXT,
    bank_account_id INTEGER REFERENCES bank_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Despesas Fixas
CREATE TABLE fixed_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT 0,
    bank_account_id INTEGER REFERENCES bank_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Conselhos Financeiros
CREATE TABLE IF NOT EXISTS financial_advice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    advice TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de acessos de visitantes
CREATE TABLE IF NOT EXISTS guest_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_income_user_date ON income(user_id, income_date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX idx_fixed_expenses_user ON fixed_expenses(user_id);
CREATE INDEX idx_bank_accounts_user ON bank_accounts(user_id);

-- Triggers para atualizar timestamps
CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_bank_accounts_updated_at
AFTER UPDATE ON bank_accounts
BEGIN
    UPDATE bank_accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_income_updated_at
AFTER UPDATE ON income
BEGIN
    UPDATE income SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_expenses_updated_at
AFTER UPDATE ON expenses
BEGIN
    UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_fixed_expenses_updated_at
AFTER UPDATE ON fixed_expenses
BEGIN
    UPDATE fixed_expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Inserir dados de exemplo
INSERT INTO users (name, email, password_hash, birth_date, phone, gross_salary) VALUES
('Usuário Exemplo', 'usuario@exemplo.com', '$2a$10$example.hash.here', '1990-01-01', '(11) 99999-9999', 5000.00);

INSERT INTO bank_accounts (user_id, account_name, account_type, balance) VALUES
(1, 'Conta Principal', 'corrente', 1000.00),
(1, 'Conta Poupança', 'poupanca', 500.00);
