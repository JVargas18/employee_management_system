import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Plus, Search, FileText, CheckCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

interface Loan {
  id: string;
  account_id: string;
  account_number: string;
  client_name: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

interface Account {
  id: string;
  account_number: string;
  client_name: string;
}

interface LoanFormData {
  account_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
}

const Loans: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<LoanFormData>({
    account_id: '',
    amount: 0,
    interest_rate: 5,
    term_months: 12
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchLoans();
    fetchAccounts();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/loans', {
        withCredentials: true
      });
      setLoans(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/accounts', {
        withCredentials: true
      });
      setAccounts(response.data);
    } catch (err: any) {
      console.error('Failed to load accounts', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['amount', 'interest_rate', 'term_months'].includes(name) ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      await axios.post('http://localhost:5000/api/loans', formData, {
        withCredentials: true
      });
      setIsModalOpen(false);
      setFormData({
        account_id: '',
        amount: 0,
        interest_rate: 5,
        term_months: 12
      });
      fetchLoans();
    } catch (err: any) {
      setFormError(err.response?.data?.error || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/loans/${loanId}/approve`, {}, {
        withCredentials: true
      });
      fetchLoans();
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    }
  };

  const filteredLoans = searchTerm
    ? loans.filter(loan => 
        loan.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : loans;

  if (loading && loans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('loans.title')}</h1>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
          >
            <Plus size={16} className="mr-2" />
            {t('loans.newLoan')}
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
              placeholder={t('loans.searchLoans')}
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.amount')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('loans.interestRate')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('loans.term')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.account_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{loan.client_name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{loan.interest_rate}%</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{loan.term_months} {t('loans.months')}</td>
                    <td className="px-4 py-3 text-sm">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                          loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {t(`loans.status.${loan.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {loan.status === 'pending' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApproveLoan(loan.id)}
                          className="flex items-center"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          {t('loans.approve')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-sm text-gray-500 text-center">
                    {searchTerm ? t('loans.noResults') : t('loans.noLoans')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Loan Modal */}
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
                    <FileText size={24} className="text-blue-800 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{t('loans.applyForLoan')}</h3>
                  </div>
                  
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                      {formError}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('accounts.title')}
                    </label>
                    <select
                      name="account_id"
                      value={formData.account_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">{t('loans.selectAccount')}</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_number} - {account.client_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label={t('loans.loanAmount')}
                    type="number"
                    name="amount"
                    value={formData.amount.toString()}
                    onChange={handleChange}
                    min="100"
                    step="100"
                    required
                  />
                  
                  <Input
                    label={t('loans.interestRate')}
                    type="number"
                    name="interest_rate"
                    value={formData.interest_rate.toString()}
                    onChange={handleChange}
                    min="1"
                    max="30"
                    step="0.1"
                    required
                  />
                  
                  <Input
                    label={t('loans.term')}
                    type="number"
                    name="term_months"
                    value={formData.term_months.toString()}
                    onChange={handleChange}
                    min="1"
                    max="60"
                    required
                  />
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto sm:ml-3"
                    isLoading={isSubmitting}
                  >
                    {t('loans.applyForLoan')}
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

export default Loans;