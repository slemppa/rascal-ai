import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import DashboardPage from './src/pages/DashboardPage'
import SignIn from './src/components/auth/SignIn'
import SignUp from './src/components/auth/SignUp'
import ForgotPassword from './src/components/auth/ForgotPassword'
import ResetPassword from './src/components/auth/ResetPassword'
import ProtectedRoute from './src/components/ProtectedRoute'
import AuthCallback from './src/components/auth/AuthCallback'
import { AuthProvider } from './src/contexts/AuthContext'
import { AutoLogoutProvider } from './src/contexts/AutoLogoutContext'
import { PostsProvider } from './src/contexts/PostsContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import { StrategyStatusProvider } from './src/contexts/StrategyStatusContext'
import Sidebar from './src/components/Sidebar'
import MobileNavigation from './src/components/MobileNavigation'
import InactivityWarningModal from './src/components/InactivityWarningModal'
import VersionNotification from './src/components/VersionNotification'
import StrategyModalManager from './src/components/StrategyModalManager'
import OnboardingModal from './src/components/OnboardingModal'
import ManagePostsPage from './src/pages/ManagePostsPage'
import AdminPage from './src/pages/AdminPage'
import ContentStrategyPage from './src/pages/ContentStrategyPage'
import AIChatPage from './src/pages/AIChatPage'
import DevPage from './src/pages/DevPage'
import HelpPage from './src/pages/HelpPage'
import CallPanel from './src/pages/CallPanel'
import SettingsPage from './src/pages/SettingsPage'
import BlogNewsletterPage from './src/pages/BlogNewsletterPage'
import AdminBlogPage from './src/pages/AdminBlogPage'
import AdminTestimonialsPage from './src/pages/AdminTestimonialsPage'
import MeetingNotesPage from './src/pages/MeetingNotesPage'
import CampaignsPage from './src/pages/CampaignsPage'
import CampaignCreatePage from './src/pages/CampaignCreatePage'
import CampaignDetailPage from './src/pages/CampaignDetailPage'
import SegmentsPage from './src/pages/SegmentsPage'
import SegmentCreatePage from './src/pages/SegmentCreatePage'
import SegmentDetailPage from './src/pages/SegmentDetailPage'
import AccountManagerPage from './src/pages/AccountManagerPage'
import AccountDetailsPage from './src/pages/AccountDetailsPage'
import OrganizationMembersPage from './src/pages/OrganizationMembersPage'
import LeadMagnetPage from './src/pages/LeadMagnetPage'
import VastaajaPage from './src/pages/VastaajaPage'
import LeadScrapingPage from './src/pages/LeadScrapingPage'
import TestN8NPage from './src/pages/TestN8NPage'

// ConditionalChatbotWidget komponentti - ei tarvita enää
function ConditionalChatbotWidget() {
  return null
}

export default function App() {
  console.log('🔵🔵🔵 App.jsx: RENDERING!')
  
  return (
    <AuthProvider>
      <AutoLogoutProvider>
        <OnboardingModal />
        <PostsProvider>
          <NotificationProvider>
            <StrategyStatusProvider>
              <Routes>
                {/* Kirjautumisreitit */}
                <Route path="/" element={<SignIn />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Julkinen lead magnet -sivu */}
                <Route path="/leadmagnet/:token" element={<LeadMagnetPage />} />
                
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
                
                <Route path="/admin-testimonials" element={
                  <ProtectedRoute requiredRole="moderator">
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <AdminTestimonialsPage />
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
                
                <Route path="/test-n8n" element={
                  <ProtectedRoute>
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <TestN8NPage />
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
                
                <Route path="/organization-members" element={
                  <ProtectedRoute>
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <OrganizationMembersPage />
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
                
                <Route path="/dev" element={
                  <ProtectedRoute requiredRole="admin">
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <DevPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/account-manager" element={
                  <ProtectedRoute requiredRole="moderator">
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <AccountManagerPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/account-manager/:id" element={
                  <ProtectedRoute requiredRole="moderator">
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <AccountDetailsPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/vastaaja" element={
                  <ProtectedRoute>
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <VastaajaPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/lead-scraping" element={
                  <ProtectedRoute>
                    <div className="app-layout">
                      <Sidebar />
                      <MobileNavigation />
                      <div className="main-content">
                        <LeadScrapingPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                } />
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
  )
} 