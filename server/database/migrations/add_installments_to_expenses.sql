-- Migration: Adiciona campo de parcelas em expenses
ALTER TABLE expenses ADD COLUMN installments INTEGER;
