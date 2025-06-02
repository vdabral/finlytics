import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketService } from '../../services/assetService';

import LoadingSpinner from '../ui/LoadingSpinner';

interface MarketStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  ticker_id?: string
  company_name?: string
}

interface TrendingData {
  topGainers: MarketStock[]
  topLosers: MarketStock[]
}

interface NewsItem {
  title: string
  summary: string
  description?: string
  url: string
  publishedAt: string
  date?: string
  source: string
}

interface PriceShockersData {
  positiveShockers: MarketStock[]
  negativeShockers: MarketStock[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MarketDashboardProps {
  // Empty interface is intentional for future props
}

const MarketDashboard: React.FC<MarketDashboardProps> = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [priceShockers, setPriceShockers] = useState<PriceShockersData | null>(null);
  const [activeTab, setActiveTab] = useState('trending');
  const [showAllGainers, setShowAllGainers] = useState(false);
  const [showAllLosers, setShowAllLosers] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handleAssetClick = (symbol: string) => {
    if (symbol) {
      navigate(`/assets/${symbol}`);
    }
  };

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);      console.log('[MarketDashboard] Fetching market data...');
      const [trendingResponse, newsResponse, priceShockersResponse] = await Promise.all([
        marketService.getTrending().then((res) => { console.log('[MarketDashboard] Trending response:', res); return res; }),
        marketService.getNews(10).then((res) => { console.log('[MarketDashboard] News response:', res); return res; }),
        marketService.getPriceShockers().then((res) => { console.log('[MarketDashboard] Price shockers response:', res); return res; })
      ]);      // Data is now normalized by the service layer
      setTrendingData(trendingResponse);
      setNews(newsResponse || []);
      setPriceShockers(priceShockersResponse);

      console.log('[MarketDashboard] Set trendingData:', trendingResponse);
      console.log('[MarketDashboard] Set news:', newsResponse);
      console.log('[MarketDashboard] Set priceShockers:', priceShockersResponse);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data');
    } finally {
      setLoading(false);
      console.log('[MarketDashboard] Loading set to false');
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
          onClick={fetchMarketData}
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Indian Stock Market Dashboard</h1>
        <p className="text-gray-600">Real-time data from Indian stock exchanges</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['trending', 'news', 'shockers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'shockers' ? 'Price Shockers' : tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'trending' && (
            <div className="space-y-6">
              {/* Top Gainers */}
              {trendingData?.topGainers && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Gainers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(showAllGainers ? trendingData.topGainers : trendingData.topGainers.slice(0, 6)).map((stock: MarketStock, index: number) => (
                      <div
                        key={index}
                        className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-200 hover:shadow-md"
                        onClick={() => handleAssetClick(stock.symbol)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{stock.symbol || stock.ticker_id || 'N/A'}</h4>
                            <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
                              {stock.company_name || stock.name || stock.symbol || stock.ticker_id || 'Unknown Stock'}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(stock.price || 0)}</p>
                            <p className="text-sm">{formatPercentage(stock.changePercent || 0)}</p>
                          </div>
                        </div>
                        {stock.volume && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                            Volume: {stock.volume.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {trendingData.topGainers.length > 6 && (
                    <div className="flex justify-center mt-4">
                      <button
                        className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                        onClick={() => setShowAllGainers((prev) => !prev)}
                      >
                        {showAllGainers ? 'Show Less' : 'View All Gainers'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Top Losers */}
              {trendingData?.topLosers && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Losers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(showAllLosers ? trendingData.topLosers : trendingData.topLosers.slice(0, 6)).map((stock: MarketStock, index: number) => (
                      <div
                        key={index}
                        className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4 cursor-pointer hover:bg-red-200 dark:hover:bg-red-800 hover:border-red-400 dark:hover:border-red-600 transition-all duration-200 hover:shadow-md"
                        onClick={() => handleAssetClick(stock.symbol)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{stock.symbol || stock.ticker_id || 'N/A'}</h4>
                            <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
                              {stock.company_name || stock.name || stock.symbol || stock.ticker_id || 'Unknown Stock'}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(stock.price || 0)}</p>
                            <p className="text-sm">{formatPercentage(stock.changePercent || 0)}</p>
                          </div>
                        </div>
                        {stock.volume && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                            Volume: {stock.volume.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {trendingData.topLosers.length > 6 && (
                    <div className="flex justify-center mt-4">
                      <button
                        className="px-6 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                        onClick={() => setShowAllLosers((prev) => !prev)}
                      >
                        {showAllLosers ? 'Show Less' : 'View All Losers'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'news' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market News</h3>
              <div className="space-y-4">
                {news.length > 0 ? (
                  news.map((article: NewsItem, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{article.title}</h4>
                      <p className="text-gray-600 text-sm mb-2">{article.description || article.summary}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{article.source}</span>
                        <span>{new Date(article.publishedAt || article.date || Date.now()).toLocaleDateString()}</span>
                      </div>
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Read more →
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No news available at the moment.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shockers' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Shockers</h3>
              {priceShockers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Positive Shockers */}
                  {priceShockers.positiveShockers && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-3">Positive Shockers</h4>
                      <div className="space-y-2">
                        {priceShockers.positiveShockers.map((stock: MarketStock, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <div>
                              <span className="font-semibold">{stock.symbol}</span>
                              <p className="text-sm text-gray-600">{stock.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(stock.price || 0)}</p>
                              <p className="text-sm">{formatPercentage(stock.changePercent || 0)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Negative Shockers */}
                  {priceShockers.negativeShockers && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-3">Negative Shockers</h4>
                      <div className="space-y-2">
                        {priceShockers.negativeShockers.map((stock: MarketStock, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                            <div>
                              <span className="font-semibold">{stock.symbol}</span>
                              <p className="text-sm text-gray-600">{stock.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(stock.price || 0)}</p>
                              <p className="text-sm">{formatPercentage(stock.changePercent || 0)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No price shocker data available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketDashboard;
