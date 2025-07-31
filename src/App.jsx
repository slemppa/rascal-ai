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
import MobileNavigation from './components/MobileNavigation'
import { supabase } from './lib/supabase'
import ManagePostsPage from './pages/ManagePostsPage'
import AdminPage from './pages/AdminPage'
import ContentStrategyPage from './pages/ContentStrategyPage'
import AIChatPage from './pages/AIChatPage'
import HelpPage from './pages/HelpPage'
import CallPanel from './pages/CallPanel'
import SettingsPage from './pages/SettingsPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import PricingPage from './pages/PricingPage'
import FeaturesPage from './pages/FeaturesPage'
import ContactPage from './pages/ContactPage'
import BlogNewsletterPage from './pages/BlogNewsletterPage'


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
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Suojatut reitit sidebarin kanssa */}
        <Route path="/dashboard" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/posts" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><ManagePostsPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/blog-newsletter" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><BlogNewsletterPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/admin" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><AdminPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/strategy" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><ContentStrategyPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/ai-chat" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><AIChatPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/help" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><HelpPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/calls" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><CallPanel /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/settings" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
            </div>
          </div>
        } />

        {/* Lisää muut suojatut reitit tähän samalla tavalla, jos haluat menun näkyvän niilläkin */}
      </Routes>
    </AuthProvider>
  )
}
