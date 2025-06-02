import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPortfolioById, addAssetToPortfolio } from '../store/portfolioSlice';
import { searchAssets } from '../store/assetSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../lib/utils';

interface AddAssetForm {
  symbol: string;
  quantity: number;
  purchasePrice: number;
}

interface AddAssetErrors {
  symbol?: string;
  quantity?: string;
  purchasePrice?: string;
}

const AddAssetToPortfolio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
    const { currentPortfolio, isLoading } = useAppSelector((state) => state.portfolio);
  const { searchResults } = useAppSelector((state) => state.asset);
  
  const [formData, setFormData] = useState<AddAssetForm>({
    symbol: '',
    quantity: 0,
    purchasePrice: 0,
  });
  const [errors, setErrors] = useState<AddAssetErrors>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchPortfolioById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const timeoutId = setTimeout(() => {
        dispatch(searchAssets(searchQuery));
        setShowDropdown(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setShowDropdown(false);
    }
  }, [searchQuery, dispatch]);
  const validateForm = (): boolean => {
    const newErrors: AddAssetErrors = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Asset symbol is required';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() : parseFloat(value) || 0,
    }));    if (errors[name as keyof AddAssetErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSearchQuery(value);
    setFormData(prev => ({ ...prev, symbol: value }));
    
    if (errors.symbol) {
      setErrors(prev => ({ ...prev, symbol: '' }));
    }
  };

  const selectAsset = (symbol: string, currentPrice: number) => {
    setFormData(prev => ({
      ...prev,
      symbol,
      purchasePrice: currentPrice,
    }));
    setSearchQuery(symbol);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setSubmitting(true);

    try {
      await dispatch(addAssetToPortfolio({
        portfolioId: id,
        assetData: {
          symbol: formData.symbol,
          quantity: formData.quantity,
          purchasePrice: formData.purchasePrice,
        }
      })).unwrap();
        toast.success('Asset added to portfolio successfully!');
      navigate(`/portfolios/${id}`);
    } catch (error: unknown) {
      console.error('Error adding asset:', error);
      const message = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Failed to add asset to portfolio';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalValue = formData.quantity * formData.purchasePrice;

  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (!currentPortfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl rounded-xl p-8 text-center animate-slide-up">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Portfolio Not Found</h3>
                <p className="text-gray-600 mb-6">
                  The portfolio you're trying to add an asset to doesn't exist or has been removed.
                </p>
              </div>
              <button
                onClick={() => navigate('/portfolios')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl rounded-xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-6 py-6 border-b border-white/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Add Asset
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Add a new asset to <span className="font-medium text-emerald-600">"{currentPortfolio.name}"</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/portfolios/${id}`)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Asset Symbol */}
            <div className="relative group">
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
                Asset Symbol *
                <span className="text-xs text-gray-500 ml-1">(e.g., AAPL, GOOGL, BTC)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={searchQuery}
                  onChange={handleSymbolChange}
                  className={`glass-input w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                    errors.symbol 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                  placeholder="Start typing to search assets..."
                  autoComplete="off"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
              {errors.symbol && (
                <div className="mt-2 flex items-center space-x-1 text-red-600 animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{errors.symbol}</p>
                </div>
              )}
              
              {/* Enhanced Search Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 mt-2 w-full bg-white/90 backdrop-blur-md shadow-xl rounded-xl border border-white/20 py-2 animate-fade-in">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                    Found {searchResults.length} assets
                  </div>
                  <div className="max-h-60 overflow-auto">
                    {searchResults.slice(0, 10).map((asset, index) => (
                      <div
                        key={asset._id}
                        className="cursor-pointer select-none relative px-3 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 border-b border-gray-50 last:border-b-0 group"
                        onClick={() => selectAsset(asset.symbol, asset.currentPrice)}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                {asset.symbol}
                              </span>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {asset.type || 'Stock'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 truncate mt-1">{asset.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(asset.currentPrice)}
                            </div>
                            <div className="text-xs text-gray-500">Current Price</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>            {/* Quantity */}
            <div className="group">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
                <span className="text-xs text-gray-500 ml-1">(Number of shares/units)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.000001"
                  className={`glass-input w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                    errors.quantity 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                  placeholder="0.000000"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
              {errors.quantity && (
                <div className="mt-2 flex items-center space-x-1 text-red-600 animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{errors.quantity}</p>
                </div>
              )}
            </div>

            {/* Purchase Price */}
            <div className="group">
              <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price *
                <span className="text-xs text-gray-500 ml-1">(Price per unit)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="purchasePrice"
                  name="purchasePrice"
                  value={formData.purchasePrice || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`glass-input w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                    errors.purchasePrice 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
              {errors.purchasePrice && (
                <div className="mt-2 flex items-center space-x-1 text-red-600 animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{errors.purchasePrice}</p>
                </div>
              )}
            </div>            {/* Enhanced Total Value Display */}
            {totalValue > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Total Investment</span>
                      <div className="text-xs text-gray-500">
                        {formData.quantity} × {formatCurrency(formData.purchasePrice)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {formatCurrency(totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Investment Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Investment Tips</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Double-check the asset symbol before adding</li>
                    <li>• Record the actual purchase price for accurate tracking</li>
                    <li>• Consider the total investment amount in your portfolio balance</li>
                  </ul>
                </div>
              </div>
            </div>            {/* Enhanced Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={() => navigate(`/portfolios/${id}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/70 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="relative px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                <div className="relative flex items-center space-x-2">
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Adding Asset...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Asset</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssetToPortfolio;
