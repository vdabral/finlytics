import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPortfolioById, recordTransaction } from '../store/portfolioSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../lib/utils';

interface TransactionForm {
  assetSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fees: number;
  notes: string;
  date: string;
}

interface TransactionErrors {
  assetSymbol?: string;
  quantity?: string;
  price?: string;
  fees?: string;
  date?: string;
}

const RecordTransaction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentPortfolio, isLoading } = useAppSelector((state) => state.portfolio);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TransactionForm>({
    assetSymbol: '',
    type: 'BUY',
    quantity: 1,
    price: 0,
    fees: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  });
  const [errors, setErrors] = useState<TransactionErrors>({});

  useEffect(() => {
    if (id) {
      dispatch(fetchPortfolioById(id));
    }
  }, [dispatch, id]);

  const validateForm = (): boolean => {
    const newErrors: TransactionErrors = {};

    if (!formData.assetSymbol.trim()) {
      newErrors.assetSymbol = 'Asset symbol is required';
    } else if (formData.assetSymbol.trim().length < 1) {
      newErrors.assetSymbol = 'Asset symbol must be valid';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    } else if (formData.quantity > 1000000) {
      newErrors.quantity = 'Quantity cannot exceed 1,000,000';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';    } else if (formData.price > 10000000) {
      newErrors.price = 'Price cannot exceed ₹1,00,00,000';
    }

    if (formData.fees < 0) {
      newErrors.fees = 'Fees cannot be negative';    } else if (formData.fees > 100000) {
      newErrors.fees = 'Fees cannot exceed ₹1,00,000';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (new Date(formData.date) > new Date()) {
      newErrors.date = 'Date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof TransactionErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !currentPortfolio) {
      return;
    }

    setSubmitting(true);

    try {
      // Find or create asset ID - for now, use symbol as ID
      // In a real app, you'd have an asset lookup service
      const assetId = formData.assetSymbol.toUpperCase();
      
      await dispatch(recordTransaction({
        portfolioId: currentPortfolio._id,
        transactionData: {
          assetId,
          type: formData.type.toLowerCase() as 'buy' | 'sell',
          quantity: formData.quantity,
          price: formData.price,
          fees: formData.fees > 0 ? formData.fees : undefined,
          notes: formData.notes.trim() || undefined,
          date: formData.date,
        }
      })).unwrap();
      
      toast.success('Transaction recorded successfully!');
      navigate(`/portfolios/${id}`);    } catch (error: unknown) {
      console.error('Error recording transaction:', error);
      const message = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Failed to record transaction';
      toast.error(message);
    }finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/portfolios/${id}`);
  };

  const selectAssetFromPortfolio = (symbol: string) => {
    setFormData(prev => ({
      ...prev,
      assetSymbol: symbol,
    }));
    
    // Clear error when asset is selected
    if (errors.assetSymbol) {
      setErrors(prev => ({
        ...prev,
        assetSymbol: '',
      }));
    }
  };

  const totalAmount = formData.quantity * formData.price;
  const totalWithFees = formData.type === 'BUY' ? totalAmount + formData.fees : totalAmount - formData.fees;

  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!currentPortfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card backdrop-blur-lg bg-white/70 dark:bg-secondary-800/70 border border-white/20 dark:border-secondary-700/30 shadow-xl rounded-xl p-8 text-center animate-slide-up">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gradient-to-r from-danger-500 to-danger-600 rounded-full text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Portfolio Not Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The portfolio you're trying to add a transaction to doesn't exist or you don't have access to it.
                </p>
              </div>
              <button
                onClick={() => navigate('/portfolios')}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium shadow-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 hover:scale-105"
              >
                Back to Portfolios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card backdrop-blur-lg bg-white/70 dark:bg-secondary-800/70 border border-white/20 dark:border-secondary-700/30 shadow-xl rounded-xl overflow-hidden animate-slide-up">
          {/* Enhanced Header */}
          <div className="px-6 py-6 border-b border-white/20 dark:border-secondary-700/30 bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-900/20 dark:to-primary-800/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Record Transaction
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Add a new transaction to <span className="font-medium text-primary-600 dark:text-primary-400">"{currentPortfolio.name}"</span>
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Asset Selection */}
            <div className="group">
              <label htmlFor="assetSymbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Symbol *
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(e.g., AAPL, TSLA, BTC)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="assetSymbol"
                  name="assetSymbol"
                  value={formData.assetSymbol}
                  onChange={handleInputChange}
                  className={`input-field ${
                    errors.assetSymbol 
                      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20' 
                      : 'border-white/30 dark:border-secondary-600 focus:border-primary-500 focus:ring-primary-500/20'
                  }`}
                  placeholder="Enter asset symbol..."
                  maxLength={10}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
              {errors.assetSymbol && (
                <div className="mt-2 flex items-center space-x-1 text-danger-600 animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{errors.assetSymbol}</p>
                </div>
              )}
              
              {/* Enhanced Quick Select from Portfolio Assets */}
              {currentPortfolio.assets.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-700/30">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Quick select from portfolio:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentPortfolio.assets.map((asset, index) => (
                      <button
                        key={asset.assetId}
                        type="button"
                        onClick={() => selectAssetFromPortfolio(asset.symbol)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 ${
                          formData.assetSymbol === asset.symbol
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-transparent shadow-md'
                            : 'bg-white/80 dark:bg-secondary-700/50 border-primary-200 dark:border-primary-700/30 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {asset.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Type */}
            <div className="group">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Type *
              </label>
              <div className="relative">
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field appearance-none"
                >
                  <option value="BUY">🟢 Buy</option>
                  <option value="SELL">🔴 Sell</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity *
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Number of shares/units)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0.0001"
                    step="0.0001"
                    className={`input-field ${
                      errors.quantity 
                        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20' 
                        : ''
                    }`}
                    placeholder="0.0000"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
                {errors.quantity && (
                  <div className="mt-2 flex items-center space-x-1 text-danger-600 animate-fade-in">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">{errors.quantity}</p>
                  </div>
                )}
              </div>

              <div className="group">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price per Unit *
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(INR)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    className={`input-field ${
                      errors.price 
                        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20' 
                        : ''
                    }`}
                    placeholder="0.00"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
                {errors.price && (
                  <div className="mt-2 flex items-center space-x-1 text-danger-600 animate-fade-in">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">{errors.price}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700/30 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction Summary</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Subtotal:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-primary-200 dark:border-primary-700/30 pt-3">
                  <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <svg className={`w-5 h-5 mr-2 ${formData.type === 'BUY' ? 'text-danger-500' : 'text-success-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={formData.type === 'BUY' ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
                    </svg>
                    Total {formData.type === 'BUY' ? 'Cost' : 'Proceeds'}:
                  </span>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${
                      formData.type === 'BUY' ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
                    }`}>
                      {formData.type === 'BUY' ? '-' : '+'}{formatCurrency(totalWithFees)}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.quantity} shares @ {formatCurrency(formData.price)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/20 dark:border-secondary-700/30">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Recording...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 6h.01M9 16h.01" />
                    </svg>
                    <span>Record Transaction</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecordTransaction;
