import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  HomeIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  PlusIcon,
  BookmarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, badge: null },
  { name: 'Portfolios', href: '/portfolios', icon: ChartBarIcon, badge: null },
  { name: 'Assets', href: '/assets', icon: BanknotesIcon, badge: null },
  { name: 'Market', href: '/market', icon: ArrowTrendingUpIcon, badge: 'HOT' },
  { name: 'Profile', href: '/profile', icon: UserIcon, badge: null },
]

const quickActions = [
  { name: 'Create Portfolio', href: '/portfolios/create', icon: PlusIcon, color: 'text-primary-600' },
  { name: 'Watchlist', href: '/watchlist', icon: BookmarkIcon, color: 'text-success-600' },
  { name: 'Alerts', href: '/alerts', icon: BellIcon, color: 'text-warning-600' },
]

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation()
  const { logout, user } = useAuth()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <>
      {/* Mobile backdrop with blur */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Enhanced Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-72 glass-card border-r border-white/20 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl">
          {/* Enhanced Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-white/20">
            <Link to="/dashboard" className="flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold gradient-text">
                  Portfolio Tracker
                </span>
                <div className="text-xs text-secondary-500 font-medium">
                  Professional Edition
                </div>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl hover:bg-white/50 transition-all duration-200 transform hover:scale-105"
            >
              <XMarkIcon className="w-5 h-5 text-secondary-400" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-4">
            <div className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
              Quick Actions
            </div>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex flex-col items-center p-3 rounded-xl hover:bg-white/50 transition-all duration-200 transform hover:scale-105 group"
                >
                  <action.icon className={`w-5 h-5 ${action.color} mb-1 group-hover:scale-110 transition-transform duration-200`} />
                  <span className="text-xs font-medium text-secondary-600 text-center">
                    {action.name.split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1">
            <div className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
              Navigation
            </div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-secondary-600 hover:bg-white/60 hover:text-secondary-900 hover:scale-105'
                  )}
                >
                  {/* Hover effect background */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-600/10 opacity-0 transition-opacity duration-300',
                    hoveredItem === item.name && !isActive ? 'opacity-100' : ''
                  )} />
                  
                  <div className="flex items-center relative z-10">
                    <item.icon
                      className={cn(
                        'w-5 h-5 mr-3 transition-all duration-300',
                        isActive 
                          ? 'text-white' 
                          : 'text-secondary-400 group-hover:text-primary-500 group-hover:scale-110'
                      )}
                    />
                    {item.name}
                  </div>
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-bold bg-danger-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Enhanced User section */}
          <div className="border-t border-white/20 px-4 py-4 bg-gradient-to-r from-white/50 to-white/30">
            <div className="flex items-center mb-4 p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-all duration-200 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-sm font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-secondary-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse mr-2" />
                  <span className="text-xs text-success-600 font-medium">Online</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-secondary-600 rounded-xl hover:bg-danger-50 hover:text-danger-600 transition-all duration-200 transform hover:scale-105 group"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-secondary-400 group-hover:text-danger-500 transition-colors duration-200" />
              Sign out
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                →
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
