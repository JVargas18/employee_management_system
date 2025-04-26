import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FileText, BarChart3, Download, Filter } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LoanReportData {
  loans: any[];
  summary: {
    total_loans: number;
    approved_loans: number;
    pending_loans: number;
    rejected_loans: number;
    total_amount: number;
    approved_amount: number;
  };
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<LoanReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchReportData();
  }, [filterStatus]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const url = filterStatus 
        ? `http://localhost:5000/api/reports/loans?status=${filterStatus}`
        : 'http://localhost:5000/api/reports/loans';
        
      const response = await axios.get(url, {
        withCredentials: true
      });
      setReportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#1E40AF', '#10B981', '#F59E0B', '#EF4444'];

  const pieChartData = reportData ? [
    { name: t('loans.status.approved'), value: reportData.summary.approved_loans },
    { name: t('loans.status.pending'), value: reportData.summary.pending_loans },
    { name: t('loans.status.rejected'), value: reportData.summary.rejected_loans },
  ] : [];

  const barChartData = reportData ? [
    {
      name: t('loans.title'),
      approved: reportData.summary.approved_loans,
      pending: reportData.summary.pending_loans,
      rejected: reportData.summary.rejected_loans,
    },
  ] : [];

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('reports.allLoans')}</option>
              <option value="pending">{t('loans.status.pending')}</option>
              <option value="approved">{t('loans.status.approved')}</option>
              <option value="rejected">{t('loans.status.rejected')}</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          <Button
            variant="outline"
            className="flex items-center"
          >
            <Download size={16} className="mr-2" />
            {t('reports.export')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="transform transition-transform hover:scale-105">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{reportData?.summary.total_loans || 0}</div>
            <div className="text-sm text-gray-500">{t('reports.summary.totalLoans')}</div>
          </div>
        </Card>
        
        <Card className="transform transition-transform hover:scale-105">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-800">{reportData?.summary.approved_loans || 0}</div>
            <div className="text-sm text-gray-500">{t('reports.summary.approvedLoans')}</div>
          </div>
        </Card>
        
        <Card className="transform transition-transform hover:scale-105">
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-500">{reportData?.summary.pending_loans || 0}</div>
            <div className="text-sm text-gray-500">{t('reports.summary.pendingLoans')}</div>
          </div>
        </Card>
        
        <Card className="transform transition-transform hover:scale-105">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ${reportData?.summary.approved_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm text-gray-500">{t('reports.summary.totalAmount')}</div>
          </div>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('reports.loanDistribution')}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card title={t('reports.loanOverview')}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" name={t('loans.status.approved')} fill="#1E40AF" />
                <Bar dataKey="pending" name={t('loans.status.pending')} fill="#F59E0B" />
                <Bar dataKey="rejected" name={t('loans.status.rejected')} fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Loan List */}
      <Card title={t('reports.loanDetails')}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('clients.name')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('accounts.accountNumber')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.amount')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('loans.interestRate')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('loans.term')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData?.loans && reportData.loans.length > 0 ? (
                reportData.loans.map((loan, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{loan.account_number}</td>
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(loan.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-sm text-gray-500 text-center">
                    {t('reports.noLoans')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Reports;