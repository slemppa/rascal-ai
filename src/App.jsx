import { Routes, Route, useLocation } from 'react-router-dom'
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
import { AutoLogoutProvider } from './contexts/AutoLogoutContext'
import { PostsProvider } from './contexts/PostsContext'
import Sidebar from './components/Sidebar'
import MobileNavigation from './components/MobileNavigation'
import InactivityWarningModal from './components/InactivityWarningModal'
import ChatbotWidget from './components/ChatbotWidget'
import { supabase } from './lib/supabase'
import ManagePostsPage from './pages/ManagePostsPage'
import AdminPage from './pages/AdminPage'
import ContentStrategyPage from './pages/ContentStrategyPage'
import AIChatPage from './pages/AIChatPage'
import DevPage from './pages/DevPage'
import HelpPage from './pages/HelpPage'
import CallPanel from './pages/CallPanel'
import SettingsPage from './pages/SettingsPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import PricingPage from './pages/PricingPage'
import FeaturesPage from './pages/FeaturesPage'
import BlogNewsletterPage from './pages/BlogNewsletterPage'
import BlogPage from './pages/BlogPage'
import BlogArticlePage from './pages/BlogArticlePage'
import AIDueDiligencePage from './pages/AIDueDiligencePage'
import CustomersPage from './pages/CustomersPage'
import AdminBlogPage from './pages/AdminBlogPage'
import AdminTestimonialsPage from './pages/AdminTestimonialsPage'
// MixpostAnalyticsDashboard poistettu
import CampaignsPage from './pages/CampaignsPage'
import SegmentsPage from './pages/SegmentsPage'
import CampaignCreatePage from './pages/CampaignCreatePage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import SegmentCreatePage from './pages/SegmentCreatePage'
import SegmentDetailPage from './pages/SegmentDetailPage'

// Komponentti joka näyttää ChatbotWidget:n vain julkkisilla sivuilla
function ConditionalChatbotWidget() {
  const location = useLocation();
  
  // Julkiset reitit missä ChatbotWidget näkyy
  const publicRoutes = [
    '/',
    '/signin',
    '/signup', 
    '/forgot-password',
    '/reset-password',
    '/magic-link',
    '/auth/callback',
    '/terms',
    '/privacy',
    '/pricing',
    '/features',
    '/blog',
    '/ai-due-diligence',
    '/asiakkaat'
  ];
  
  // Tarkista onko nykyinen reitti julkinen
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/blog') {
      return location.pathname === '/blog';
    }
    if (route.includes(':')) {
      // Dynamic route, tarkista base path
      const basePath = route.split('/:')[0];
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === route;
  });
  
  // Näytä ChatbotWidget vain julkkisilla sivuilla
  return isPublicRoute ? <ChatbotWidget /> : null;
}

export default function App() {
  return (
    <AuthProvider>
      <AutoLogoutProvider>
        <PostsProvider>
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
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogArticlePage />} />
        <Route path="/ai-due-diligence" element={<AIDueDiligencePage />} />
        <Route path="/asiakkaat" element={<CustomersPage />} />
        <Route path="/admin-testimonials" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute requiredRole="moderator"><AdminTestimonialsPage /></ProtectedRoute>
            </div>
          </div>
        } />
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
        <Route path="/campaigns" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><CampaignsPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/segments" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><SegmentsPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/campaigns/create" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><CampaignCreatePage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/campaigns/:id" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><CampaignDetailPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/segments/create" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><SegmentCreatePage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/segments/:id" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute><SegmentDetailPage /></ProtectedRoute>
            </div>
          </div>
        } />
        {/* /mixpost-analytics reitti poistettu */}
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
              <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
            </div>
          </div>
        } />
        <Route path="/admin-blog" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute requiredRole="moderator"><AdminBlogPage /></ProtectedRoute>
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
        <Route path="/dev" element={
          <div className="app-layout">
            <Sidebar />
            <MobileNavigation />
            <div className="main-content">
              <ProtectedRoute requiredRole="moderator" requiredFeatures={["Dev"]}><DevPage /></ProtectedRoute>
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
        </PostsProvider>
        <ConditionalChatbotWidget />
        <InactivityWarningModal />
      </AutoLogoutProvider>
    </AuthProvider>
  )
}
