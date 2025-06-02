import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import LoadingSpinner from '../ui/LoadingSpinner';

const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call for recent transactions
    const fetchRecentTransactions = async () => {
      setLoading(true);
      try {
        // For now, show no transactions since we don't have real transaction data
        // In a real app, you would fetch from the API
        setTransactions([]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
        setTransactions([]);
        setLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No transactions yet</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your recent transactions will appear here once you start trading.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Link
          key={transaction.id}
          to={`/portfolios/${transaction.portfolioId}`}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              transaction.type === 'BUY' 
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {transaction.type === 'BUY' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {transaction.type} {transaction.quantity} shares
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {formatDate(transaction.date)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(transaction.total)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              @ {formatCurrency(transaction.price)}
            </div>
          </div>
        </Link>
      ))}
      
      <div className="pt-2">
        <Link 
          to="/portfolios"
          className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors block text-center"
        >
          View All Portfolios →
        </Link>
      </div>
    </div>
  );
};

export default RecentTransactions;
