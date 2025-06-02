import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Asset, AssetState, PriceHistoryPoint } from '../types'
import { assetService } from '../services/assetService'

// Async thunks
export const fetchAssets = createAsyncThunk(
  'asset/fetchAssets',
  async (params: { page: number; limit: number; search?: string }) => {
    if (params.search) {
      return await assetService.searchAssets(params.search)
    } else {
      return await assetService.getTrendingAssets(params.limit)
    }
  }
)

export const fetchAssetBySymbol = createAsyncThunk(
  'asset/fetchAssetBySymbol',
  async (symbol: string, { rejectWithValue }) => {
    try {
      // Basic client-side validation
      if (!symbol || symbol.trim().length === 0) {
        throw new Error('Symbol is required');
      }
      
      const trimmedSymbol = symbol.trim().toUpperCase();
      
      // Client-side symbol format validation
      if (!/^[A-Z0-9]{1,10}$/i.test(trimmedSymbol)) {
        throw new Error(`Invalid symbol format: ${symbol}`);
      }
      
      const response = await assetService.getAsset(trimmedSymbol);
      return response;    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        if (httpError.response?.status === 404) {
          return rejectWithValue(`Asset "${symbol}" not found`);
        } else if (httpError.response?.status === 400) {
          return rejectWithValue(httpError.response.data?.message || `Invalid request for asset "${symbol}"`);
        } else {
          return rejectWithValue(httpError.message || `Failed to fetch asset "${symbol}"`);
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const messageError = error as { message: string };
        if (messageError.message?.includes('Invalid symbol format')) {
          return rejectWithValue(messageError.message);
        } else {
          return rejectWithValue(messageError.message || `Failed to fetch asset "${symbol}"`);
        }
      } else {
        return rejectWithValue(`Failed to fetch asset "${symbol}"`);
      }
    }
  }
)

export const searchAssets = createAsyncThunk(
  'asset/searchAssets',
  async (query: string) => {
    const response = await assetService.searchAssets(query)
    return response
  }
)

const initialState: AssetState = {
  assets: [],
  searchResults: [],
  trendingAssets: [],
  currentAsset: null,
  priceHistory: [],
  isLoading: false,
  error: null,
}

const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSearchResults: (state, action: PayloadAction<Asset[]>) => {
      state.searchResults = action.payload
      state.isLoading = false
      state.error = null
    },
    setTrendingAssets: (state, action: PayloadAction<Asset[]>) => {
      state.trendingAssets = action.payload
      state.isLoading = false
      state.error = null
    },
    setCurrentAsset: (state, action: PayloadAction<Asset | null>) => {
      state.currentAsset = action.payload
      state.isLoading = false
      state.error = null
    },
    setPriceHistory: (state, action: PayloadAction<PriceHistoryPoint[]>) => {
      state.priceHistory = action.payload
      state.isLoading = false
      state.error = null
    },
    updateAssetPrice: (state, action: PayloadAction<{ symbol: string; price: number; change: number; changePercent: number }>) => {
      const { symbol, price, change, changePercent } = action.payload
      
      // Update current asset if it matches
      if (state.currentAsset?.symbol === symbol) {
        state.currentAsset.currentPrice = price
        state.currentAsset.change = change
        state.currentAsset.changePercent = changePercent
      }

      // Update in search results
      const searchIndex = state.searchResults.findIndex(asset => asset.symbol === symbol)
      if (searchIndex !== -1) {
        state.searchResults[searchIndex].currentPrice = price
        state.searchResults[searchIndex].change = change
        state.searchResults[searchIndex].changePercent = changePercent
      }

      // Update in trending assets
      const trendingIndex = state.trendingAssets.findIndex(asset => asset.symbol === symbol)
      if (trendingIndex !== -1) {
        state.trendingAssets[trendingIndex].currentPrice = price
        state.trendingAssets[trendingIndex].change = change
        state.trendingAssets[trendingIndex].changePercent = changePercent
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch assets
      .addCase(fetchAssets.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.isLoading = false
        state.assets = action.payload
        state.error = null
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch assets'
      })
      // Fetch asset by symbol
      .addCase(fetchAssetBySymbol.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAssetBySymbol.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentAsset = action.payload
        state.error = null
      })      .addCase(fetchAssetBySymbol.rejected, (state, action) => {
        state.isLoading = false
        state.currentAsset = null
        // Use the payload from rejectWithValue if available, otherwise fallback to error message
        state.error = action.payload as string || action.error.message || 'Failed to fetch asset'
      })
      // Search assets
      .addCase(searchAssets.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchAssets.fulfilled, (state, action) => {
        state.isLoading = false
        state.searchResults = action.payload
        state.error = null
      })
      .addCase(searchAssets.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to search assets'
      })
  },
})

export const {
  setLoading,
  setError,
  setSearchResults,
  setTrendingAssets,
  setCurrentAsset,
  setPriceHistory,
  updateAssetPrice,
  clearSearchResults,
  clearError,
} = assetSlice.actions

export default assetSlice.reducer
