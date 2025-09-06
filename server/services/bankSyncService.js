const axios = require('axios');
const db = require('../config/database');

/**
 * Serviço genérico de sincronização bancária
 * Permite integrar com uma API externa informada pelo usuário (URL e token)
 */
class BankSyncService {
  static async fetchAndUpsertTransactions(userId, bankAccountId) {
    // Buscar configuração da conta
    const account = await db.get(
      'SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?',
      [bankAccountId, userId]
    );

    if (!account) {
      throw new Error('Conta bancária não encontrada');
    }

    if (!account.sync_enabled) {
      return { success: false, message: 'Sincronização não habilitada para esta conta' };
    }

    if (!account.sync_base_url) {
      return { success: false, message: 'URL da API externa não configurada' };
    }

    const provider = account.sync_provider || 'generic';

    // Determinar data de início da busca
    let since = account.last_sync_at;
    if (!since) {
      // Buscar últimos 30 dias por padrão
      const d = new Date();
      d.setDate(d.getDate() - 30);
      since = d.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Montar requisição
    const url = `${account.sync_base_url.replace(/\/$/, '')}/transactions`;
    const params = {
      accountId: account.provider_account_id || undefined,
      since,
    };

    const headers = {};
    if (account.sync_api_key) {
      headers['Authorization'] = `Bearer ${account.sync_api_key}`;
    }

    // Atualizar status
    await db.run(
      "UPDATE bank_accounts SET sync_status = 'syncing', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      [bankAccountId, userId]
    );

    try {
      const response = await axios.get(url, { params, headers, timeout: 15000 });
      const transactions = Array.isArray(response.data) ? response.data : (response.data?.transactions || []);

      let inserted = 0;
      const now = require('../utils/dateUtils').getCurrentDateTime();

      for (const tx of transactions) {
        // Esperado minimal: { id, amount, description, date, type }
        const externalId = String(tx.id || tx.external_id || '');
        const amountRaw = Number(tx.amount || tx.value || 0);
        const description = tx.description || tx.memo || 'Transação';
        const date = tx.date || tx.posted_at || tx.bookingDate || now;
        const type = (tx.type || '').toLowerCase();

        if (!externalId) continue;

        // Apenas gastos (saídas). Considera amount negativo OU type indicando debito.
        const isDebit = amountRaw < 0 || type === 'debit' || type === 'saida' || type === 'expense';
        if (!isDebit) continue;

        const amount = Math.abs(amountRaw);

        // Evitar duplicidade
        const already = await db.get(
          'SELECT id FROM expenses WHERE user_id = ? AND external_provider = ? AND external_id = ?',
          [userId, provider, externalId]
        );
        if (already) continue;

        // Inserir gasto
        await db.run(
          `INSERT INTO expenses (
            user_id, amount, description, payment_method, expense_date, category, installments, bank_account_id,
            external_id, external_provider, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            amount,
            description,
            'debito',
            date,
            tx.category || null,
            null,
            bankAccountId,
            externalId,
            provider,
            now,
            now
          ]
        );

        // Atualizar saldo da conta (débito)
        await db.run(
          'UPDATE bank_accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
          [amount, bankAccountId, userId]
        );

        inserted++;
      }

      // Atualizar status
      await db.run(
        "UPDATE bank_accounts SET last_sync_at = CURRENT_TIMESTAMP, sync_status = 'idle', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        [bankAccountId, userId]
      );

      return { success: true, inserted, total: transactions.length };
    } catch (error) {
      await db.run(
        "UPDATE bank_accounts SET sync_status = 'error', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        [bankAccountId, userId]
      );
      throw error;
    }
  }

  static async upsertFromWebhook(userId, bankAccountId, payload) {
    const account = await db.get(
      'SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?',
      [bankAccountId, userId]
    );
    if (!account) throw new Error('Conta bancária não encontrada');

    const provider = account.sync_provider || 'generic';
    const tx = payload;
    const externalId = String(tx.id || tx.external_id || '');
    if (!externalId) return { inserted: 0 };

    // Apenas gastos (saídas)
    const amountRaw = Number(tx.amount || tx.value || 0);
    const type = (tx.type || '').toLowerCase();
    const isDebit = amountRaw < 0 || type === 'debit' || type === 'saida' || type === 'expense';
    if (!isDebit) return { inserted: 0 };

    const exists = await db.get(
      'SELECT id FROM expenses WHERE user_id = ? AND external_provider = ? AND external_id = ?',
      [userId, provider, externalId]
    );
    if (exists) return { inserted: 0 };

    const now = require('../utils/dateUtils').getCurrentDateTime();
    const amount = Math.abs(amountRaw);
    const description = tx.description || tx.memo || 'Transação';
    const date = tx.date || tx.posted_at || now;

    await db.run(
      `INSERT INTO expenses (
        user_id, amount, description, payment_method, expense_date, category, installments, bank_account_id,
        external_id, external_provider, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        amount,
        description,
        'debito',
        date,
        tx.category || null,
        null,
        bankAccountId,
        externalId,
        provider,
        now,
        now
      ]
    );

    await db.run(
      'UPDATE bank_accounts SET balance = balance - ?, last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [amount, bankAccountId, userId]
    );

    return { inserted: 1 };
  }
}

module.exports = BankSyncService;


