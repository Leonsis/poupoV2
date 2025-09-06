import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinancial } from '../contexts/FinancialContext';

const BankSyncForm = () => {
  const navigate = useNavigate();
  const { bankAccounts, importTransactions } = useFinancial();
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId || !file) return;
    setIsSubmitting(true);
    try {
      await importTransactions(accountId, file);
      navigate('/dashboard/bank-accounts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Importar Extrato (OFX/CSV)</h2>
        <Link to="/dashboard/bank-accounts" className="btn-outline">Voltar</Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Conta</label>
          <select className="input-primary" value={accountId} onChange={e => setAccountId(e.target.value)}>
            <option value="">Selecione a conta</option>
            {bankAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.account_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Arquivo (OFX ou CSV)</label>
          <input type="file" accept=".ofx,.csv" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button type="button" className="btn-outline" onClick={() => navigate('/dashboard/bank-accounts')}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting || !accountId || !file}>
            {isSubmitting ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankSyncForm;


