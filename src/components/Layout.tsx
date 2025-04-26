import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart4, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
          isActive 
            ? 'bg-blue-100 text-blue-900' 
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
      onClick={closeMobileMenu}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md text-gray-700"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <Building2 className="w-8 h-8 text-blue-800" />
            <h1 className="ml-2 text-xl font-bold text-gray-900">{t('common.app')}</h1>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b">
            <div className="font-medium">{user?.full_name}</div>
            <div className="text-sm text-gray-500">{user?.role}</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label={t('common.dashboard')} />
            <NavItem to="/clients" icon={<Users size={20} />} label={t('common.clients')} />
            <NavItem to="/accounts" icon={<CreditCard size={20} />} label={t('common.accounts')} />
            <NavItem to="/loans" icon={<FileText size={20} />} label={t('common.loans')} />
            <NavItem to="/reports" icon={<BarChart4 size={20} />} label={t('common.reports')} />
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <LogOut size={20} />
              <span className="ml-3">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-end px-6">
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <span className="text-gray-700">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-gray-900"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={closeMobileMenu}
        />
      )}
    </div>
  );
};

export default Layout;