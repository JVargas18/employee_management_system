import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  CreditCard, 
  FileText, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  user: any;
  stats: {
    clients_count: number;
    accounts_count: number;
    loans_count: number;
    total_balance: number;
  };
  recent_loans: any[];
  recent_transactions: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user/dashboard', {
          withCredentials: true
        });
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  const loanData = [
    { name: t('loans.status.pending'), value: 5 },
    { name: t('loans.status.approved'), value: 12 },
    { name: t('loans.status.rejected'), value: 2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('common.dashboard')}</h1>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="transform transition-transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-800">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('reports.summary.totalLoans')}</h3>
              <p className="text-2xl font-semibold text-gray-900">{data?.stats.clients_count || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="transform transition-transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-800">
              <CreditCard size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('accounts.title')}</h3>
              <p className="text-2xl font-semibold text-gray-900">{data?.stats.accounts_count || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="transform transition-transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-800">
              <FileText size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('loans.title')}</h3>
              <p className="text-2xl font-semibold text-gray-900">{data?.stats.loans_count || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="transform transition-transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-800">
              <DollarSign size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('accounts.balance')}</h3>
              <p className="text-2xl font-semibold text-gray-900">
                ${data?.stats.total_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card title={t('loans.title')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1E40AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Recent Loans */}
        <Card title={t('loans.title')}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('clients.name')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.amount')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.recent_loans && data.recent_loans.length > 0 ? (
                  data.recent_loans.map((loan, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{loan.client_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                          loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t(`loans.status.${loan.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm text-gray-500 text-center">{t('common.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;