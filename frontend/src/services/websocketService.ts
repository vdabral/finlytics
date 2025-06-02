import { io, Socket } from 'socket.io-client'
import { toast } from 'react-toastify'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(token: string): void {
    if (this.socket?.connected) {
      return
    }

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      this.reconnectAttempts = 0
      toast.success('Connected to real-time updates')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason)
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.handleReconnect()
    })

    this.socket.on('price_update', (data) => {
      // Emit custom event for price updates
      window.dispatchEvent(new CustomEvent('priceUpdate', { detail: data }))
    })

    this.socket.on('portfolio_update', (data) => {
      // Emit custom event for portfolio updates
      window.dispatchEvent(new CustomEvent('portfolioUpdate', { detail: data }))
    })

    this.socket.on('news_update', (data) => {
      // Emit custom event for news updates
      window.dispatchEvent(new CustomEvent('newsUpdate', { detail: data }))
    })

    this.socket.on('notification', (data) => {
      toast.info(data.message)
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        if (this.socket) {
          this.socket.connect()
        }
      }, delay)
    } else {
      toast.error('Unable to connect to real-time updates. Please refresh the page.')
    }
  }

  subscribeToAsset(symbol: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_asset', { symbol })
    }
  }

  unsubscribeFromAsset(symbol: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_asset', { symbol })
    }
  }

  subscribeToPortfolio(portfolioId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_portfolio', { portfolioId })
    }
  }

  unsubscribeFromPortfolio(portfolioId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_portfolio', { portfolioId })
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const wsService = new WebSocketService()
export default wsService
