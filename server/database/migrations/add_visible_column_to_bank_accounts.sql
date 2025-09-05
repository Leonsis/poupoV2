-- Adicionar coluna is_visible na tabela bank_accounts
-- Esta coluna determina se a conta deve ser considerada nos cálculos e seleções

ALTER TABLE bank_accounts ADD COLUMN is_visible BOOLEAN DEFAULT 1;

-- Atualizar contas existentes para serem visíveis por padrão
UPDATE bank_accounts SET is_visible = 1 WHERE is_visible IS NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_bank_accounts_visible ON bank_accounts(user_id, is_visible);
