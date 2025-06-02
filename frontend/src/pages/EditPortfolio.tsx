import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPortfolioById, updatePortfolio } from '../store/portfolioSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface EditPortfolioForm {
  name: string;
  description: string;
  currency: string;
  isPublic: boolean;
}

const EditPortfolio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentPortfolio, isLoading } = useAppSelector((state) => state.portfolio);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EditPortfolioForm>({
    name: '',
    description: '',
    currency: 'USD',
    isPublic: false,
  });
  const [errors, setErrors] = useState<Partial<EditPortfolioForm>>({});

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

  useEffect(() => {
    if (id) {
      dispatch(fetchPortfolioById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentPortfolio) {
      setFormData({
        name: currentPortfolio.name,
        description: currentPortfolio.description || '',
        currency: currentPortfolio.currency || 'USD',
        isPublic: currentPortfolio.isPublic || false,
      });
    }
  }, [currentPortfolio]);

  const validateForm = (): boolean => {
    const newErrors: Partial<EditPortfolioForm> = {};

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
    if (errors[name as keyof EditPortfolioForm]) {
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

    setLoading(true);

    try {
      await dispatch(updatePortfolio({
        id: currentPortfolio._id,
        portfolioData: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          currency: formData.currency,
          isPublic: formData.isPublic,
        }
      })).unwrap();
        toast.success('Portfolio updated successfully!');
      navigate(`/portfolios/${id}`);
    } catch (error: unknown) {
      console.error('Error updating portfolio:', error);
      const message = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Failed to update portfolio';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/portfolios/${id}`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentPortfolio) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">Portfolio not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The portfolio you're trying to edit doesn't exist or you don't have access to it.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/portfolios')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl rounded-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Edit Portfolio
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Update details for "{currentPortfolio.name}"
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
            {/* Portfolio Name */}
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
            </div>

            {/* Currency Selection */}
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
            </div>

            {/* Privacy Settings */}
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
            </div>

            {/* Action Buttons */}
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
                    Updating Portfolio...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Update Portfolio
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

export default EditPortfolio;
