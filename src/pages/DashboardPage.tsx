import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Wallet, Users, PiggyBank, ArrowUpRight } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function DashboardPage() {
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await axios.get('/api/reports');
      return data;
    },
  });

  if (!dashboardData) return null;

  const {
    loan_statistics,
    account_statistics,
    payment_statistics,
  } = dashboardData;

  const stats = [
    {
      name: 'Total Accounts',
      value: account_statistics.total_accounts,
      icon: Wallet,
      change: '+4.75%',
      changeType: 'positive',
    },
    {
      name: 'Active Loans',
      value: loan_statistics.active_loans,
      icon: PiggyBank,
      change: '+54.02%',
      changeType: 'positive',
    },
    {
      name: 'Total Balance',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(account_statistics.total_balance),
      icon: Users,
      change: '-1.39%',
      changeType: 'negative',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
                        <span className="sr-only">
                          {stat.changeType === 'positive'
                            ? 'Increased'
                            : 'Decreased'
                        }{' '}
                          by
                        </span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Monthly Loans</h3>
          <div className="mt-6" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(loan_statistics.monthly_distribution).map(
                  ([month, count]) => ({
                    month: new Date(2024, parseInt(month) - 1).toLocaleString(
                      'default',
                      { month: 'short' }
                    ),
                    count,
                  })
                )}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Loan Status</h3>
          <div className="mt-6" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(loan_statistics.status_distribution).map(
                    ([status, count]) => ({
                      name: status,
                      value: count,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(loan_statistics.status_distribution).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}