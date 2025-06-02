import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import {
  setLoading,
  setError,
  setPortfolios,
  setCurrentPortfolio,
  addPortfolio,
  updatePortfolio as updatePortfolioAction,
  removePortfolio,
  addAssetToPortfolio as addAssetToPortfolioAction,
  removeAssetFromPortfolio as removeAssetFromPortfolioAction,
} from '../store/portfolioSlice'
import { portfolioService } from '../services/portfolioService'
import { wsService } from '../services/websocketService'
import type { CreatePortfolioData, AddAssetToPortfolioData, ErrorResponse } from '../types'
import { toast } from 'react-toastify'

export const usePortfolio = () => {
  const dispatch = useAppDispatch()
  const { portfolios, currentPortfolio, isLoading, error } = useAppSelector((state) => state.portfolio)

  const fetchPortfolios = useCallback(async () => {
    try {
      dispatch(setLoading(true))
      const data = await portfolioService.getPortfolios()
      dispatch(setPortfolios(data))    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to fetch portfolios'
      dispatch(setError(message))
      toast.error(message)
    }
  }, [dispatch])

  const fetchPortfolio = useCallback(async (id: string) => {
    try {
      dispatch(setLoading(true))
      const data = await portfolioService.getPortfolio(id)
      dispatch(setCurrentPortfolio(data))
      
      // Subscribe to portfolio updates
      wsService.subscribeToPortfolio(id)
      
      return data    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to fetch portfolio'
      dispatch(setError(message))
      toast.error(message)
      throw error
    }
  }, [dispatch])

  const createPortfolio = useCallback(async (data: CreatePortfolioData) => {
    try {
      dispatch(setLoading(true))
      const portfolio = await portfolioService.createPortfolio(data)
      dispatch(addPortfolio(portfolio))
      toast.success('Portfolio created successfully!')
      return portfolio    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to create portfolio'
      dispatch(setError(message))
      toast.error(message)
      throw error
    }
  }, [dispatch])
  const updatePortfolioData = useCallback(async (id: string, data: Partial<CreatePortfolioData>) => {
    try {
      const result = await dispatch(updatePortfolioAction({ id, portfolioData: data }))
      toast.success('Portfolio updated successfully!')
      return result.payload
    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to update portfolio'
      toast.error(message)
      throw error
    }
  }, [dispatch])

  const deletePortfolio = useCallback(async (id: string) => {
    try {
      dispatch(setLoading(true))
      await portfolioService.deletePortfolio(id)
      dispatch(removePortfolio(id))
      
      // Unsubscribe from portfolio updates
      wsService.unsubscribeFromPortfolio(id)
      
      toast.success('Portfolio deleted successfully!')    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to delete portfolio'
      dispatch(setError(message))
      toast.error(message)
      throw error
    }
  }, [dispatch])

  const addAssetToPortfolio = useCallback(async (portfolioId: string, data: AddAssetToPortfolioData) => {
    try {
      const result = await dispatch(addAssetToPortfolioAction({ portfolioId, assetData: data }))
      
      // Subscribe to asset price updates
      wsService.subscribeToAsset(data.symbol)
      
      toast.success('Asset added to portfolio!')
      return result.payload    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to add asset to portfolio'
      toast.error(message)
      throw error
    }
  }, [dispatch])

  const removeAssetFromPortfolio = useCallback(async (portfolioId: string, assetId: string) => {
    try {
      const result = await dispatch(removeAssetFromPortfolioAction({ portfolioId, assetId }))
      toast.success('Asset removed from portfolio!')
      return result.payload    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to remove asset from portfolio'
      toast.error(message)
      throw error
    }
  }, [dispatch])

  const getPortfolioPerformance = useCallback(async (id: string, period?: string) => {
    try {
      const data = await portfolioService.getPortfolioPerformance(id, period)
      return data    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to fetch portfolio performance'
      toast.error(message)
      throw error
    }
  }, [])

  return {
    portfolios,
    currentPortfolio,
    isLoading,
    error,
    fetchPortfolios,
    fetchPortfolio,
    createPortfolio,
    updatePortfolio: updatePortfolioData,
    deletePortfolio,
    addAssetToPortfolio,
    removeAssetFromPortfolio,
    getPortfolioPerformance,
  }
}
