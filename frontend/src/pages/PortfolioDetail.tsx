import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPortfolioById, deletePortfolio, removeAssetFromPortfolio } from '../store/portfolioSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, formatPercentage, formatDate } from '../lib/utils';
import { toast } from 'react-toastify';

const PortfolioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentPortfolio, isLoading, error } = useAppSelector((state) => state.portfolio);  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'transactions' | 'performance'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveAssetModal, setShowRemoveAssetModal] = useState(false);
  const [assetToRemove, setAssetToRemove] = useState<{ assetId: string; symbol: string } | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchPortfolioById(id));
    }
  }, [dispatch, id]);
  const handleDeletePortfolio = async () => {
    if (!currentPortfolio) return;

    try {
      await dispatch(deletePortfolio(currentPortfolio._id)).unwrap();
      toast.success('Portfolio deleted successfully');
      navigate('/portfolios');    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Failed to delete portfolio';
      toast.error(message);
    }setShowDeleteModal(false);
  };

  const handleRemoveAsset = async () => {
    if (!currentPortfolio || !assetToRemove) return;

    try {
      await dispatch(removeAssetFromPortfolio({
        portfolioId: currentPortfolio._id,
        assetId: assetToRemove.assetId,
      })).unwrap();
      toast.success(`${assetToRemove.symbol} removed from portfolio successfully`);    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Failed to remove asset from portfolio';
      toast.error(message);
    }
    setShowRemoveAssetModal(false);
    setAssetToRemove(null);
  };

  const openRemoveAssetModal = (assetId: string, symbol: string) => {
    setAssetToRemove({ assetId, symbol });
    setShowRemoveAssetModal(true);
  };
  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card backdrop-blur-lg bg-white/70 border border-red-200 shadow-xl rounded-xl p-8 animate-slide-up">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-9 2a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Portfolio</h3>
                <p className="text-gray-600 mb-6">{error}</p>
              </div>
              <button
                onClick={() => navigate('/portfolios')}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 hover:scale-105"
              >
                Back to Portfolios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!currentPortfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl rounded-xl p-8 text-center animate-slide-up">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Portfolio Not Found</h3>
                <p className="text-gray-600 mb-6">
                  The portfolio you're looking for doesn't exist or you don't have access to it.
                </p>
              </div>
              <button
                onClick={() => navigate('/portfolios')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105"
              >
                Back to Portfolios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'holdings', name: 'Holdings', icon: '💼' },
    { id: 'transactions', name: 'Transactions', icon: '📈' },
    { id: 'performance', name: 'Performance', icon: '📉' },
  ];
  const totalReturn = currentPortfolio.totalReturn || currentPortfolio.totalGainLoss || 0;
  const totalInvested = currentPortfolio.totalInvested || currentPortfolio.totalCost || 0;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="glass-card backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/portfolios')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {currentPortfolio.name}
                    </h1>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m0 0h6a2 2 0 012 2v3M8 7H2a2 2 0 00-2 2v3m8 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v3m8 0h8m-8 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m8 0V9" />
                      </svg>
                      Created {formatDate(currentPortfolio.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to={`/portfolios/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-white/30 backdrop-blur-sm bg-white/50 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 hover:bg-white/70 hover:border-gray-300 transition-all duration-200 hover:scale-105"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-200 backdrop-blur-sm bg-red-50/80 shadow-sm text-sm leading-4 font-medium rounded-lg text-red-700 hover:bg-red-100/80 hover:border-red-300 transition-all duration-200 hover:scale-105"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Enhanced Portfolio Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Value Card */}
          <div className="glass-card backdrop-blur-md bg-white/80 border border-white/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-up">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {formatCurrency(currentPortfolio.totalValue || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Invested Card */}
          <div className="glass-card backdrop-blur-md bg-white/80 border border-white/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Invested</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {formatCurrency(totalInvested)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Return Card */}
          <div className="glass-card backdrop-blur-md bg-white/80 border border-white/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 ${totalReturn >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={totalReturn >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Return</p>
                  <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalReturn)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Return Percentage Card */}
          <div className="glass-card backdrop-blur-md bg-white/80 border border-white/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 ${returnPercentage >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Return %</p>
                  <p className={`text-2xl font-bold ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(returnPercentage)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Enhanced Tabs */}
        <div className="glass-card backdrop-blur-md bg-white/60 border border-white/20 shadow-lg rounded-xl mb-6 overflow-hidden">
          <nav className="flex space-x-0">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'holdings' | 'transactions' | 'performance')}
                className={`flex-1 py-4 px-6 font-medium text-sm transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                } ${index === 0 ? 'rounded-l-xl' : ''} ${index === tabs.length - 1 ? 'rounded-r-xl' : ''}`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-slide-in" />
                )}
              </button>
            ))}
          </nav>
        </div>        {/* Enhanced Tab Content */}
        <div className="glass-card backdrop-blur-md bg-white/80 border border-white/20 shadow-xl rounded-xl">
          {activeTab === 'overview' && (
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Portfolio Overview
                </h3>
              </div>
              
              {currentPortfolio.description && (
                <div className="mb-8 p-4 glass-card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Description
                  </h4>
                  <p className="text-blue-700 leading-relaxed">{currentPortfolio.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Portfolio Details
                  </h4>
                  <dl className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                        Currency:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {currentPortfolio.currency || 'USD'}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Created:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatDate(currentPortfolio.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Last Updated:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatDate(currentPortfolio.updatedAt || currentPortfolio.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <dt className="text-sm font-medium text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Visibility:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs ${currentPortfolio.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {currentPortfolio.isPublic ? '🌐 Public' : '🔒 Private'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div className="glass-card bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Actions
                  </h4>
                  <div className="space-y-3">
                    <Link
                      to={`/portfolios/${id}/add-asset`}
                      className="group flex items-center w-full p-3 text-left bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <div className="p-2 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="font-medium">Add New Asset</span>
                    </Link>
                    <Link
                      to={`/portfolios/${id}/transaction`}
                      className="group flex items-center w-full p-3 text-left bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <div className="p-2 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <span className="font-medium">Record Transaction</span>
                    </Link>
                    <button className="group flex items-center w-full p-3 text-left bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                      <div className="p-2 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium">Generate Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}          {activeTab === 'holdings' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Holdings
                  </h3>
                </div>
                <Link
                  to={`/portfolios/${id}/add-asset`}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Asset
                </Link>
              </div>
              
              {currentPortfolio.assets && currentPortfolio.assets.length > 0 ? (
                <div className="glass-card bg-white/90 border border-white/30 shadow-xl rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Asset
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Avg Price
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Current Price
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Total Value
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            P&L
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            P&L %
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/80 divide-y divide-gray-100">
                        {currentPortfolio.assets.map((asset) => (
                          <tr key={asset.assetId} className="hover:bg-white/60 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                  {asset.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{asset.symbol}</div>
                                  <div className="text-sm text-gray-500">{asset.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                {asset.quantity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatCurrency(asset.averagePrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatCurrency(asset.currentPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {formatCurrency(asset.totalValue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                asset.gainLoss >= 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {asset.gainLoss >= 0 ? '↗️' : '↘️'} {formatCurrency(asset.gainLoss)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                asset.gainLossPercentage >= 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {formatPercentage(asset.gainLossPercentage)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openRemoveAssetModal(asset.assetId, asset.symbol)}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                title={`Remove ${asset.symbol} from portfolio`}
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="glass-card bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full text-white">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No assets yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md">
                        Get started by adding your first asset to this portfolio. Build your investment journey one asset at a time.
                      </p>
                    </div>
                    <Link
                      to={`/portfolios/${id}/add-asset`}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Your First Asset
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}          {activeTab === 'transactions' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Transaction History
                  </h3>
                </div>
                <Link
                  to={`/portfolios/${id}/transaction`}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Transaction
                </Link>
              </div>
              
              {/* Sample transactions - in a real app, this would come from an API */}
              <div className="glass-card bg-white/90 border border-white/30 shadow-xl rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Asset
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/80 divide-y divide-gray-100">
                      {currentPortfolio.assets.length > 0 ? (
                        currentPortfolio.assets.map((asset, index) => (
                          <tr key={`${asset.assetId}-${index}`} className="hover:bg-white/60 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatDate(currentPortfolio.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-xs mr-3">
                                  {asset.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{asset.symbol}</div>
                                  <div className="text-sm text-gray-500">{asset.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                📈 BUY
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                {asset.quantity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatCurrency(asset.averagePrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {formatCurrency(asset.quantity * asset.averagePrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="p-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full text-white">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions yet</h3>
                                <p className="text-gray-600 mb-6 max-w-md">
                                  Start building your investment history by recording your first transaction.
                                </p>
                              </div>
                              <Link
                                to={`/portfolios/${id}/transaction`}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Record First Transaction
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>          )}{activeTab === 'performance' && (
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Performance Analytics
                </h3>
              </div>
              
              {/* Enhanced Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card backdrop-blur-md bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 shadow-xl rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-green-700">🏆 Best Performer</span>
                    </div>
                  </div>
                  {currentPortfolio.assets.length > 0 ? (
                    (() => {
                      const bestAsset = currentPortfolio.assets.reduce((best, asset) => 
                        asset.gainLossPercentage > best.gainLossPercentage ? asset : best
                      );
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {bestAsset.symbol.charAt(0)}
                            </div>
                            <div className="text-xl font-bold text-gray-900">{bestAsset.symbol}</div>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            +{formatPercentage(Math.abs(bestAsset.gainLossPercentage))}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(bestAsset.gainLoss)} gain
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-gray-400 mb-2">📊</div>
                      <div className="text-sm text-gray-500">No assets to analyze</div>
                    </div>
                  )}
                </div>
                
                <div className="glass-card backdrop-blur-md bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 shadow-xl rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg text-white shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-red-700">📉 Needs Attention</span>
                    </div>
                  </div>
                  {currentPortfolio.assets.length > 0 ? (
                    (() => {
                      const worstAsset = currentPortfolio.assets.reduce((worst, asset) => 
                        asset.gainLossPercentage < worst.gainLossPercentage ? asset : worst
                      );
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {worstAsset.symbol.charAt(0)}
                            </div>
                            <div className="text-xl font-bold text-gray-900">{worstAsset.symbol}</div>
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {formatPercentage(worstAsset.gainLossPercentage)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(worstAsset.gainLoss)} {worstAsset.gainLoss >= 0 ? 'gain' : 'loss'}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-gray-400 mb-2">📊</div>
                      <div className="text-sm text-gray-500">No assets to analyze</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Asset Allocation */}
              <div className="glass-card backdrop-blur-md bg-white/90 border border-white/30 shadow-xl rounded-xl p-6 mb-8 animate-fade-in">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Asset Allocation
                  </h4>
                </div>
                
                {currentPortfolio.assets.length > 0 ? (
                  <div className="space-y-4">
                    {currentPortfolio.assets.map((asset, index) => {
                      const percentage = (asset.totalValue / (currentPortfolio.totalValue || 1)) * 100;
                      const colors = [
                        'from-blue-500 to-cyan-500',
                        'from-purple-500 to-pink-500', 
                        'from-green-500 to-emerald-500',
                        'from-orange-500 to-red-500',
                        'from-indigo-500 to-purple-500'
                      ];
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <div key={asset.assetId} className="glass-card bg-white/50 border border-white/20 rounded-lg p-4 hover:bg-white/70 transition-all duration-200 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}>
                                {asset.symbol.charAt(0)}
                              </div>
                              <div>
                                <div className="text-lg font-bold text-gray-900">{asset.symbol}</div>
                                <div className="text-sm text-gray-600">{asset.quantity} shares</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{formatPercentage(percentage)}</div>
                              <div className="text-sm text-gray-600">{formatCurrency(asset.totalValue)}</div>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`bg-gradient-to-r ${colorClass} h-3 rounded-full transition-all duration-1000 ease-out shadow-inner`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Asset Data Available</h3>
                    <p className="text-gray-600 mb-6">Add assets to your portfolio to see allocation breakdown</p>
                    <Link
                      to={`/portfolios/${id}/add-asset`}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add First Asset
                    </Link>
                  </div>
                )}
              </div>

              {/* Enhanced Performance Chart Placeholder */}
              <div className="glass-card backdrop-blur-md bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50 shadow-xl rounded-xl p-8 text-center animate-fade-in">
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full text-white inline-flex mb-6 shadow-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">📈 Performance Charts</h3>
                  <p className="text-gray-600 mb-4">
                    Advanced portfolio performance analytics and interactive charts will be available here
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Historical Performance Tracking</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Asset Correlation Analysis</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Risk Assessment Metrics</span>
                    </div>
                  </div>                  <div className="mt-6 px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-lg">
                    <p className="text-xs text-violet-700 font-medium">
                      🚀 Chart integration coming in the next update
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>{/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fade-in">
          <div className="glass-card backdrop-blur-xl bg-white/90 border border-white/30 shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-lg mb-6">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-9 2a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Portfolio</h3>
              
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  ⚠️ Are you sure you want to delete <span className="font-bold">"{currentPortfolio?.name}"</span>? 
                  This action cannot be undone and will permanently remove all portfolio data, holdings, and transaction history.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold rounded-xl shadow-lg border border-gray-300 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </span>
                </button>
                <button
                  onClick={handleDeletePortfolio}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-200"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Forever</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Remove Asset Confirmation Modal */}
      {showRemoveAssetModal && assetToRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fade-in">
          <div className="glass-card backdrop-blur-xl bg-white/90 border border-white/30 shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg mb-6">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Remove Asset</h3>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {assetToRemove.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{assetToRemove.symbol}</div>
                  </div>
                </div>
                <p className="text-sm text-orange-800 leading-relaxed">
                  🗑️ Are you sure you want to remove this asset from your portfolio? This will permanently delete all holdings and transaction history for <span className="font-bold">{assetToRemove.symbol}</span>.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowRemoveAssetModal(false);
                    setAssetToRemove(null);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold rounded-xl shadow-lg border border-gray-300 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </span>
                </button>
                <button
                  onClick={handleRemoveAsset}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-200"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                    </svg>
                    <span>Remove Asset</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioDetail;
