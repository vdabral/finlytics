import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchAssets } from '../store/assetSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../lib/utils';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowsUpDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';

const Assets: React.FC = () => {
  const dispatch = useAppDispatch();
  const { assets, isLoading, error } = useAppSelector((state) => state.asset);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change' | 'marketCap'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<'all' | 'stocks' | 'crypto' | 'etf' | 'bonds'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    dispatch(fetchAssets({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Debug logging to see what data structure we're getting
  useEffect(() => {
    if (assets && assets.length > 0) {
      console.log('Assets data received:', assets);
      console.log('First asset:', assets[0]);
      console.log('Asset name field:', assets[0]?.name);
      console.log('Asset symbol field:', assets[0]?.symbol);
    }  }, [assets]);

  const safeAssets = useMemo(() => assets || [], [assets]);
  
  const toggleFavorite = (assetId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(assetId)) {
      newFavorites.delete(assetId);
    } else {
      newFavorites.add(assetId);
    }
    setFavorites(newFavorites);
  };  const handleTradeClick = (symbol: string) => {
    // Use MoneyControl's search functionality which is more reliable
    const searchQuery = encodeURIComponent(symbol);
    const moneyControlUrl = `https://www.moneycontrol.com/india/stockmarket/stocks/stocksearch/?search=${searchQuery}`;
    window.open(moneyControlUrl, '_blank', 'noopener,noreferrer');
  };
  const filteredAssets = React.useMemo(() => {
    const filtered = safeAssets.filter((asset) => {
      const matchesSearch = (asset.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (asset.symbol?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || 
                             (asset.type && asset.type.toLowerCase() === filterCategory);

      return matchesSearch && matchesCategory;
    });    // Sort the filtered assets
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'price':
          aValue = a.currentPrice || 0;
          bValue = b.currentPrice || 0;
          break;
        case 'change':
          aValue = a.priceChange24h || a.changePercent || 0;
          bValue = b.priceChange24h || b.changePercent || 0;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [safeAssets, searchTerm, sortBy, sortOrder, filterCategory]);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Unable to Load Assets</h3>
          <p className="text-secondary-600 mb-4">{error}</p>
          <button 
            onClick={() => dispatch(fetchAssets({ page: 1, limit: 100 }))}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Floating Action Button */}
      <button
        className="fixed bottom-8 right-8 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg p-4 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-300 animate-bounce"
        aria-label="Add Asset"
        tabIndex={0}
        onClick={() => alert('Quick Add Asset coming soon!')}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="glass-card p-6 border border-white/20 shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold gradient-text mb-2">Market Assets</h1>
                <p className="text-secondary-600">
                  Browse and track {filteredAssets.length} financial assets across different markets
                </p>
              </div>
              {/* Market Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-success-50 rounded-xl shadow-sm">
                  <div className="text-success-600 font-bold text-lg">
                    {safeAssets.filter(a => (a.priceChange24h || a.changePercent || 0) > 0).length}
                  </div>
                  <div className="text-success-600 text-sm font-medium">Gainers</div>
                </div>
                <div className="p-3 bg-danger-50 rounded-xl shadow-sm">
                  <div className="text-danger-600 font-bold text-lg">
                    {safeAssets.filter(a => (a.priceChange24h || a.changePercent || 0) < 0).length}
                  </div>
                  <div className="text-danger-600 text-sm font-medium">Losers</div>
                </div>
                <div className="p-3 bg-primary-50 rounded-xl shadow-sm">
                  <div className="text-primary-600 font-bold text-lg">{safeAssets.length}</div>
                  <div className="text-primary-600 text-sm font-medium">Total</div>
                </div>
              </div>
            </div>
            {/* Refresh Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => dispatch(fetchAssets({ page: 1, limit: 100 }))}
                className="btn-secondary flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                disabled={isLoading}
                tabIndex={0}
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isLoading ? 'Refreshing...' : 'Refresh Market Data'}</span>
              </button>
            </div>
            {/* Enhanced Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full focus:ring-2 focus:ring-primary-300"
                  aria-label="Search assets"
                />
              </div>
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as 'all' | 'stocks' | 'crypto' | 'etf' | 'bonds')}
                  className="input-field w-full appearance-none pr-10 focus:ring-2 focus:ring-primary-300"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  <option value="stocks">Stocks</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="etf">ETFs</option>
                  <option value="bonds">Bonds</option>
                </select>
                <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400 pointer-events-none" />
              </div>
              {/* Sort Controls */}
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'change' | 'marketCap')}
                  className="input-field flex-1 appearance-none focus:ring-2 focus:ring-primary-300"
                  aria-label="Sort by"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="change">24h Change</option>
                  <option value="marketCap">Market Cap</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-3 glass-card border border-white/20 rounded-xl hover:bg-white/50 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  aria-label="Toggle sort order"
                  tabIndex={0}
                >
                  <ArrowsUpDownIcon className="h-5 w-5 text-secondary-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Assets Display */}
        {filteredAssets.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No assets found</h3>
            <p className="text-secondary-600 mb-4">
              Try adjusting your search criteria or filters to find assets.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="btn-primary mt-2"
              aria-label="Clear search"
              tabIndex={0}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
            {filteredAssets.map((asset, index) => {
              const change = asset.priceChange24h || asset.changePercent || 0;
              const isPositive = change >= 0;
              
              // Create a more robust key that fallbacks to other identifiers
              const assetKey = asset._id || asset.id || asset.symbol || `asset-${index}`;
              const assetId = asset._id || asset.id || asset.symbol;
              const isFavorite = favorites.has(assetId);
              
              return (
                <div
                  key={assetKey}
                  className="group animate-fade-in focus-within:ring-2 focus-within:ring-primary-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                  tabIndex={0}
                  aria-label={`Asset card for ${asset.name || asset.symbol}`}
                >
                  {/* Grid Card View */}
                  <div className="glass-card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 p-6 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-300">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                      isPositive ? 'bg-gradient-to-br from-success-500 to-emerald-600' : 'bg-gradient-to-br from-danger-500 to-red-600'
                    }`} />
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {(asset.symbol || 'N/A').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
                            {asset.symbol || 'N/A'}
                          </h3>
                          <p className="text-sm text-secondary-600 truncate max-w-[120px]">
                            {asset.name || 'Unknown Asset'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(asset._id)}
                        className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-danger-300 ${
                          isFavorite 
                            ? 'bg-danger-100 text-danger-600' 
                            : 'bg-secondary-100 text-secondary-400 hover:bg-danger-100 hover:text-danger-600'
                        }`}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        tabIndex={0}
                        data-tooltip-id={`favorite-tooltip-${assetKey}`}
                      >
                        <HeartIcon className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <Tooltip id={`favorite-tooltip-${assetKey}`} content={isFavorite ? 'Remove from favorites' : 'Add to favorites'} />
                    </div>

                    {/* Price */}
                    <div className="mb-4 relative z-10">
                      <div className="text-2xl font-bold text-secondary-900 mb-1">
                        {formatCurrency(asset.currentPrice)}
                      </div>
                      <div className={`flex items-center text-sm font-medium ${
                        isPositive ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {isPositive ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                        )}
                        {isPositive ? '+' : ''}{formatPercentage(change)}
                      </div>
                    </div>                      {/* Actions */}
                    <div className="flex space-x-2 relative z-10">
                      {asset.symbol ? (
                        <Link
                          to={`/assets/${asset.symbol}`}
                          className="flex-1 btn-primary text-center py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                          aria-label={`View details for ${asset.symbol}`}
                          tabIndex={0}
                          data-tooltip-id={`view-tooltip-${assetKey}`}
                        >
                          <EyeIcon className="w-4 h-4 mr-1 inline" />
                          View
                        </Link>
                      ) : (
                        <div className="flex-1 btn-disabled text-center py-2 text-sm font-medium cursor-not-allowed opacity-50">
                          <EyeIcon className="w-4 h-4 mr-1 inline" />
                          View
                        </div>
                      )}
                      <Tooltip id={`view-tooltip-${assetKey}`} content="View details" />
                      <button
                        onClick={() => handleTradeClick(asset.symbol || asset._id || asset.id)}
                        className="px-4 py-2 bg-success-100 text-success-700 rounded-xl hover:bg-success-200 transition-colors duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-success-300"
                        aria-label={`Trade ${asset.symbol}`}
                        tabIndex={0}
                        data-tooltip-id={`trade-tooltip-${assetKey}`}
                      >
                        Trade
                      </button>
                      <Tooltip id={`trade-tooltip-${assetKey}`} content="Trade on MoneyControl" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Tooltips Portal */}
      <div id="tooltip-root" />
    </div>
  );
};

export default Assets;
