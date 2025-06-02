import { describe, it, expect, vi } from 'vitest'
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage, 
  calculatePercentageChange,
  debounce,
  throttle
} from '../lib/utils'

describe('Utils Functions', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly with INR by default', () => {
      expect(formatCurrency(1234.56)).toBe('₹1,234.56')
      expect(formatCurrency(1000)).toBe('₹1,000.00')
    })

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-₹1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('₹0.00')
    })

    it('should respect custom currency', () => {
      expect(formatCurrency(1234.56, 'USD')).toContain('1,234.56')
    })
  })

  describe('formatNumber', () => {
    it('should format large numbers in compact form', () => {
      expect(formatNumber(1234567)).toBe('1.2M')
      expect(formatNumber(1234)).toBe('1.2K')
    })

    it('should format small numbers normally', () => {
      expect(formatNumber(123)).toBe('123')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly with plus sign for positive', () => {
      expect(formatPercentage(12.34)).toBe('+12.34%')
      expect(formatPercentage(-5.00)).toBe('-5.00%')
    })

    it('should handle string inputs', () => {
      expect(formatPercentage('12.34')).toBe('+12.34%')
      expect(formatPercentage('invalid')).toBe('N/A')
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate positive change correctly', () => {
      expect(calculatePercentageChange(120, 100)).toBe(20)
    })

    it('should calculate negative change correctly', () => {
      expect(calculatePercentageChange(80, 100)).toBe(-20)
    })

    it('should handle zero previous value', () => {
      expect(calculatePercentageChange(100, 0)).toBe(0)
    })

    it('should handle no change', () => {
      expect(calculatePercentageChange(100, 100)).toBe(0)
    })
  })

  describe('debounce', () => {
    it('should create a debounced function', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      expect(typeof debouncedFn).toBe('function')
    })
  })

  describe('throttle', () => {
    it('should create a throttled function', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)
      
      expect(typeof throttledFn).toBe('function')
    })
  })
})
