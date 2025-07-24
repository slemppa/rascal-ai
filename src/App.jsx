import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import MagicLink from './components/auth/MagicLink'
import ProtectedRoute from './components/ProtectedRoute'
import AuthCallback from './components/auth/AuthCallback'
import { AuthProvider } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Julkiset reitit */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/magic-link" element={<MagicLink />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Suojatut reitit sidebarin kanssa */}
        <Route path="/dashboard" element={
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div className="main-content">
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            </div>
          </div>
        } />
        {/* Lisää muut suojatut reitit tähän samalla tavalla, jos haluat menun näkyvän niilläkin */}
      </Routes>
    </AuthProvider>
  )
}
