import { useAuth } from '../contexts/AuthContext';
import { Menu } from '@headlessui/react';
import { UserCircle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">Employee Fund</span>
            </Link>
          </div>

          <div className="flex items-center">
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center text-gray-700 hover:text-gray-900">
                <UserCircle className="h-8 w-8" />
                <span className="ml-2">{user?.username}</span>
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
}