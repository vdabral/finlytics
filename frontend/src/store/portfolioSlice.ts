import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Portfolio, PortfolioState, CreatePortfolioData } from '../types'
import { portfolioService } from '../services/portfolioService'

// Async thunks
export const fetchPortfolios = createAsyncThunk(
  'portfolio/fetchPortfolios',
  async () => {
    const response = await portfolioService.getPortfolios()
    return response
  }
)

export const fetchPortfolioById = createAsyncThunk(
  'portfolio/fetchPortfolioById',
  async (id: string) => {
    const response = await portfolioService.getPortfolio(id)
    return response
  }
)

export const createPortfolio = createAsyncThunk(
  'portfolio/createPortfolio',
  async (portfolioData: CreatePortfolioData) => {
    const response = await portfolioService.createPortfolio(portfolioData)
    return response
  }
)

export const deletePortfolio = createAsyncThunk(
  'portfolio/deletePortfolio',
  async (id: string) => {
    await portfolioService.deletePortfolio(id)
    return id
  }
)

export const updatePortfolio = createAsyncThunk(
  'portfolio/updatePortfolio',
  async ({ id, portfolioData }: { id: string; portfolioData: Partial<CreatePortfolioData> }) => {
    const response = await portfolioService.updatePortfolio(id, portfolioData)
    return response
  }
)

export const addAssetToPortfolio = createAsyncThunk(
  'portfolio/addAssetToPortfolio',
  async ({ portfolioId, assetData }: { portfolioId: string; assetData: { symbol: string; quantity: number; purchasePrice: number } }) => {
    const response = await portfolioService.addAssetToPortfolio(portfolioId, assetData)
    return response
  }
)

export const removeAssetFromPortfolio = createAsyncThunk(
  'portfolio/removeAssetFromPortfolio',
  async ({ portfolioId, assetId }: { portfolioId: string; assetId: string }) => {
    const response = await portfolioService.removeAssetFromPortfolio(portfolioId, assetId)
    return response
  }
)

export const recordTransaction = createAsyncThunk(
  'portfolio/recordTransaction',
  async ({ portfolioId, transactionData }: { 
    portfolioId: string; 
    transactionData: {
      assetId: string;
      type: 'buy' | 'sell';
      quantity: number;
      price: number;
      fees?: number;
      notes?: string;
      date: string;
    }
  }) => {
    const response = await portfolioService.recordTransaction(portfolioId, transactionData)
    return response
  }
)

const initialState: PortfolioState = {
  portfolios: [],
  currentPortfolio: null,
  isLoading: false,
  error: null,
}

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setPortfolios: (state, action: PayloadAction<Portfolio[]>) => {
      state.portfolios = action.payload
      state.isLoading = false
      state.error = null
    },
    setCurrentPortfolio: (state, action: PayloadAction<Portfolio | null>) => {
      state.currentPortfolio = action.payload
    },
    addPortfolio: (state, action: PayloadAction<Portfolio>) => {
      state.portfolios.push(action.payload)
    },    updatePortfolioLocal: (state, action: PayloadAction<Portfolio>) => {
      const index = state.portfolios.findIndex(p => p._id === action.payload._id)
      if (index !== -1) {
        state.portfolios[index] = action.payload
      }
      if (state.currentPortfolio?._id === action.payload._id) {
        state.currentPortfolio = action.payload
      }
    },
    removePortfolio: (state, action: PayloadAction<string>) => {
      state.portfolios = state.portfolios.filter(p => p._id !== action.payload)
      if (state.currentPortfolio?._id === action.payload) {
        state.currentPortfolio = null
      }
    },
    updatePortfolioAssetPrice: (state, action: PayloadAction<{ symbol: string; price: number }>) => {
      const { symbol, price } = action.payload
      
      // Update all portfolios
      state.portfolios.forEach(portfolio => {
        portfolio.assets.forEach(asset => {
          if (asset.symbol === symbol) {
            const oldValue = asset.totalValue
            asset.currentPrice = price
            asset.totalValue = asset.quantity * price
            asset.gainLoss = asset.totalValue - (asset.quantity * asset.averagePrice)
            asset.gainLossPercentage = ((asset.currentPrice - asset.averagePrice) / asset.averagePrice) * 100
            
            // Update portfolio totals
            portfolio.totalValue = portfolio.totalValue - oldValue + asset.totalValue
            portfolio.totalGainLoss = portfolio.totalValue - portfolio.totalCost
            portfolio.totalGainLossPercentage = (portfolio.totalGainLoss / portfolio.totalCost) * 100
          }
        })
      })

      // Update current portfolio if it exists
      if (state.currentPortfolio) {
        state.currentPortfolio.assets.forEach(asset => {
          if (asset.symbol === symbol) {
            const oldValue = asset.totalValue
            asset.currentPrice = price
            asset.totalValue = asset.quantity * price
            asset.gainLoss = asset.totalValue - (asset.quantity * asset.averagePrice)
            asset.gainLossPercentage = ((asset.currentPrice - asset.averagePrice) / asset.averagePrice) * 100
            
            // Update portfolio totals
            state.currentPortfolio!.totalValue = state.currentPortfolio!.totalValue - oldValue + asset.totalValue
            state.currentPortfolio!.totalGainLoss = state.currentPortfolio!.totalValue - state.currentPortfolio!.totalCost
            state.currentPortfolio!.totalGainLossPercentage = (state.currentPortfolio!.totalGainLoss / state.currentPortfolio!.totalCost) * 100
          }
        })
      }
    },    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch portfolios
      .addCase(fetchPortfolios.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.isLoading = false
        state.portfolios = action.payload
        state.error = null
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch portfolios'
      })
      // Fetch portfolio by ID
      .addCase(fetchPortfolioById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPortfolioById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPortfolio = action.payload
        state.error = null
      })      .addCase(fetchPortfolioById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch portfolio'
      })
      // Create portfolio
      .addCase(createPortfolio.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createPortfolio.fulfilled, (state, action) => {
        state.isLoading = false
        state.portfolios.push(action.payload)
        state.error = null
      })
      .addCase(createPortfolio.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to create portfolio'
      })
      // Delete portfolio
      .addCase(deletePortfolio.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deletePortfolio.fulfilled, (state, action) => {
        state.isLoading = false
        state.portfolios = state.portfolios.filter(p => p._id !== action.payload)
        if (state.currentPortfolio?._id === action.payload) {
          state.currentPortfolio = null
        }
        state.error = null
      })      .addCase(deletePortfolio.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to delete portfolio'
      })
      // Update portfolio
      .addCase(updatePortfolio.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updatePortfolio.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedPortfolio = action.payload
        // Update portfolio in portfolios array
        const index = state.portfolios.findIndex(p => p._id === updatedPortfolio._id)
        if (index !== -1) {
          state.portfolios[index] = updatedPortfolio
        }
        // Update current portfolio if it's the same one
        if (state.currentPortfolio?._id === updatedPortfolio._id) {
          state.currentPortfolio = updatedPortfolio
        }
        state.error = null
      })
      .addCase(updatePortfolio.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to update portfolio'
      })
      // Add asset to portfolio
      .addCase(addAssetToPortfolio.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addAssetToPortfolio.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedPortfolio = action.payload
        // Update portfolio in portfolios array
        const index = state.portfolios.findIndex(p => p._id === updatedPortfolio._id)
        if (index !== -1) {
          state.portfolios[index] = updatedPortfolio
        }
        // Update current portfolio if it's the same one
        if (state.currentPortfolio?._id === updatedPortfolio._id) {
          state.currentPortfolio = updatedPortfolio
        }
        state.error = null
      })      .addCase(addAssetToPortfolio.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to add asset to portfolio'
      })
      // Remove asset from portfolio
      .addCase(removeAssetFromPortfolio.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(removeAssetFromPortfolio.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedPortfolio = action.payload
        // Update portfolio in portfolios array
        const index = state.portfolios.findIndex(p => p._id === updatedPortfolio._id)
        if (index !== -1) {
          state.portfolios[index] = updatedPortfolio
        }
        // Update current portfolio if it's the same one
        if (state.currentPortfolio?._id === updatedPortfolio._id) {
          state.currentPortfolio = updatedPortfolio
        }
        state.error = null
      })      .addCase(removeAssetFromPortfolio.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to remove asset from portfolio'
      })
      // Record transaction
      .addCase(recordTransaction.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(recordTransaction.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedPortfolio = action.payload
        // Update portfolio in portfolios array
        const index = state.portfolios.findIndex(p => p._id === updatedPortfolio._id)
        if (index !== -1) {
          state.portfolios[index] = updatedPortfolio
        }
        // Update current portfolio if it's the same one
        if (state.currentPortfolio?._id === updatedPortfolio._id) {
          state.currentPortfolio = updatedPortfolio
        }
        state.error = null
      })
      .addCase(recordTransaction.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to record transaction'
      })
  },
})

export const {
  setLoading,
  setError,
  setPortfolios,
  setCurrentPortfolio,
  addPortfolio,
  updatePortfolioLocal,
  removePortfolio,
  updatePortfolioAssetPrice,
  clearError,
} = portfolioSlice.actions

export default portfolioSlice.reducer
