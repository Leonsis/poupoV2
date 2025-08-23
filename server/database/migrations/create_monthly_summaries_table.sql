-- Migration: Cria tabela para armazenar resumos mensais gerados automaticamente
CREATE TABLE IF NOT EXISTS monthly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month_year TEXT NOT NULL, -- formato: YYYY-MM
    total_income DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    total_fixed_expenses DECIMAL(10,2) DEFAULT 0,
    total_credit_card_expenses DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    income_details TEXT, -- JSON com detalhes das receitas
    expenses_details TEXT, -- JSON com detalhes das despesas
    fixed_expenses_details TEXT, -- JSON com detalhes das despesas fixas
    credit_card_expenses_details TEXT, -- JSON com detalhes das despesas de crédito
    bank_accounts_summary TEXT, -- JSON com resumo das contas bancárias
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month_year),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_month ON monthly_summaries(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_created_at ON monthly_summaries(created_at);
