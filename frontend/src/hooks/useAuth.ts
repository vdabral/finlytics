import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import { loginStart, loginSuccess, loginFailure, logout } from '../store/authSlice'
import { authService } from '../services/authService'
import { wsService } from '../services/websocketService'
import type { LoginCredentials, RegisterCredentials, ErrorResponse } from '../types'
import { toast } from 'react-toastify'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth)

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch(loginStart())
      const response = await authService.login(credentials)
      dispatch(loginSuccess(response))
      
      // Connect to WebSocket
      wsService.connect(response.token)
      
      toast.success('Login successful!')
      return response    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Login failed'
      dispatch(loginFailure(message))
      throw error
    }
  }, [dispatch])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      dispatch(loginStart())
      const response = await authService.register(credentials)
      dispatch(loginSuccess(response))
      
      // Connect to WebSocket
      wsService.connect(response.token)
      
      toast.success('Registration successful!')
      return response    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Registration failed'
      dispatch(loginFailure(message))
      throw error
    }
  }, [dispatch])

  const logoutUser = useCallback(() => {
    dispatch(logout())
    wsService.disconnect()
    toast.info('Logged out successfully')
  }, [dispatch])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authService.forgotPassword(email)
      toast.success('Password reset email sent!')    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to send reset email'
      toast.error(message)
      throw error
    }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      await authService.resetPassword(token, password)
      toast.success('Password reset successful!')    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse
      const message = errorResponse.response?.data?.message || 'Failed to reset password'
      toast.error(message)
      throw error
    }
  }, [])

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout: logoutUser,
    forgotPassword,
    resetPassword,
  }
}
