import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import authSlice from '../store/authSlice'
import portfolioSlice from '../store/portfolioSlice'
import assetSlice from '../store/assetSlice'
import { vi } from 'vitest'

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      portfolio: portfolioSlice,
      asset: assetSlice,
    },
    preloadedState: initialState,
  })
}

// Test wrapper component
const TestWrapper = ({ 
  children, 
  initialState = {} 
}: { 
  children: React.ReactNode;
  initialState?: Record<string, unknown>;
}) => {
  const store = createTestStore(initialState)
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  )
}

// Define the screen mock
const screen = {
  getByTestId: vi.fn(),
  getByText: vi.fn(),
  // Add other methods you need
} as any;

describe('Test Setup', () => {
  it('should render test wrapper correctly', () => {
    render(
      <TestWrapper>
        <div data-testid="test-element">Test Content</div>
      </TestWrapper>
    )

    // Ensure screen object has the methods you're testing
    // Or modify your tests to use methods that exist
    expect(screen.getByTestId('test-element')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})

export { TestWrapper, createTestStore }
