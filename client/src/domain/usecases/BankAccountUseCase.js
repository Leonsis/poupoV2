import { BankAccountRepository } from '../repositories/BankAccountRepository.js';

export class BankAccountUseCase {
  constructor(bankAccountRepository) {
    this.bankAccountRepository = bankAccountRepository;
  }

  async createAccount(userId, accountData) {
    try {
      // Validações de negócio
      if (!accountData.accountName || !accountData.accountCategory) {
        return { success: false, message: 'Dados obrigatórios não fornecidos' };
      }

      if (accountData.accountCategory === 'credito' && !accountData.creditLimit) {
        return { success: false, message: 'Limite de crédito é obrigatório para cartões de crédito' };
      }

      const account = await this.bankAccountRepository.create({
        ...accountData,
        userId
      });

      return { success: true, account };
    } catch (error) {
      return { success: false, message: 'Erro ao criar conta bancária' };
    }
  }

  async updateAccount(accountId, accountData) {
    try {
      const account = await this.bankAccountRepository.update(accountId, accountData);
      return { success: true, account };
    } catch (error) {
      return { success: false, message: 'Erro ao atualizar conta bancária' };
    }
  }

  async deleteAccount(accountId) {
    try {
      await this.bankAccountRepository.delete(accountId);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Erro ao excluir conta bancária' };
    }
  }

  async getUserAccounts(userId) {
    try {
      const accounts = await this.bankAccountRepository.findByUserId(userId);
      return { success: true, accounts };
    } catch (error) {
      return { success: false, message: 'Erro ao buscar contas bancárias' };
    }
  }

  async getTotalBalance(userId) {
    try {
      const balance = await this.bankAccountRepository.getTotalBalance(userId);
      return { success: true, balance };
    } catch (error) {
      return { success: false, message: 'Erro ao calcular saldo total' };
    }
  }
}
