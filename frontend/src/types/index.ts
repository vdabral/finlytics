// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// User & Authentication Types
export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  name?: string
  role: 'user' | 'admin'
  profilePicture?: string
  isEmailVerified: boolean
  profile?: UserProfile
  settings?: UserSettings
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  phone?: string
  country?: string
  avatar?: string
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  currency: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    profileVisible: boolean
    portfolioPublic: boolean
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface Portfolio {
  _id: string
  id: string // Add compatibility alias
  name: string
  description?: string
  userId: string
  totalValue: number
  totalCost: number
  totalInvested: number // Add for compatibility
  totalReturn?: number // Add for UI compatibility
  totalGainLoss: number
  totalGainLossPercentage: number
  currency?: string // Add currency field
  isPublic?: boolean // Add public visibility field
  assets: PortfolioAsset[]
  holdings?: PortfolioAsset[] // Add alias for assets
  createdAt: string
  updatedAt: string
}

export interface PortfolioAsset {
  assetId: string
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  gainLoss: number
  gainLossPercentage: number
}

export interface Asset {
  _id: string
  id: string // Add compatibility alias
  symbol: string
  name: string
  type: 'stock' | 'crypto' | 'etf' | 'bond' | 'commodity'
  exchange: string
  sector?: string
  industry?: string
  description?: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  priceChange24h: number // Add for compatibility
  marketCap?: number
  volume?: number
  pe?: number
  eps?: number
  dividendYield?: number
  beta?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  lastUpdated: string
}

export interface Transaction {
  id: string // Add compatibility alias
  _id: string
  portfolioId: string
  assetId: string
  type: 'BUY' | 'SELL' | 'buy' | 'sell' // Support both formats
  quantity: number
  price: number
  totalAmount: number
  total: number // Add alias for totalAmount
  fees?: number
  notes?: string
  date: string
  createdAt: string
  updatedAt: string // Add missing field
}

export interface PriceHistoryPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  lastUpdated: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface PortfolioState {
  portfolios: Portfolio[]
  currentPortfolio: Portfolio | null
  isLoading: boolean
  loading?: boolean // Add alias for isLoading for compatibility
  error: string | null
}

export interface AssetState {
  assets: Asset[]
  searchResults: Asset[]
  trendingAssets: Asset[]
  currentAsset: Asset | null
  priceHistory: PriceHistoryPoint[]
  isLoading: boolean
  error: string | null
}

export interface CreatePortfolioData {
  name: string
  description?: string
  currency?: string
  isPublic?: boolean
}

export interface AddAssetToPortfolioData {
  symbol: string
  quantity: number
  purchasePrice: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface DashboardStats {
  totalPortfolioValue: number
  totalGainLoss: number
  totalGainLossPercentage: number
  totalAssets: number
  bestPerformingAsset: {
    symbol: string
    gainLossPercentage: number
  }
  worstPerformingAsset: {
    symbol: string
    gainLossPercentage: number
  }
}

// Error handling types
export interface ErrorResponse {
  response?: {
    data?: {
      message?: string
      error?: string
    }
    status?: number
  }
  message?: string
}

export interface NetworkError extends Error {
  response?: {
    data?: {
      message?: string
      error?: string
    }
    status?: number
  }
}
