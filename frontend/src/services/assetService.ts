import { api } from './api'
import { indianStockService } from './indianStockService'
import type { Asset, PriceHistoryPoint, ApiResponse } from '../types'

// Market service type definitions
interface MarketStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
}

interface TrendingData {
  topGainers: MarketStock[]
  topLosers: MarketStock[]
}

interface NewsItem {
  title: string
  summary: string
  url: string
  publishedAt: string
  source: string
}

interface IpoItem {
  symbol: string
  name: string
  price: number
  listingDate: string
  status: string
}

interface CommodityItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface MutualFundItem {
  symbol: string
  name: string
  nav: number
  returns: Record<string, number>
}

// Helper function to convert company name to symbol used by backend
function getSymbolFromCompanyName(companyName: string): string {
  if (!companyName) return '';
  
  // Company name to symbol mapping based on backend marketDataService
  const nameToSymbolMap: Record<string, string> = {
    'RELIANCE INDUSTRIES LIMITED': 'RELIANCE',
    'TATA CONSULTANCY SERVICES LIMITED': 'TCS',
    'HDFC BANK LIMITED': 'HDFCBANK',
    'ICICI BANK LIMITED': 'ICICIBANK',
    'INFOSYS LIMITED': 'INFY',
    'ITC LIMITED': 'ITC',
    'STATE BANK OF INDIA': 'SBIN',
    'BHARTI AIRTEL LIMITED': 'BHARTIARTL',
    'WIPRO LIMITED': 'WIPRO',
    'LARSEN & TOUBRO LIMITED': 'LT',
    'MARUTI SUZUKI INDIA LIMITED': 'MARUTI',
    'ASIAN PAINTS LIMITED': 'ASIANPAINT'
  };
  
  // Check exact match first
  const upperCompanyName = companyName.toUpperCase();
  if (nameToSymbolMap[upperCompanyName]) {
    return nameToSymbolMap[upperCompanyName];
  }
  
  // Check if company name contains known names
  for (const [name, symbol] of Object.entries(nameToSymbolMap)) {
    if (upperCompanyName.includes(name) || name.includes(upperCompanyName)) {
      return symbol;
    }
  }
  
  // Extract the main company name (first word usually)
  const words = companyName.replace(/LIMITED|LTD|CORPORATION|CORP|INC/gi, '').trim().split(' ');
  return words[0].toUpperCase();
}

export const assetService = {
  async searchAssets(query: string): Promise<Asset[]> {
    if (!query.trim()) {
      return []
    }

    try {
      // Search using Indian Stock API first for trending stocks
      const trendingData = await indianStockService.getTrendingStocks()
      const allMarketAssets: Asset[] = []
      
      // Add gainers and losers from Indian Stock API
      if (trendingData.topGainers && Array.isArray(trendingData.topGainers)) {
        allMarketAssets.push(...trendingData.topGainers.map((stock: Record<string, unknown>) => ({
          _id: stock.symbol as string,
          id: stock.symbol as string,
          symbol: stock.symbol as string,
          name: (stock.name as string) || (stock.symbol as string),
          type: 'stock' as const,
          currentPrice: stock.price as number || 0,
          previousClose: (stock.previousClose as number) || (stock.price as number) || 0,
          change: stock.change as number || 0,
          changePercent: stock.changePercent as number || 0,
          priceChange24h: stock.change as number || 0,
          marketCap: stock.marketCap as number || 0,
          volume: stock.volume as number || 0,
          exchange: (stock.exchange as string) || 'NSE',
          lastUpdated: (stock.lastUpdated as string) || new Date().toISOString()
        })))
      }
      
      if (trendingData.topLosers && Array.isArray(trendingData.topLosers)) {
        allMarketAssets.push(...trendingData.topLosers.map((stock: Record<string, unknown>) => ({
          _id: stock.symbol as string,
          id: stock.symbol as string,
          symbol: stock.symbol as string,
          name: (stock.name as string) || (stock.symbol as string),
          type: 'stock' as const,
          currentPrice: stock.price as number || 0,
          previousClose: (stock.previousClose as number) || (stock.price as number) || 0,
          change: stock.change as number || 0,
          changePercent: stock.changePercent as number || 0,
          priceChange24h: stock.change as number || 0,
          marketCap: stock.marketCap as number || 0,
          volume: stock.volume as number || 0,
          exchange: (stock.exchange as string) || 'NSE',
          lastUpdated: (stock.lastUpdated as string) || new Date().toISOString()
        })))
      }

      // Filter based on search query
      const filteredAssets = allMarketAssets.filter(asset => 
        asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
        asset.name.toLowerCase().includes(query.toLowerCase())
      )

      // If we found matches in market data, return them
      if (filteredAssets.length > 0) {
        return filteredAssets.slice(0, 10) // Limit to 10 results
      }

      // Fallback to existing database search
      const response = await api.get('/assets/search', {
        params: { q: query, limit: 10 }
      })
      
      return response.data.data || []
    } catch (error: unknown) {
      console.error('Error searching assets:', error)
      
      // Final fallback to database search
      try {
        const response = await api.get('/assets/search', {
          params: { q: query, limit: 10 }
        })
        return response.data.data || []
      } catch (fallbackError: unknown) {
        console.error('Error in fallback asset search:', fallbackError)
        return []
      }
    }
  },
  async getAllAssets(options: {
    page?: number
    limit?: number
    search?: string
    type?: string
    exchange?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<{ assets: Asset[]; total: number; page: number; totalPages: number }> {
    const response = await api.get<ApiResponse<{ assets: Asset[]; total: number; page: number; totalPages: number }>>('/assets', {
      params: options
    })
    if (!response.data.data) {
      throw new Error('No data received from API')
    }
    return response.data.data
  },async getAssetById(id: string): Promise<Asset> {
    try {
      const response = await api.get<ApiResponse<Asset>>(`/assets/${id}`)
      if (!response.data.data) {
        throw new Error('Asset not found');
      }
      return response.data.data;
    } catch (error: unknown) {
      // Extract the specific error message from the backend response
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Asset not found'
        : 'Asset not found';
      throw new Error(errorMessage);
    }
  },
  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    const response = await api.post<ApiResponse<Asset>>('/assets', assetData)
    if (!response.data.data) {
      throw new Error('Failed to create asset');
    }
    return response.data.data
  },

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    const response = await api.put<ApiResponse<Asset>>(`/assets/${id}`, updates)
    if (!response.data.data) {
      throw new Error('Failed to update asset');
    }
    return response.data.data
  },

  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`)
  },  async getAssetQuote(symbol: string): Promise<Asset> {
    try {
      const response = await api.get<ApiResponse<Asset>>(`/assets/${symbol}/quote`)
      if (!response.data.data) {
        throw new Error('Quote not found');
      }
      return response.data.data
    } catch (error: unknown) {
      // Extract the specific error message from the backend response
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Quote not found'
        : 'Quote not found';
      throw new Error(errorMessage)
    }
  },

  async getAssetPriceHistory(
    symbol: string,
    period: string = '1y',
    startDate?: string,
    endDate?: string
  ): Promise<PriceHistoryPoint[]> {
    const params: Record<string, string> = { period }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
      const response = await api.get<ApiResponse<PriceHistoryPoint[]>>(`/assets/${symbol}/history`, {
      params
    })
    if (!response.data.data) {
      throw new Error('Price history not found');
    }
    return response.data.data
  },

  async getCompanyOverview(symbol: string): Promise<unknown> {
    const response = await api.get(`/assets/${symbol}/company-overview`)
    return response.data.data
  },

  async getMarketData(symbols: string[]): Promise<Asset[]> {
    const response = await api.post('/assets/market-data', { symbols })
    return response.data.data || response.data
  },

  async getTopMovers(): Promise<unknown> {
    const response = await api.get<ApiResponse<unknown>>('/market/top-movers')
    return response.data.data
  },
  async getMarketOverview(): Promise<unknown> {
    const response = await api.get<ApiResponse<unknown>>('/market/overview')
    return response.data.data
  },
  async getTrendingAssets(limit: number = 10): Promise<Asset[]> {
    try {
      // Get trending stocks from Indian Stock API
      const trendingData = await indianStockService.getTrendingStocks()
      console.log('Trending data from Indian Stock Service:', trendingData);
      
      const allTrendingAssets: Asset[] = []
      
      // Add gainers from Indian Stock API
      if (trendingData.topGainers && Array.isArray(trendingData.topGainers)) {
        console.log('Top gainers data:', trendingData.topGainers);        allTrendingAssets.push(...trendingData.topGainers.slice(0, Math.ceil(limit / 2)).map((stock) => {
          console.log('Processing gainer stock:', stock);
          // Convert company name to proper symbol for backend compatibility
          const properSymbol = getSymbolFromCompanyName(stock.company_name) || stock.ric || stock.symbol || stock.ticker_id;
          const transformedAsset = {
            _id: properSymbol,
            id: properSymbol,
            symbol: properSymbol, // Use company-name-derived symbol for proper backend lookup
            name: stock.company_name || stock.name || stock.symbol || 'Unknown Asset',
            type: 'stock' as const,
            currentPrice: parseFloat(stock.price) || 0,
            previousClose: parseFloat(stock.close) || parseFloat(stock.price) || 0,
            change: parseFloat(stock.net_change) || 0,
            changePercent: parseFloat(stock.percent_change) || 0,
            priceChange24h: parseFloat(stock.net_change) || 0,
            marketCap: stock.marketCap || 0,
            volume: stock.volume || 0,
            exchange: stock.exchange_type === 'NSI' ? 'NSE' : stock.exchange || 'NSE',
            lastUpdated: stock.lastUpdated || new Date().toISOString()
          };
          console.log('Transformed gainer asset:', transformedAsset);
          return transformedAsset;
        }))
      }
      
      // Add losers from Indian Stock API
      if (trendingData.topLosers && Array.isArray(trendingData.topLosers)) {        console.log('Top losers data:', trendingData.topLosers);
        const remaining = limit - allTrendingAssets.length;        allTrendingAssets.push(...trendingData.topLosers.slice(0, remaining).map((stock) => {
          console.log('Processing loser stock:', stock);
          // Convert company name to proper symbol for backend compatibility
          const properSymbol = getSymbolFromCompanyName(stock.company_name) || stock.ric || stock.symbol || stock.ticker_id;
          const transformedAsset = {
            _id: properSymbol,
            id: properSymbol,
            symbol: properSymbol, // Use company-name-derived symbol for proper backend lookup
            name: stock.company_name || stock.name || stock.symbol || 'Unknown Asset',
            type: 'stock' as const,
            currentPrice: parseFloat(stock.price) || 0,
            previousClose: parseFloat(stock.close) || parseFloat(stock.price) || 0,
            change: parseFloat(stock.net_change) || 0,
            changePercent: parseFloat(stock.percent_change) || 0,
            priceChange24h: parseFloat(stock.net_change) || 0,
            marketCap: stock.marketCap || 0,
            volume: stock.volume || 0,
            exchange: stock.exchange_type === 'NSI' ? 'NSE' : stock.exchange || 'NSE',
            lastUpdated: stock.lastUpdated || new Date().toISOString()
          };
          console.log('Transformed loser asset:', transformedAsset);
          return transformedAsset;
        }))
      }

      console.log('Final trending assets:', allTrendingAssets);
      return allTrendingAssets.slice(0, limit)
    } catch (error) {
      console.error('Error fetching trending assets:', error)
      // Fallback to regular market data
      try {
        const response = await this.getTopMovers()
        return (response as Asset[]).slice(0, limit)
      } catch (fallbackError) {
        console.error('Error in fallback trending assets:', fallbackError)
        return []
      }
    }
  },  async getAsset(symbol: string): Promise<Asset> {
    try {
      // Try to get asset by ID first
      return await this.getAssetById(symbol)    } catch {
      // If not found by ID, try to get quote
      try {
        return await this.getAssetQuote(symbol)
      } catch {
        // Final fallback - try to find it in trending stocks
        try {
          const trendingStocks = await this.getTrendingAssets(50) // Get more results to increase chances
          const foundAsset = trendingStocks.find(asset => 
            asset.symbol === symbol || 
            asset._id === symbol || 
            asset.id === symbol
          )
          
          if (foundAsset) {
            return foundAsset
          }
            // If not found in trending, try Indian Stock API directly
          const stockDetail = await indianStockService.getStockDetails(symbol)
          const properSymbol = getSymbolFromCompanyName(stockDetail.company_name) || stockDetail.ric || stockDetail.symbol || stockDetail.ticker_id;
          return {
            _id: properSymbol,
            id: properSymbol,
            symbol: properSymbol,
            name: stockDetail.company_name || stockDetail.name || '',
            type: 'stock' as const,
            currentPrice: parseFloat(stockDetail.price) || 0,
            previousClose: parseFloat(stockDetail.close) || parseFloat(stockDetail.price) || 0,
            change: parseFloat(stockDetail.net_change) || stockDetail.change || 0,
            changePercent: parseFloat(stockDetail.percent_change) || stockDetail.changePercent || 0,
            priceChange24h: parseFloat(stockDetail.net_change) || stockDetail.change || 0,
            marketCap: stockDetail.marketCap || 0,
            volume: parseFloat(stockDetail.volume || '0') || 0,
            exchange: stockDetail.exchange_type === 'NSI' ? 'NSE' : stockDetail.exchange || 'NSE',
            lastUpdated: stockDetail.lastUpdated || new Date().toISOString()
          }
        } catch (indianApiError) {
          console.error('Error fetching asset from all sources:', indianApiError)
          throw new Error(`Asset not found: ${symbol}`)
        }
      }
    }
  },
}

export const marketService = {  async getTrending(): Promise<TrendingData> {
    const trendingData = await indianStockService.getTrendingStocks()
    // Map IndianStockData to MarketStock structure
    return {
      topGainers: trendingData.topGainers.map(stock => ({
        symbol: stock.symbol || stock.company_name || '',
        name: stock.company_name || stock.name || stock.symbol || '',
        price: parseFloat(stock.price || '0') || 0,
        change: parseFloat(stock.net_change || '0') || stock.change || 0,
        changePercent: parseFloat(stock.percent_change || '0') || stock.changePercent || 0,
        volume: typeof stock.volume === 'string' ? parseFloat(stock.volume) || 0 : stock.volume || 0
      })),
      topLosers: trendingData.topLosers.map(stock => ({
        symbol: stock.symbol || stock.company_name || '',
        name: stock.company_name || stock.name || stock.symbol || '',
        price: parseFloat(stock.price || '0') || 0,
        change: parseFloat(stock.net_change || '0') || stock.change || 0,
        changePercent: parseFloat(stock.percent_change || '0') || stock.changePercent || 0,
        volume: typeof stock.volume === 'string' ? parseFloat(stock.volume) || 0 : stock.volume || 0
      }))
    }
  },

  async getMostActiveNSE(): Promise<MarketStock[]> {
    const response = await api.get<ApiResponse<MarketStock[]>>('/indian-stocks/most-active/nse')
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  },

  async getMostActiveBSE(): Promise<MarketStock[]> {
    const response = await api.get<ApiResponse<MarketStock[]>>('/indian-stocks/most-active/bse')
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  },

  async get52WeekHighLow(): Promise<MarketStock[]> {
    const response = await api.get<ApiResponse<MarketStock[]>>('/indian-stocks/52-week-high-low')
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  },

  async getMarketStats(): Promise<TrendingData> {
    const response = await api.get<ApiResponse<TrendingData>>('/indian-stocks/trending')
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return data as TrendingData
  },
  async getPriceShockers(): Promise<{ positiveShockers: MarketStock[], negativeShockers: MarketStock[] }> {
    const priceShockers = await indianStockService.getPriceShockers()
    // Map IndianStockData to MarketStock structure
    return {
      positiveShockers: priceShockers.positiveShockers.map(stock => ({
        symbol: stock.symbol || stock.company_name || '',
        name: stock.company_name || stock.name || stock.symbol || '',
        price: parseFloat(stock.price || '0') || 0,
        change: parseFloat(stock.net_change || '0') || stock.change || 0,
        changePercent: parseFloat(stock.percent_change || '0') || stock.changePercent || 0,
        volume: typeof stock.volume === 'string' ? parseFloat(stock.volume) || 0 : stock.volume || 0
      })),
      negativeShockers: priceShockers.negativeShockers.map(stock => ({
        symbol: stock.symbol || stock.company_name || '',
        name: stock.company_name || stock.name || stock.symbol || '',
        price: parseFloat(stock.price || '0') || 0,
        change: parseFloat(stock.net_change || '0') || stock.change || 0,
        changePercent: parseFloat(stock.percent_change || '0') || stock.changePercent || 0,
        volume: typeof stock.volume === 'string' ? parseFloat(stock.volume) || 0 : stock.volume || 0
      }))
    }
  },

  async getNews(limit: number = 10): Promise<NewsItem[]> {
    const response = await api.get<ApiResponse<NewsItem[]>>(`/indian-stocks/news?limit=${limit}`)
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  },

  async getIpoData(): Promise<IpoItem[]> {
    const response = await api.get<ApiResponse<IpoItem[]>>('/indian-stocks/ipo')
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  },

  async getCommodities(): Promise<CommodityItem[]> {
    const response = await api.get<ApiResponse<CommodityItem[]>>('/indian-stocks/commodities')
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  },

  async getMutualFunds(): Promise<MutualFundItem[]> {
    const response = await api.get<ApiResponse<MutualFundItem[]>>('/indian-stocks/mutual-funds')
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  },

  async getStockDetail(symbol: string): Promise<MarketStock> {
    const response = await api.get<ApiResponse<MarketStock>>(`/indian-stocks/stock/${symbol}`)
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return data as MarketStock
  },

  async getHistoricalData(symbol: string, period: string = '1y'): Promise<PriceHistoryPoint[]> {
    const response = await api.get<ApiResponse<PriceHistoryPoint[]>>(`/indian-stocks/historical/${symbol}?period=${period}`)
    const data = response.data.data || response.data
    if (!data) {
      throw new Error('No data received from API')
    }
    return Array.isArray(data) ? data : []
  }
}