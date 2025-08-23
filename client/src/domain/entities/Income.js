export class Income {
  constructor(id, userId, amount, incomeDate, description, category, bankAccountId, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.amount = amount;
    this.incomeDate = incomeDate;
    this.description = description;
    this.category = category;
    this.bankAccountId = bankAccountId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromJSON(json) {
    return new Income(
      json.id,
      json.user_id,
      parseFloat(json.amount) || 0,
      json.income_date,
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
      income_date: this.incomeDate,
      description: this.description,
      category: this.category,
      bank_account_id: this.bankAccountId,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
