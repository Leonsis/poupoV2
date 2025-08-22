-- Migration: Adiciona campo de data de vencimento em bank_accounts
ALTER TABLE bank_accounts ADD COLUMN due_date INTEGER;
