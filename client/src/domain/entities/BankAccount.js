export class BankAccount {
  constructor(id, userId, accountName, accountType, accountCategory, balance, creditLimit, dueDate, currentDebt, closingDate, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.accountName = accountName;
    this.accountType = accountType;
    this.accountCategory = accountCategory;
    this.balance = balance;
    this.creditLimit = creditLimit;
    this.dueDate = dueDate;
    this.currentDebt = currentDebt;
    this.closingDate = closingDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromJSON(json) {
    return new BankAccount(
      json.id,
      json.user_id,
      json.account_name,
      json.account_type,
      json.account_category,
      parseFloat(json.balance) || 0,
      parseFloat(json.credit_limit) || 0,
      json.due_date,
      parseFloat(json.current_debt) || 0,
      json.closing_date,
      json.created_at,
      json.updated_at
    );
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      account_name: this.accountName,
      account_type: this.accountType,
      account_category: this.accountCategory,
      balance: this.balance,
      credit_limit: this.creditLimit,
      due_date: this.dueDate,
      current_debt: this.currentDebt,
      closing_date: this.closingDate,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  isCreditCard() {
    return this.accountCategory === 'credito';
  }

  isDebitAccount() {
    return this.accountCategory === 'debito';
  }
}
