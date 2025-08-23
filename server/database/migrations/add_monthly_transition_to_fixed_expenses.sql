-- Migration: Adiciona campos para controle de transição mensal em fixed_expenses
ALTER TABLE fixed_expenses ADD COLUMN is_overdue BOOLEAN DEFAULT 0;
ALTER TABLE fixed_expenses ADD COLUMN original_expense_id INTEGER;
ALTER TABLE fixed_expenses ADD COLUMN month_year TEXT;
ALTER TABLE fixed_expenses ADD COLUMN payment_date DATE;
