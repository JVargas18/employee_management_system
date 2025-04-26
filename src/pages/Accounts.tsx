import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Plus, Search, CreditCard } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

interface Account {
  id: string;
  client_id: string;
  client_name: string;
  account_number: string;
  balance: number;
  account_type: string;
  status: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface AccountFormData {
  client_id: string;
  account_type: string;
  initial_balance: number;
}

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<AccountFormData>({
    client_id: '',
    account_type: 'savings',
    initial_balance: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchAccounts();
    fetchClients();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/accounts', {
        withCredentials: true
      });
      setAccounts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/clients', {
        withCredentials: true
      });
      setClients(response.data);
    } catch (err: any) {
      console.error('Failed to load clients', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'initial_balance' ? parseFloat(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      await axios.post('http://localhost:5000/api/accounts', formData, {
        withCredentials: true
      });
      setIsModalOpen(false);
      setFormData({ client_id: '', account_type: 'savings', initial_balance: 0 });
      fetchAccounts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAccounts = searchTerm
    ? accounts.filter(account => 
        account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : accounts;

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('accounts.title')}</h1>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
          >
            <Plus size={16} className="mr-2" />
            {t('accounts.newAccount')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <Card>
        <div className="pb-4 mb-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder={t('accounts.searchAccounts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              wrapperClassName="mb-0"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('accounts.accountNumber')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('clients.name')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('accounts.accountType')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('accounts.balance')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{account.account_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{account.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t(`accounts.types.${account.account_type}`)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {t(`accounts.status.${account.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm text-gray-500 text-center">
                    {searchTerm ? t('accounts.noResults') : t('accounts.noAccounts')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <CreditCard size={24} className="text-blue-800 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{t('accounts.newAccount')}</h3>
                  </div>
                  
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                      {formError}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('clients.title')}
                    </label>
                    <select
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">{t('accounts.selectClient')}</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('accounts.accountType')}
                    </label>
                    <select
                      name="account_type"
                      value={formData.account_type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="savings">{t('accounts.types.savings')}</option>
                      <option value="checking">{t('accounts.types.checking')}</option>
                      <option value="credit">{t('accounts.types.credit')}</option>
                    </select>
                  </div>
                  
                  <Input
                    label={t('accounts.initialBalance')}
                    type="number"
                    name="initial_balance"
                    value={formData.initial_balance.toString()}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto sm:ml-3"
                    isLoading={isSubmitting}
                  >
                    {t('accounts.newAccount')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full sm:w-auto sm:mt-0"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;