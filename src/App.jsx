import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import AuthCallback from './components/auth/AuthCallback'
import { AuthProvider } from './contexts/AuthContext'
import { AutoLogoutProvider } from './contexts/AutoLogoutContext'
import { PostsProvider } from './contexts/PostsContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { StrategyStatusProvider } from './contexts/StrategyStatusContext'
import Sidebar from './components/Sidebar'
import MobileNavigation from './components/MobileNavigation'
import InactivityWarningModal from './components/InactivityWarningModal'
import ChatbotWidget from './components/ChatbotWidget'
import VersionNotification from './components/VersionNotification'
import StrategyModalManager from './components/StrategyModalManager'
import TicketButton from './components/TicketButton'
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
import BlogNewsletterPage from './pages/BlogNewsletterPage'
import BlogPage from './pages/BlogPage'
import BlogArticlePage from './pages/BlogArticlePage'
import AIDueDiligencePage from './pages/AIDueDiligencePage'
import AssessmentFormPage from './pages/AssessmentFormPage'
import CustomersPage from './pages/CustomersPage'
import AdminBlogPage from './pages/AdminBlogPage'
import AdminTestimonialsPage from './pages/AdminTestimonialsPage'
import MeetingNotesPage from './pages/MeetingNotesPage'
// MixpostAnalyticsDashboard poistettu
import CampaignsPage from './pages/CampaignsPage'
import SegmentsPage from './pages/SegmentsPage'
import CampaignCreatePage from './pages/CampaignCreatePage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import SegmentCreatePage from './pages/SegmentCreatePage'
import SegmentDetailPage from './pages/SegmentDetailPage'
import LinkedInTest from './components/LinkedInTest'
import NotificationBell from './components/NotificationBell'
import OnboardingModal from './components/OnboardingModal'

// Komponentti joka näyttää ChatbotWidget:n vain julkkisilla sivuilla
function ConditionalChatbotWidget() {
  const location = useLocation();
  
  // Julkiset reitit missä ChatbotWidget näkyy
  const publicRoutes = [
    '/',
    '/fi',
    '/en',
    '/fi/blog',
    '/en/blog',
    '/fi/ai-due-diligence',
    '/en/ai-due-diligence',
    '/fi/asiakkaat',
    '/en/asiakkaat',
    '/signin',
    '/signup', 
    '/forgot-password',
    '/reset-password',
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

// Uudelleenohjaus juuresta evästeen/navigaattorin kielen mukaan -> /fi tai /en
function LanguageRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Älä uudelleenohjaa jos ollaan jo kieliprefiksissä
    if (location.pathname.startsWith('/fi') || location.pathname.startsWith('/en')) return;

    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const cookieLang = getCookie('rascal.lang');
    const navLang = (navigator.language || 'fi').toLowerCase();
    const lang = (cookieLang || navLang).startsWith('en') ? 'en' : 'fi';
    navigate('/' + lang, { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

// Poistettu - käytetään nyt StrategyModalManager.jsx komponenttia

export default function App() {
  console.log('🔵🔵🔵 App.jsx: RENDERING!')
  
  return (
    <>
      <OnboardingModal />
      <AuthProvider>
      <AutoLogoutProvider>
        <PostsProvider>
          <NotificationProvider>
            <StrategyStatusProvider>
              <Routes>
        {/* Julkiset reitit */}
        <Route path="/" element={<LanguageRedirect />} />
        <Route path="/fi" element={<LandingPage />} />
        <Route path="/en" element={<LandingPage />} />
        <Route path="/fi/blog" element={<BlogPage />} />
        <Route path="/en/blog" element={<BlogPage />} />
        <Route path="/fi/blog/:slug" element={<BlogArticlePage />} />
        <Route path="/en/blog/:slug" element={<BlogArticlePage />} />
        <Route path="/fi/ai-due-diligence" element={<AIDueDiligencePage />} />
        <Route path="/en/ai-due-diligence" element={<AIDueDiligencePage />} />
        <Route path="/fi/asiakkaat" element={<CustomersPage />} />
        <Route path="/en/asiakkaat" element={<CustomersPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogArticlePage />} />
        <Route path="/ai-due-diligence" element={<AIDueDiligencePage />} />
        <Route path="/assessment" element={<AssessmentFormPage />} />
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
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <DashboardPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/campaigns" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <CampaignsPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/segments" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <SegmentsPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/campaigns/create" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <CampaignCreatePage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/campaigns/:id" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <CampaignDetailPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/segments/create" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <SegmentCreatePage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/segments/:id" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <SegmentDetailPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/linkedin-test" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <LinkedInTest />
              </div>
            </div>
          </ProtectedRoute>
        } />
        {/* /mixpost-analytics reitti poistettu */}
        <Route path="/posts" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <ManagePostsPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/blog-newsletter" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <BlogNewsletterPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <AdminPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/admin-blog" element={
          <ProtectedRoute requiredRole="moderator">
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <AdminBlogPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/strategy" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <ContentStrategyPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/ai-chat" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <AIChatPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <HelpPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/calls" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <CallPanel />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <SettingsPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/meeting-notes" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <MobileNavigation />
              <div className="main-content">
                <MeetingNotesPage />
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* Lisää muut suojatut reitit tähän samalla tavalla, jos haluat menun näkyvän niilläkin */}
              </Routes>
              <VersionNotification />
              <StrategyModalManager />
            </StrategyStatusProvider>
          </NotificationProvider>
        </PostsProvider>
        <ConditionalChatbotWidget />
        <InactivityWarningModal />
        <SpeedInsights />
      </AutoLogoutProvider>
    </AuthProvider>
    </>
  )
}
