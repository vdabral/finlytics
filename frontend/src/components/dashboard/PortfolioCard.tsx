import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Portfolio } from '../../types';
import { formatCurrency, formatPercentage } from '../../lib/utils';

interface PortfolioCardProps {
  portfolio: Portfolio;
  index?: number;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const invested = portfolio.totalInvested || portfolio.totalCost;
  const gainLoss = portfolio.totalValue - invested;
  const gainLossPercentage = (gainLoss / invested) * 100;
  const isPositive = gainLoss >= 0;

  // Animation delay based on card index
  const animationDelay = `${index * 100}ms`;

  return (
    <div 
      className="group relative"
      style={{ animationDelay }}
    >      {/* Background gradient effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <Link 
        to={`/portfolios/${portfolio._id}`}
        className="relative block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bg-white/90 dark:bg-secondary-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-secondary-700/30 p-6 hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-500 hover:bg-white dark:hover:bg-secondary-800 slide-up">
          {/* Header with icon and status */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  isHovered 
                    ? 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg scale-110' 
                    : 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20'
                }`}>
                  <svg 
                    className={`w-6 h-6 transition-colors duration-300 ${
                      isHovered ? 'text-white' : 'text-primary-600 dark:text-primary-400'
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                  {/* Status indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                {portfolio.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{portfolio.description || 'No description'}</p>
            </div>
          </div>

          {/* Value section */}
          <div className="space-y-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-primary-50 dark:from-secondary-800 dark:to-primary-900/20 rounded-xl">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {formatCurrency(portfolio.totalValue)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Total Portfolio Value
              </div>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className={`text-lg font-bold mb-1 ${isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Gain/Loss
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold mb-1 flex items-center justify-center ${isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  <svg 
                    className={`w-4 h-4 mr-1 ${isPositive ? 'rotate-0' : 'rotate-180'}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
                  </svg>
                  {isPositive ? '+' : ''}{formatPercentage(gainLossPercentage)}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Return %
                </div>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                {/* Mock asset icons */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{i}</span>
                  </div>
                ))}
                {((portfolio.holdings || portfolio.assets)?.length || 0) > 3 && (
                  <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">+</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {(portfolio.holdings || portfolio.assets)?.length || 0} Assets
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Updated {new Date(portfolio.updatedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Hover overlay with actions */}
          <div className={`absolute inset-0 bg-gradient-to-br from-indigo-600/95 to-purple-700/95 backdrop-blur-sm rounded-2xl flex items-center justify-center space-x-3 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105">
              View Details
            </button>
            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105">
              Quick Trade
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PortfolioCard;
