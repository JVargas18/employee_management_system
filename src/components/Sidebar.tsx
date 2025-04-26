import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Building2, 
  Wallet, 
  PiggyBank,
  FileText 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/', icon: Home },
  { name: 'Users', to: '/users', icon: Users },
  { name: 'Clients', to: '/clients', icon: Building2 },
  { name: 'Accounts', to: '/accounts', icon: Wallet },
  { name: 'Loans', to: '/loans', icon: PiggyBank },
  { name: 'Reports', to: '/reports', icon: FileText },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="mt-5 px-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}