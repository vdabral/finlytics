import axios, { type AxiosResponse } from 'axios'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://finlytics.onrender.com/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status === 403) {
      toast.error('Access denied')
    } else if (error.response?.status === 404) {
      // Don't show toast for 404s in asset-related endpoints - let components handle them
      const isAssetEndpoint = error.config?.url?.includes('/assets/')
      if (!isAssetEndpoint) {
        toast.error('Resource not found')
      }
    } else if (error.response?.status === 400) {
      // Don't show toast for 400s in asset-related endpoints - let components handle them
      const isAssetEndpoint = error.config?.url?.includes('/assets/')
      if (!isAssetEndpoint) {
        toast.error(message)
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else {
      toast.error(message)
    }
    
    return Promise.reject(error)  }
)

export default api
