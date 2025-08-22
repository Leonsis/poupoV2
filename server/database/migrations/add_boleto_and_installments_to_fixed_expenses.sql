-- Migration: Adiciona campos de boleto e parcelas em fixed_expenses
ALTER TABLE fixed_expenses ADD COLUMN is_boleto BOOLEAN DEFAULT 0;
ALTER TABLE fixed_expenses ADD COLUMN total_installments INTEGER;
ALTER TABLE fixed_expenses ADD COLUMN paid_installments INTEGER DEFAULT 0;
