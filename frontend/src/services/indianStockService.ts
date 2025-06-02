import { api } from './api'

export interface IndianStockData {
  ticker_id: string
  company_name: string
  price: string
  net_change: string
  percent_change: string
  ric: string
  close: string
  high?: string
  low?: string
  open?: string
  volume?: string
  exchange_type?: string
  date?: string
  time?: string
  bid?: string
  ask?: string
  year_high?: string
  year_low?: string
  up_circuit_limit?: string
  low_circuit_limit?: string
  lot_size?: string
  overall_rating?: string
  short_term_trends?: string
  long_term_trends?: string
  
  // Legacy fields for backward compatibility
  symbol?: string
  name?: string
  change?: number
  changePercent?: number
  previousClose?: number
  marketCap?: number
  exchange?: string
  lastUpdated?: string
}

export interface TrendingStocksData {
  topGainers: IndianStockData[]
  topLosers: IndianStockData[]
}

export interface NewsItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

export interface IPOData {
  companyName: string
  issueSize: string
  priceRange: string
  openDate: string
  closeDate: string
  listingDate: string
  status: string
}

export interface PriceShockersData {
  positiveShockers: IndianStockData[]
  negativeShockers: IndianStockData[]
}

export interface CommodityData {
  name: string
  price: number
  change: number
  changePercent: number
  unit: string
}

export interface MutualFundData {
  name: string
  nav: number
  change: number
  changePercent: number
  category: string
}

export const indianStockService = {  /**
   * Get trending Indian stocks
   */
  async getTrendingStocks(): Promise<TrendingStocksData> {
    const response = await api.get('/indian-stocks/trending')
    const rawData = response.data.data
    
    // Normalize data structure from backend API
    if (rawData.trending_stocks) {
      return {
        topGainers: rawData.trending_stocks.top_gainers || [],
        topLosers: rawData.trending_stocks.top_losers || []
      }
    }
    
    return rawData
  },
  /**
   * Get stock details by company name
   */
  async getStockDetails(name: string): Promise<IndianStockData> {
    const response = await api.get(`/indian-stocks/stock/${name}`)
    return response.data.data
  },

  /**
   * Get NSE most active stocks
   */
  async getNSEMostActive(): Promise<IndianStockData[]> {
    const response = await api.get('/indian-stocks/nse-most-active')
    return response.data.data
  },

  /**
   * Get BSE most active stocks
   */
  async getBSEMostActive(): Promise<IndianStockData[]> {
    const response = await api.get('/indian-stocks/bse-most-active')
    return response.data.data
  },

  /**
   * Get market news
   */
  async getMarketNews(): Promise<NewsItem[]> {
    const response = await api.get('/indian-stocks/news')
    return response.data.data
  },
  /**
   * Get historical data for a stock
   */
  async getHistoricalData(name: string, period: string = '1y'): Promise<IndianStockData[]> {
    const response = await api.get(`/indian-stocks/historical/${name}`, {
      params: { period }
    })
    return response.data.data
  },
  /**
   * Get price shockers
   */
  async getPriceShockers(): Promise<PriceShockersData> {
    const response = await api.get('/indian-stocks/price-shockers')
    const rawData = response.data.data
    
    // Normalize data structure from backend API
    if (rawData.NSE_PriceShocker !== undefined || rawData.BSE_PriceShocker !== undefined) {
      return {
        positiveShockers: rawData.NSE_PriceShocker || [],
        negativeShockers: rawData.BSE_PriceShocker || []
      }
    }
    
    return rawData
  },

  /**
   * Get IPO data
   */
  async getIPOData(): Promise<IPOData[]> {
    const response = await api.get('/indian-stocks/ipo')
    return response.data.data
  },

  /**
   * Get commodities data
   */
  async getCommoditiesData(): Promise<CommodityData[]> {
    const response = await api.get('/indian-stocks/commodities')
    return response.data.data
  },

  /**
   * Get mutual funds data
   */
  async getMutualFundsData(): Promise<MutualFundData[]> {
    const response = await api.get('/indian-stocks/mutual-funds')
    return response.data.data
  },

  /**
   * Search stocks by industry
   */
  async searchByIndustry(industry: string): Promise<IndianStockData[]> {
    const response = await api.get('/indian-stocks/industry-search', {
      params: { industry }
    })
    return response.data.data
  },
  /**
   * Get stock forecasts
   */
  async getStockForecasts(name: string): Promise<unknown> {
    const response = await api.get(`/indian-stocks/forecasts/${name}`)
    return response.data.data
  },

  /**
   * Get corporate actions
   */
  async getCorporateActions(): Promise<unknown[]> {
    const response = await api.get('/indian-stocks/corporate-actions')
    return response.data.data
  },

  /**
   * Get 52-week high/low data
   */
  async get52WeekHighLowData(): Promise<unknown[]> {
    const response = await api.get('/indian-stocks/52-week-high-low')
    return response.data.data
  }
}
