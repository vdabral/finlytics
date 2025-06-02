import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPortfolios } from '../store/portfolioSlice';
import { fetchAssets } from '../store/assetSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PortfolioCard from '../components/dashboard/PortfolioCard';
import StatsCard from '../components/dashboard/StatsCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import PortfolioChart from '../components/dashboard/PortfolioChart';
import { formatCurrency } from '../lib/utils';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);  const { portfolios, isLoading: portfolioLoading } = useAppSelector((state) => state.portfolio);
  const { assets, isLoading: assetLoading } = useAppSelector((state) => state.asset);

  useEffect(() => {
    dispatch(fetchPortfolios());
    dispatch(fetchAssets({ page: 1, limit: 10 }));  }, [dispatch]);  
  // Calculate dashboard statistics with null checks
  const safePortfolios = portfolios || [];
  const safeAssets = assets || [];
  const totalValue = safePortfolios.reduce((sum, portfolio) => sum + (portfolio.totalValue || 0), 0);
  const totalGainLoss = safePortfolios.reduce((sum, portfolio) => {
    const invested = portfolio.totalInvested || portfolio.totalCost || 0;
    return sum + ((portfolio.totalValue || 0) - invested);
  }, 0);
  const totalGainLossPercentage = totalValue > totalGainLoss ? (totalGainLoss / (totalValue - totalGainLoss) * 100) : 0;

  const bestPerformingPortfolio = safePortfolios.length > 0 ? safePortfolios.reduce((best, current) => {
    const currentInvested = current.totalInvested || current.totalCost || 1;
    const bestInvested = best.totalInvested || best.totalCost || 1;
    const currentReturn = ((current.totalValue || 0) - currentInvested) / currentInvested * 100;
    const bestReturn = ((best.totalValue || 0) - bestInvested) / bestInvested * 100;
    return currentReturn > bestReturn ? current : best;
  }, safePortfolios[0]) : null;

  if (portfolioLoading || assetLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100 dark:text-blue-200">
          Here's an overview of your investment portfolio performance.
        </p>
      </div>      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Portfolio Value"
          value={formatCurrency(totalValue)}
          change={totalGainLossPercentage}
          changeLabel="vs last month"
          icon="💰"
          link="/portfolios"
        />
        <StatsCard
          title="Total Gain/Loss"
          value={formatCurrency(totalGainLoss)}
          change={totalGainLossPercentage}
          changeLabel="return"
          icon="📈"
          isGainLoss
          link="/portfolios"
        />
        <StatsCard
          title="Active Portfolios"
          value={safePortfolios.length.toString()}
          change={0}
          changeLabel="portfolios"
          icon="📊"
          link="/portfolios"
        />
        <StatsCard
          title="Best Performer"
          value={bestPerformingPortfolio?.name || 'N/A'}
          change={bestPerformingPortfolio ? (bestPerformingPortfolio.totalValue - (bestPerformingPortfolio.totalInvested || bestPerformingPortfolio.totalCost)) / (bestPerformingPortfolio.totalInvested || bestPerformingPortfolio.totalCost) * 100 : 0}
          changeLabel="return"
          icon="🏆"
          isGainLoss
          link={bestPerformingPortfolio ? `/portfolios/${bestPerformingPortfolio._id}` : "/portfolios"}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Portfolio Performance</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  1M
                </button>
                <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                  3M
                </button>
                <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                  1Y
                </button>                <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                  All
                </button>
              </div>
            </div>
            <PortfolioChart portfolios={safePortfolios} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Recent Activity</h2>
            <RecentTransactions />
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Portfolios</h2>
          <Link to="/portfolios/create" className="btn-primary">
            Create New Portfolio
          </Link>
        </div>

        {safePortfolios.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No portfolios yet</h3>            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first investment portfolio to track your assets.
            </p>
            <Link to="/portfolios/create" className="btn-primary">
              Create Your First Portfolio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safePortfolios.map((portfolio, index) => (
              <PortfolioCard key={portfolio._id} portfolio={portfolio} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Market Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Market Overview</h2>
          <Link 
            to="/market" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
          >
            View All Markets →
          </Link>
        </div>        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeAssets.slice(0, 6).map((asset) => (
            <Link
              key={asset._id}
              to={`/assets/${asset.symbol}`}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{asset.symbol}</span>
                <span className={`text-sm font-medium ${
                  (asset.priceChange24h || asset.changePercent) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {(asset.priceChange24h || asset.changePercent) >= 0 ? '+' : ''}{(asset.priceChange24h || asset.changePercent || 0).toFixed(2)}%
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(asset.currentPrice)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
