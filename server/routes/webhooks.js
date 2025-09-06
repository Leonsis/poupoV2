const express = require('express');
const db = require('../config/database');
const BankSyncService = require('../services/bankSyncService');

const router = express.Router();

// Webhook público para eventos de bancos/agregadores
// POST /api/webhooks/banks/:accountId
router.post('/banks/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await db.get('SELECT * FROM bank_accounts WHERE id = ?', [accountId]);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }

    // Validação simples de segredo (header ou query)
    const provided = req.headers['x-webhook-secret'] || req.query.secret;
    if (account.webhook_secret && provided !== account.webhook_secret) {
      return res.status(401).json({ success: false, message: 'Assinatura inválida' });
    }

    const payload = req.body;
    const result = await BankSyncService.upsertFromWebhook(account.user_id, parseInt(accountId, 10), payload);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Erro no webhook público:', error);
    return res.status(500).json({ success: false, message: 'Erro no processamento do webhook' });
  }
});

module.exports = router;


