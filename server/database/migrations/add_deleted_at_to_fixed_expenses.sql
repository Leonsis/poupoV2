-- Migration: Adiciona campo deleted_at para soft delete em fixed_expenses
ALTER TABLE fixed_expenses ADD COLUMN deleted_at DATETIME;
