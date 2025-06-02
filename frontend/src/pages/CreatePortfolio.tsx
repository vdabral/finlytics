import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/redux';
import { createPortfolio } from '../store/portfolioSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface CreatePortfolioForm {
  name: string;
  description: string;
  currency: string;
  isPublic: boolean;
}

const CreatePortfolio: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePortfolioForm>({
    name: '',
    description: '',
    currency: 'USD',
    isPublic: false,
  });
  const [errors, setErrors] = useState<Partial<CreatePortfolioForm>>({});

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<CreatePortfolioForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Portfolio name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Portfolio name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Portfolio name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof CreatePortfolioForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }    setLoading(true);    try {
      await dispatch(createPortfolio({
        name: formData.name.trim(),
        description: formData.description.trim(),
        currency: formData.currency,
        isPublic: formData.isPublic,
      })).unwrap();
        toast.success('Portfolio created successfully!');
      navigate('/portfolios');
    } catch (error: unknown) {
      console.error('Error creating portfolio:', error);
      const message = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Failed to create portfolio';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/portfolios');
  };

  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl rounded-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Create New Portfolio
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Set up a new portfolio to track your investments
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">            {/* Portfolio Name */}
            <div className="group">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                Portfolio Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 bg-white/50 border ${
                    errors.name ? 'border-red-300' : 'border-white/30'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 backdrop-blur-sm placeholder-gray-400`}
                  placeholder="e.g., My Growth Portfolio"
                  maxLength={100}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="group">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
                Description
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 bg-white/50 border ${
                    errors.description ? 'border-red-300' : 'border-white/30'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 backdrop-blur-sm placeholder-gray-400 resize-none`}
                  placeholder="Describe your investment strategy or goals (optional)"
                  maxLength={500}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              {errors.description && (
                <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.description}
                </p>
              )}
              <div className="mt-2 flex justify-between">
                <p className="text-sm text-gray-500">
                  {formData.description.length}/500 characters
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Optional but recommended
                </div>
              </div>
            </div>            {/* Currency */}
            <div className="group">
              <label htmlFor="currency" className="block text-sm font-semibold text-gray-800 mb-2">
                Base Currency *
              </label>
              <div className="relative">
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 bg-white/50 border ${
                    errors.currency ? 'border-red-300' : 'border-white/30'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 backdrop-blur-sm text-gray-700 appearance-none`}
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code} className="bg-white">
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              {errors.currency && (
                <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.currency}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                All portfolio values will be displayed in this currency
              </p>
            </div>            {/* Privacy Settings */}
            <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl p-6 border border-white/30">
              <div className="flex items-start space-x-4">
                <div className="flex items-center h-5 mt-1">
                  <input
                    id="isPublic"
                    name="isPublic"
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-indigo-600 bg-white/70 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-all duration-200"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="isPublic" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    Make portfolio public
                  </label>
                  <p className="mt-1 text-sm text-gray-600">
                    Allow other users to view this portfolio (without sensitive details like exact holdings)
                  </p>
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    You can change this setting later
                  </div>
                </div>
              </div>
            </div>            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300/50 rounded-xl text-sm font-medium text-gray-700 bg-white/50 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating Portfolio...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Portfolio
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Help Section */}
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-t border-white/20">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  💡 Getting Started Tips
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-3"></div>
                    Choose a descriptive name that reflects your investment strategy
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                    Select the base currency for all calculations and displays
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-3"></div>
                    Add a description to help you remember your investment goals
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                    You can always modify these settings later
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePortfolio;
