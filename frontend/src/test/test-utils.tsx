import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import authSlice from '../store/authSlice'
import portfolioSlice from '../store/portfolioSlice'
import assetSlice from '../store/assetSlice'

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
const TestWrapper = ({ children, initialState = {} }) => {
  const store = createTestStore(initialState)
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  )
}

describe('Test Setup', () => {
  it('should render test wrapper correctly', () => {
    render(
      <TestWrapper>
        <div data-testid="test-element">Test Content</div>
      </TestWrapper>
    )

    expect(screen.getByTestId('test-element')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})

export { TestWrapper, createTestStore }
