export class Expense {
  constructor(id, userId, amount, expenseDate, paymentMethod, cardName, description, category, bankAccountId, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.amount = amount;
    this.expenseDate = expenseDate;
    this.paymentMethod = paymentMethod;
    this.cardName = cardName;
    this.description = description;
    this.category = category;
    this.bankAccountId = bankAccountId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromJSON(json) {
    return new Expense(
      json.id,
      json.user_id,
      parseFloat(json.amount) || 0,
      json.expense_date,
      json.payment_method,
      json.card_name,
      json.description,
      json.category,
      json.bank_account_id,
      json.created_at,
      json.updated_at
    );
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      amount: this.amount,
      expense_date: this.expenseDate,
      payment_method: this.paymentMethod,
      card_name: this.cardName,
      description: this.description,
      category: this.category,
      bank_account_id: this.bankAccountId,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  isCreditCardPayment() {
    return this.paymentMethod === 'credito';
  }

  isDebitPayment() {
    return this.paymentMethod === 'debito';
  }
}
