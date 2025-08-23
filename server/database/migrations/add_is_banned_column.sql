-- Adicionar coluna is_banned na tabela users
ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;
