export class FixedExpense {
  constructor(id, userId, description, amount, dueDate, category, isBoleto, totalInstallments, paidInstallments, isPaid, isOverdue, bankAccountId, isBillOrInvoice, currentInstallment, originalFixedExpenseId, transitionMonthYear, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.description = description;
    this.amount = amount;
    this.dueDate = dueDate;
    this.category = category;
    this.isBoleto = isBoleto;
    this.totalInstallments = totalInstallments;
    this.paidInstallments = paidInstallments;
    this.isPaid = isPaid;
    this.isOverdue = isOverdue;
    this.bankAccountId = bankAccountId;
    this.isBillOrInvoice = isBillOrInvoice;
    this.currentInstallment = currentInstallment;
    this.originalFixedExpenseId = originalFixedExpenseId;
    this.transitionMonthYear = transitionMonthYear;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromJSON(json) {
    return new FixedExpense(
      json.id,
      json.user_id,
      json.description,
      parseFloat(json.amount) || 0,
      json.due_date,
      json.category,
      Boolean(json.is_boleto),
      parseInt(json.total_installments) || 0,
      parseInt(json.paid_installments) || 0,
      Boolean(json.is_paid),
      Boolean(json.is_overdue),
      json.bank_account_id,
      Boolean(json.is_bill_or_invoice),
      parseInt(json.current_installment) || 0,
      json.original_fixed_expense_id,
      json.transition_month_year,
      json.created_at,
      json.updated_at
    );
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      description: this.description,
      amount: this.amount,
      due_date: this.dueDate,
      category: this.category,
      is_boleto: this.isBoleto,
      total_installments: this.totalInstallments,
      paid_installments: this.paidInstallments,
      is_paid: this.isPaid,
      is_overdue: this.isOverdue,
      bank_account_id: this.bankAccountId,
      is_bill_or_invoice: this.isBillOrInvoice,
      current_installment: this.currentInstallment,
      original_fixed_expense_id: this.originalFixedExpenseId,
      transition_month_year: this.transitionMonthYear,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  isOverdue() {
    return this.isOverdue;
  }

  isPaid() {
    return this.isPaid;
  }

  isBillOrInvoice() {
    return this.isBillOrInvoice;
  }
}
