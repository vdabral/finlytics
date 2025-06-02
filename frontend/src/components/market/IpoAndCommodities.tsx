import React, { useState, useEffect } from 'react';
import { marketService } from '../../services/assetService';
import LoadingSpinner from '../ui/LoadingSpinner';

// Add proper type definitions
interface IpoItem {
  symbol: string
  name: string
  companyName?: string
  exchange: string
  price: number
  listingDate: string
  status: 'upcoming' | 'listed' | 'closed'
}

interface CommodityItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  unit: string
  listingDate?: string
}

interface MutualFundItem {
  symbol?: string
  name?: string
  schemeName?: string
  nav?: number
  price?: number
  change?: number
  changePercent?: number
  category?: string
  fundType?: string
  fundHouse?: string
  returns1Y?: number
  returns1M?: number
  returns3M?: number
  returns6M?: number
  aum?: string
}

interface IpoData {
  upcoming: IpoItem[]
  recent: IpoItem[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IpoAndCommoditiesProps {
  // Empty interface is intentional for future props
}

const IpoAndCommodities: React.FC<IpoAndCommoditiesProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipoData, setIpoData] = useState<IpoData | null>(null);
  const [commodities, setCommodities] = useState<CommodityItem[]>([]);
  const [mutualFunds, setMutualFunds] = useState<MutualFundItem[]>([]);
  const [activeSection, setActiveSection] = useState('ipo');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ipoResponse, commoditiesResponse, mutualFundsResponse] = await Promise.all([
        marketService.getIpoData(),
        marketService.getCommodities(),
        marketService.getMutualFunds()
      ]);

      setIpoData(ipoResponse);
      setCommodities(commoditiesResponse || []);
      setMutualFunds(mutualFundsResponse || []);
    } catch (err) {
      console.error('Error fetching IPO and commodities data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatPercentage = (percent: number) => {
    const isPositive = percent >= 0;
    return (
      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{percent.toFixed(2)}%
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">IPO, Commodities & Mutual Funds</h1>
        <p className="text-gray-600">Investment opportunities and market data</p>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['ipo', 'commodities', 'mutual-funds'].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeSection === section
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSection === 'ipo' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">IPO Information</h3>
              {ipoData ? (
                <div className="space-y-6">
                  {/* Current IPOs */}
                  {ipoData.recent && ipoData.recent.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Current IPOs</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ipoData.recent.map((ipo: IpoItem, index: number) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="mb-3">
                              <h5 className="font-semibold text-gray-900">{ipo.name || ipo.companyName}</h5>
                              <p className="text-sm text-gray-600">{ipo.symbol}</p>
                            </div>
                            
                            {ipo.price && (
                              <div className="mb-2">
                                <span className="text-sm text-gray-600">Price: </span>
                                <span className="font-medium">₹{ipo.price}</span>
                              </div>
                            )}
                            
                            {ipo.listingDate && (
                              <div className="mb-2">
                                <span className="text-sm text-gray-600">Listing Date: </span>
                                <span className="font-medium">{formatDate(ipo.listingDate)}</span>
                              </div>
                            )}
                            
                            <div className="text-sm text-gray-600">
                              Status: {ipo.status.charAt(0).toUpperCase() + ipo.status.slice(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          className="btn-primary px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
                          onClick={() => window.location.href = '/assets'}
                          aria-label="View all IPOs"
                        >
                          View All IPOs
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upcoming IPOs */}
                  {ipoData.upcoming && ipoData.upcoming.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Upcoming IPOs</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ipoData.upcoming.map((ipo: IpoItem, index: number) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="mb-3">
                              <h5 className="font-semibold text-gray-900">{ipo.name || ipo.companyName}</h5>
                              <p className="text-sm text-gray-600">{ipo.symbol}</p>
                            </div>
                            
                            {ipo.listingDate && (
                              <div className="mb-2">
                                <span className="text-sm text-gray-600">Expected Listing: </span>
                                <span className="font-medium">{formatDate(ipo.listingDate)}</span>
                              </div>
                            )}
                            
                            {ipo.price && (
                              <div className="text-sm text-gray-600">
                                Est. Price: ₹{ipo.price}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No IPO data available at the moment.</p>
              )}
            </div>
          )}

          {activeSection === 'commodities' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commodities</h3>
              {commodities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {commodities.map((commodity: CommodityItem, index: number) => (
                    <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-900">{commodity.name || commodity.symbol}</h5>
                          <p className="text-sm text-gray-600">{commodity.symbol}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(commodity.price || 0)}</p>
                          {commodity.changePercent !== undefined && (
                            <p className="text-sm">{formatPercentage(commodity.changePercent)}</p>
                          )}
                        </div>
                      </div>
                      
                      {commodity.unit && (
                        <p className="text-xs text-gray-500">Unit: {commodity.unit}</p>
                      )}
                      
                      {commodity.listingDate && (
                        <p className="text-xs text-gray-400 mt-2">
                          Updated: {formatDate(commodity.listingDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No commodity data available at the moment.</p>
              )}
            </div>
          )}

          {activeSection === 'mutual-funds' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Mutual Funds</h3>
              {mutualFunds.length > 0 ? (
                <div className="space-y-4">
                  {mutualFunds.map((fund: MutualFundItem, index: number) => (
                    <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{fund.name || fund.schemeName}</h5>
                          <p className="text-sm text-gray-600">{fund.category || fund.fundType}</p>
                          {fund.fundHouse && (
                            <p className="text-xs text-gray-500">{fund.fundHouse}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(fund.nav || fund.price || 0)}</p>
                          {fund.returns1Y !== undefined && (
                            <p className="text-sm text-green-600">1Y: {fund.returns1Y.toFixed(2)}%</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {fund.returns1M !== undefined && (
                          <div>
                            <span className="text-gray-500">1M: </span>
                            <span className={fund.returns1M >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {fund.returns1M.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        {fund.returns3M !== undefined && (
                          <div>
                            <span className="text-gray-500">3M: </span>
                            <span className={fund.returns3M >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {fund.returns3M.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        {fund.returns6M !== undefined && (
                          <div>
                            <span className="text-gray-500">6M: </span>
                            <span className={fund.returns6M >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {fund.returns6M.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        {fund.aum && (
                          <div>
                            <span className="text-gray-500">AUM: </span>
                            <span>₹{fund.aum}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No mutual fund data available at the moment.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IpoAndCommodities;
