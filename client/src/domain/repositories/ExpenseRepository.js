import { Expense } from '../entities/Expense.js';

export class ExpenseRepository {
  async create(expenseData) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId, filters = {}) {
    throw new Error('Method not implemented');
  }

  async update(id, expenseData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async getTotalExpenses(userId, period) {
    throw new Error('Method not implemented');
  }

  async getExpensesByMethod(userId, period) {
    throw new Error('Method not implemented');
  }
}
