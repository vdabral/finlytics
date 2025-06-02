import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import { store } from './store'
import { useAuth } from './hooks/useAuth'
import { useEffect } from 'react'
import { wsService } from './services/websocketService'

// Layout Components
import Layout from './components/Layout/Layout'
import PublicLayout from './components/Layout/PublicLayout'

// Public Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Protected Pages
import Dashboard from './pages/Dashboard'
import Portfolios from './pages/Portfolios'
import CreatePortfolio from './pages/CreatePortfolio'
import PortfolioDetail from './pages/PortfolioDetail'
import AddAssetToPortfolio from './pages/AddAssetToPortfolio'
import EditPortfolio from './pages/EditPortfolio'
import RecordTransaction from './pages/RecordTransaction'
import Assets from './pages/Assets'
import Market from './pages/Market'
import Profile from './pages/Profile'
import AssetDetail from './pages/AssetDetail'
import Settings from './pages/Settings'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'

import 'react-toastify/dist/ReactToastify.css'

function AppContent() {
  const { isAuthenticated, token, isLoading } = useAuth()

  useEffect(() => {
    // Connect to WebSocket if authenticated
    if (isAuthenticated && token) {
      wsService.connect(token)
    }

    return () => {
      wsService.disconnect()
    }
  }, [isAuthenticated, token])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route 
            path="login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
            } 
          />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="portfolios" element={<Portfolios />} />
            <Route path="portfolios/create" element={<CreatePortfolio />} />
            <Route path="portfolios/:id" element={<PortfolioDetail />} />
            <Route path="portfolios/:id/edit" element={<EditPortfolio />} />
            <Route path="portfolios/:id/add-asset" element={<AddAssetToPortfolio />} />
            <Route path="portfolios/:id/transaction" element={<RecordTransaction />} />
            <Route path="assets" element={<Assets />} />
            <Route path="assets/:symbol" element={<AssetDetail />} />
            <Route path="market" element={<Market />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
