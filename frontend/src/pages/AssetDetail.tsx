import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchAssetBySymbol } from '../store/assetSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, formatPercentage, formatDate } from '../lib/utils';
import { toast } from 'react-toastify';

const AssetDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentAsset, isLoading, error } = useAppSelector((state) => state.asset);
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'news' | 'analysis'>('overview');
  const [watchlisted, setWatchlisted] = useState(false);

  // Basic symbol validation
  const isValidSymbol = (sym: string): boolean => {
    if (!sym) return false;
    // Check for common patterns of valid symbols
    // Indian stock symbols are typically 3-10 characters, alphanumeric
    const symbolPattern = /^[A-Z0-9]{1,10}$/i;
    return symbolPattern.test(sym) && sym.length >= 1 && sym.length <= 10;
  };

  useEffect(() => {
    if (symbol) {
      // Validate symbol before making API call
      if (!isValidSymbol(symbol)) {
        // Don't make API call for obviously invalid symbols
        console.warn(`Invalid symbol format: ${symbol}`);
        return;
      }
      dispatch(fetchAssetBySymbol(symbol));
    }
  }, [dispatch, symbol]);

  const handleAddToWatchlist = async () => {
    if (!currentAsset) return;

    try {
      // TODO: Implement addToWatchlist action
      setWatchlisted(!watchlisted);
      toast.success(watchlisted ? 'Removed from watchlist' : 'Added to watchlist');
    } catch (error: unknown) {
      const errMsg = (error instanceof Error) ? error.message : 'Failed to update watchlist';
      toast.error(errMsg);
    }
  };

  const handleAddToPortfolio = () => {
    if (!currentAsset) return;
    // TODO: Open modal to select portfolio and add asset
    toast.info('Add to portfolio feature coming soon');
  };
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check for invalid symbol before showing error
  if (symbol && !isValidSymbol(symbol)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Invalid Asset Symbol
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  The symbol "{symbol}" doesn't appear to be a valid asset symbol. 
                  Asset symbols are typically 1-10 characters long and contain only letters and numbers.
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => navigate('/assets')}
                    className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Browse All Assets
                  </button>
                  <button
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/assets')}
                    className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Asset Not Found
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {symbol ? (
                    <>The asset "{symbol}" could not be found. It may not be available in our database or may be temporarily unavailable.</>
                  ) : (
                    <>Asset information is not available.</>
                  )}
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => navigate('/assets')}
                    className="text-sm text-red-800 hover:text-red-900 underline"
                  >
                    Browse All Assets
                  </button>
                  <button
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/assets')}
                    className="text-sm text-red-800 hover:text-red-900 underline"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!currentAsset) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Asset not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {symbol ? (
                <>The asset "{symbol}" doesn't exist or is not available in our database.</>
              ) : (
                <>The asset you're looking for doesn't exist or is not available.</>
              )}
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => navigate('/assets')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Assets
              </button>
              <button
                onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/assets')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const change = currentAsset.priceChange24h || currentAsset.changePercent || 0;
  const changePercent = currentAsset.changePercent || 0;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'chart', name: 'Chart', icon: '📈' },
    { id: 'news', name: 'News', icon: '📰' },
    { id: 'analysis', name: 'Analysis', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/assets')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      {currentAsset.name}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {currentAsset.symbol}
                      </span>
                      {currentAsset.type && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {currentAsset.type.toUpperCase()}
                        </span>
                      )}
                    </h1>
                    <div className="flex items-center mt-1">
                      <p className="text-3xl font-bold text-gray-900 mr-4">
                        {formatCurrency(currentAsset.currentPrice || 0)}
                      </p>
                      <div className={`flex items-center ${
                        change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <svg className={`w-4 h-4 mr-1 ${change >= 0 ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7-7 7" />
                        </svg>
                        <span className="text-lg font-medium">
                          {change >= 0 ? '+' : ''}{formatCurrency(change)} ({formatPercentage(changePercent)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAddToWatchlist}
                  className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${
                    watchlisted
                      ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill={watchlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {watchlisted ? 'Watchlisted' : 'Add to Watchlist'}
                </button>
                <button
                  onClick={handleAddToPortfolio}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add to Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {currentAsset.marketCap && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Market Cap
                </dt>
                <dd className="mt-1 text-lg font-medium text-gray-900">
                  {formatCurrency(currentAsset.marketCap)}
                </dd>
              </div>
            </div>
          )}          {currentAsset.fiftyTwoWeekHigh && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  52w High
                </dt>
                <dd className="mt-1 text-lg font-medium text-green-600">
                  {formatCurrency(currentAsset.fiftyTwoWeekHigh)}
                </dd>
              </div>
            </div>
          )}

          {currentAsset.fiftyTwoWeekLow && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  52w Low
                </dt>
                <dd className="mt-1 text-lg font-medium text-red-600">
                  {formatCurrency(currentAsset.fiftyTwoWeekLow)}
                </dd>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'chart' | 'news' | 'analysis')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Overview</h3>
              
              {currentAsset.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{currentAsset.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Asset Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Symbol:</dt>
                      <dd className="text-sm font-medium text-gray-900">{currentAsset.symbol}</dd>
                    </div>
                    {currentAsset.type && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Type:</dt>
                        <dd className="text-sm font-medium text-gray-900">{currentAsset.type}</dd>
                      </div>
                    )}
                    {currentAsset.exchange && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Exchange:</dt>
                        <dd className="text-sm font-medium text-gray-900">{currentAsset.exchange}</dd>
                      </div>
                    )}
                    {currentAsset.lastUpdated && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Last Updated:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {formatDate(currentAsset.lastUpdated)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>                {(currentAsset.marketCap || currentAsset.fiftyTwoWeekHigh || currentAsset.fiftyTwoWeekLow) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Market Data</h4>
                    <dl className="space-y-2">
                      {currentAsset.marketCap && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Market Cap:</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {formatCurrency(currentAsset.marketCap)}
                          </dd>
                        </div>
                      )}
                      {currentAsset.fiftyTwoWeekHigh && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">52w High:</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {formatCurrency(currentAsset.fiftyTwoWeekHigh)}
                          </dd>
                        </div>
                      )}
                      {currentAsset.fiftyTwoWeekLow && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">52w Low:</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {formatCurrency(currentAsset.fiftyTwoWeekLow)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Price Chart</h3>
              <div className="text-center text-gray-500 py-16">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-lg">Interactive price chart</p>
                <p className="text-sm mt-2">Chart functionality will be available soon</p>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Latest News</h3>
              <div className="text-center text-gray-500 py-16">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="mt-4 text-lg">Latest news and updates</p>
                <p className="text-sm mt-2">News feed will be available soon</p>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Analysis</h3>
              <div className="text-center text-gray-500 py-16">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-lg">Technical analysis and indicators</p>
                <p className="text-sm mt-2">Analysis tools will be available soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
