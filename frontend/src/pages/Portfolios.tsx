import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPortfolios } from '../store/portfolioSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../lib/utils';
import { 
  PlusIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { 
  BriefcaseIcon as BriefcaseSolidIcon,
  ArrowTrendingUpIcon as ArrowTrendingUpSolidIcon
} from '@heroicons/react/24/solid';

const Portfolios: React.FC = () => {
  const dispatch = useAppDispatch();
  const { portfolios, loading, error } = useAppSelector((state) => state.portfolio);
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'return'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);
  const sortedPortfolios = React.useMemo(() => {
    if (!portfolios || !portfolios.length) return [];
    
    return [...portfolios].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'value':
          aValue = a.totalValue || 0;
          bValue = b.totalValue || 0;
          break;
        case 'return':
          aValue = a.totalReturn || 0;
          bValue = b.totalReturn || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [portfolios, sortBy, sortOrder]);

  const handleSort = (newSortBy: 'name' | 'value' | 'return') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <LoadingSpinner size="lg" variant="gradient" fullScreen text="Loading portfolios..." />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card border border-red-500/20 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Error loading portfolios</h3>
                <p className="text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 animate-slide-up">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              My Portfolios
            </h1>
            <p className="mt-3 text-lg text-gray-300">
              Manage and track all your investment portfolios
            </p>
          </div>
          <Link
            to="/portfolios/create"
            className="btn-primary group animate-slide-up inline-flex items-center px-6 py-3 text-base font-medium"
            style={{ animationDelay: '0.2s' }}
          >
            <PlusIcon className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Create Portfolio
            <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Portfolios */}
          <div className="glass-card hover:glass-card-hover group animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BriefcaseSolidIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-300 truncate">
                    Total Portfolios
                  </dt>
                  <dd className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300">
                    {portfolios?.length || 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="glass-card hover:glass-card-hover group animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-300 truncate">
                    Total Value
                  </dt>
                  <dd className="text-2xl font-bold text-white group-hover:text-emerald-200 transition-colors duration-300">
                    {formatCurrency((portfolios || []).reduce((sum, p) => sum + (p.totalValue || 0), 0))}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Total Return */}
          <div className="glass-card hover:glass-card-hover group animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowTrendingUpSolidIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-300 truncate">
                    Total Return
                  </dt>
                  <dd className="text-2xl font-bold text-white group-hover:text-amber-200 transition-colors duration-300">
                    {formatPercentage(
                      (portfolios || []).reduce((sum, p) => sum + (p.totalReturn || p.totalGainLoss || 0), 0) / 
                      (portfolios || []).reduce((sum, p) => sum + (p.totalInvested || p.totalCost || 1), 1) * 100
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-300" />
                <span className="text-sm font-medium text-gray-300">Sort by:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    sortBy === 'name' 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Name
                  {sortBy === 'name' && (
                    <span className="ml-2 text-xs">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleSort('value')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    sortBy === 'value' 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Value
                  {sortBy === 'value' && (
                    <span className="ml-2 text-xs">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleSort('return')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    sortBy === 'return' 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Return
                  {sortBy === 'return' && (
                    <span className="ml-2 text-xs">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolios Grid */}
        {sortedPortfolios.length === 0 ? (
          <div className="glass-card text-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BriefcaseIcon className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No portfolios yet</h3>
            <p className="text-gray-300 mb-8 max-w-md mx-auto">
              Get started by creating your first portfolio to track your investments and monitor performance.
            </p>
            <Link
              to="/portfolios/create"
              className="btn-primary inline-flex items-center px-6 py-3 text-base font-medium"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Portfolio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPortfolios.map((portfolio, index) => (
              <Link
                key={portfolio.id || portfolio._id}
                to={`/portfolios/${portfolio.id || portfolio._id}`}
                className="glass-card hover:glass-card-hover group block animate-slide-up"
                style={{ animationDelay: `${0.1 * (index % 6)}s` }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors duration-300 truncate">
                        {portfolio.name}
                      </h3>
                      {portfolio.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {portfolio.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                        (portfolio.totalReturn || portfolio.totalGainLoss || 0) >= 0
                          ? 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30'
                      }`}>
                        {(portfolio.totalReturn || portfolio.totalGainLoss || 0) >= 0 ? (
                          <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
                        )}
                        {formatPercentage(
                          ((portfolio.totalReturn || portfolio.totalGainLoss || 0) / (portfolio.totalInvested || portfolio.totalCost || 1)) * 100
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Portfolio Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Value</span>
                      <span className="text-lg font-bold text-white">
                        {formatCurrency(portfolio.totalValue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Invested</span>
                      <span className="text-sm font-medium text-gray-300">
                        {formatCurrency(portfolio.totalInvested || portfolio.totalCost || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">P&L</span>
                      <span className={`text-sm font-medium ${
                        (portfolio.totalReturn || portfolio.totalGainLoss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(portfolio.totalReturn || portfolio.totalGainLoss || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated {new Date(portfolio.updatedAt || portfolio.createdAt).toLocaleDateString()}
                    </div>
                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 rounded-xl transition-all duration-500 pointer-events-none" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolios;
