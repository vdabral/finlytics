import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BriefcaseIcon,
  UserIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/authSlice';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open = true, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Portfolios', href: '/portfolios', icon: BriefcaseIcon },
    { name: 'Assets', href: '/assets', icon: CurrencyDollarIcon },
    { name: 'Market', href: '/market', icon: ChartBarIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];
  const quickActions = [
    { name: 'Create Portfolio', href: '/portfolios/create', icon: PlusIcon },
    { name: 'Market Analysis', href: '/market', icon: ArrowTrendingUpIcon },
  ];
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile backdrop */}
      {open && onClose && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${onClose ? 'fixed' : 'relative'} inset-y-0 left-0 z-30 w-64 
        bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 
        backdrop-blur-xl border-r border-white/20 dark:border-gray-700/30 
        shadow-2xl transform transition-all duration-300 ease-in-out
        ${onClose ? (open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0') : ''}
        ${onClose ? 'lg:static lg:inset-0' : ''}
        h-full flex flex-col
      `}>
        {/* Header with Logo and Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-gray-700/30">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                Finlytics
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Smart Analytics
              </div>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 transform hover:scale-105"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* User Section */}
        <div className="p-6 border-b border-white/20 dark:border-gray-700/30">
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-500/5 dark:to-blue-600/5 border border-blue-500/20">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{user?.email}</p>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 dark:text-green-400 text-xs font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
              Navigation
            </h3>
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`
                      group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                      ${active
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105'
                      }
                    `}
                  >
                    {/* Hover effect background */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 transition-opacity duration-300 ${!active ? 'group-hover:opacity-100' : ''}`} />
                    
                    <Icon 
                      className={`
                        mr-3 h-5 w-5 transition-all duration-200 relative z-10
                        ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500 group-hover:scale-110'}
                      `} 
                    />
                    <span className="relative z-10">{item.name}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse relative z-10"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    onClick={onClose}
                    className="group flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                  >
                    <Icon className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-200" />
                    {action.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Portfolio Stats Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/15 dark:from-blue-500/5 dark:to-blue-600/10 rounded-xl p-4 border border-blue-500/20 dark:border-blue-500/10 mx-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Portfolio Value</h4>
              <BellIcon className="w-4 h-4 text-blue-500" />
            </div>            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹20,45,678.90</div>
              <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                +5.67% today
              </div>
            </div>
          </div>
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-white/20 dark:border-gray-700/30 space-y-2">
          <Link
            to="/settings"
            onClick={onClose}
            className="group flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
          >
            <CogIcon className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-blue-500 transition-colors duration-200" />
            Settings
          </Link>
          <button 
            onClick={() => {
              handleLogout();
              onClose?.();
            }}
            className="group flex items-center w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;