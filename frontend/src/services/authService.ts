import api from './api'
import type { User, LoginCredentials, RegisterCredentials } from '../types'

export interface AuthResponse {
  user: User
  token: string
}

export const authService = {  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/register', credentials)
    return response.data
  },
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile')
    return response.data.user
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/auth/profile', data)
    return response.data.user
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password })
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token })
  },

  async resendVerification(): Promise<void> {
    await api.post('/auth/resend-verification')
  },

  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token')
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  storeAuth(token: string, user: User): void {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },
}
