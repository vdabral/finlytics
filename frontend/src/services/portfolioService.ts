import api from './api'
import type { Portfolio, CreatePortfolioData, AddAssetToPortfolioData } from '../types'

export const portfolioService = {  async getPortfolios(): Promise<Portfolio[]> {
    const response = await api.get<{ success: boolean; portfolios: Portfolio[] }>('/portfolios')
    return response.data.portfolios
  },
  async getPortfolio(id: string): Promise<Portfolio> {
    const response = await api.get<{ success: boolean; data: { portfolio: Portfolio } }>(`/portfolios/${id}`)
    return response.data.data.portfolio
  },

  async createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
    const response = await api.post<{ success: boolean; portfolio: Portfolio }>('/portfolios', data)
    return response.data.portfolio
  },

  async updatePortfolio(id: string, data: Partial<CreatePortfolioData>): Promise<Portfolio> {
    const response = await api.put<{ success: boolean; data: { portfolio: Portfolio } }>(`/portfolios/${id}`, data)
    return response.data.data.portfolio
  },

  async deletePortfolio(id: string): Promise<void> {
    await api.delete(`/portfolios/${id}`)
  },
  async addAssetToPortfolio(portfolioId: string, data: AddAssetToPortfolioData): Promise<Portfolio> {
    const response = await api.post<{ success: boolean; portfolio: Portfolio }>(`/portfolios/${portfolioId}/assets`, data)
    return response.data.portfolio
  },
  async removeAssetFromPortfolio(portfolioId: string, assetId: string): Promise<Portfolio> {
    const response = await api.delete<{ success: boolean; data: { portfolio: Portfolio } }>(`/portfolios/${portfolioId}/assets/${assetId}`)
    return response.data.data.portfolio
  },
  async recordTransaction(portfolioId: string, data: {
    assetId: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    fees?: number;
    notes?: string;
    date: string;
  }): Promise<Portfolio> {
    const response = await api.post<{ success: boolean; portfolio: Portfolio }>(`/portfolios/${portfolioId}/transactions`, data)
    return response.data.portfolio
  },
  async getPortfolioPerformance(id: string, period?: string): Promise<unknown> {
    const params = period ? { period } : {}
    const response = await api.get<{ success: boolean; performance: unknown }>(`/portfolios/${id}/performance`, { params })
    return response.data.performance
  },

  async getPortfolioHistory(id: string, period?: string): Promise<unknown> {
    const params = period ? { period } : {}
    const response = await api.get<{ success: boolean; data: unknown }>(`/portfolios/${id}/history`, { params })
    return response.data.data
  },
}
