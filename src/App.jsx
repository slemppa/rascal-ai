import { useState, useEffect } from 'react'
import { getMockDashboardData, fetchDashboardData } from './services/api'
import './App.css'
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import ManagePostsPage from './pages/ManagePostsPage'
import ContentStrategyPage from './pages/ContentStrategyPage'
import EmailMarketingPage from './pages/EmailMarketingPage'
import SettingsPage from './pages/SettingsPage'
import PostDetailsPage from './pages/PostDetailsPage'
import ReportsPage from './pages/ReportsPage'
import AIChatPage from './pages/AIChatPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import CallPanel from './pages/CallPanel'
import MagicLinkHandler from './components/MagicLinkHandler'
import SetPasswordForm from './components/SetPasswordForm'
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'))
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [dashboardData, setDashboardData] = useState({
    upcomingPosts: [],
    emails: [],
    subscribers: [],
    nextGenerationTime: null,
    stats: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardDataAndSet()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const authToken = localStorage.getItem('auth-token')
    const userEmail = localStorage.getItem('user-email')
    
    if (authToken && userEmail && !isAuthenticated) {
      navigate('/set-password')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const magicToken = urlParams.get('magic-token')
    
    if (magicToken && (window.location.pathname === '/magic-link' || window.location.pathname === '/magic-authentication')) {
      return
    }
  }, [])

  const fetchDashboardDataAndSet = async () => {
    try {
      setLoading(true)
      setError(null)
      let companyId = null
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        companyId = userObj.companyId
      } catch (e) {}
      const data = await fetchDashboardData(companyId)
      // Suodatetaan tulevat postaukset (seuraavat 7 päivää)
      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const posts = Array.isArray(data) ? data : []
      const upcomingPosts = posts
        .map(post => {
          // Etsi päivämäärä: käytä ensisijaisesti Publish Date
          const dateStr = post["Publish Date"] || post.date || post.createdTime || post.Created
          const date = dateStr ? new Date(dateStr) : null
          // Media
          let media = null
          if (Array.isArray(post.Media) && post.Media.length > 0) {
            media = post.Media[0]
          } else if (Array.isArray(post["Media (from Segments)"]) && post["Media (from Segments)"].length > 0) {
            media = post["Media (from Segments)"][0]
          }
          return {
            ...post,
            date,
            media,
            desc: post.Caption || '',
          }
        })
        .filter(post => post.date && post.date >= now && post.date <= weekFromNow)
        .sort((a, b) => a.date - b.date)
      setDashboardData(prev => ({
        ...prev,
        upcomingPosts,
        stats: {
          ...prev.stats,
          totalUpcomingPosts: upcomingPosts.length,
        },
      }))
      setLoading(false)
    } catch (err) {
      setError('Virhe tietojen haussa: ' + err.message)
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fi-FI')
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('fi-FI')
  }

  const calculateTimeRemaining = (targetDate) => {
    const now = new Date()
    const target = new Date(targetDate)
    const diff = target - now
    if (diff <= 0) {
      return 'Aika on umpeutunut'
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) {
      return `${days} päivää ${hours} tuntia`
    } else if (hours > 0) {
      return `${hours} tuntia ${minutes} minuuttia`
    } else {
      return `${minutes} minuuttia`
    }
  }

  const handleLogin = (token, user) => {
    setIsAuthenticated(true)
    setUser(user)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    navigate('/dashboard')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  // Kehitysympäristön automaattinen kirjautuminen
  if (window.location.hostname === 'localhost' && !localStorage.getItem('token')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/magic-link" element={<MagicLinkHandler />} />
        <Route path="/magic-authentication" element={<MagicLinkHandler />} />
        <Route path="/set-password" element={<SetPasswordForm />} />
        <Route path="/setpasswordform" element={<SetPasswordForm />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<LandingPage onLogin={handleLogin} />} />
      </Routes>
    )
  }

  return (
    <div className="app">
      {/* Vasen sivupalkki */}
      <nav className="sidebar">
        <div className="sidebar-header" style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <img src="/favicon.png" alt="favicon" style={{width: 32, height: 32, borderRadius: 8, background: '#fff'}} />
          <h2 style={{margin: 0}}>Rascal AI</h2>
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/dashboard" className={`nav-link${location.pathname === '/dashboard' ? ' active' : ''}`}><span className="nav-icon">🏠</span>Etusivu</Link>
          </li>
          <li className="nav-item">
            <Link to="/posts" className={`nav-link${location.pathname === '/posts' ? ' active' : ''}`}><span className="nav-icon">📝</span>Julkaisut</Link>
          </li>
          <li className="nav-item">
            <Link to="/strategy" className={`nav-link${location.pathname === '/strategy' ? ' active' : ''}`}><span className="nav-icon">📊</span>Sisältöstrategia</Link>
          </li>
          <li className="nav-item">
            <Link to="/calls" className={`nav-link${location.pathname === '/calls' ? ' active' : ''}`}><span className="nav-icon">📞</span>Puhelut</Link>
          </li>
          <li className="nav-item">
            <Link to="/ai-chat" className={`nav-link${location.pathname === '/ai-chat' ? ' active' : ''}`}><span className="nav-icon">🤖</span>Assistentti</Link>
          </li>
          <li className="nav-item">
            <Link to="/settings" className={`nav-link${location.pathname === '/settings' ? ' active' : ''}`}><span className="nav-icon">⚙️</span>Asetukset</Link>
          </li>
        </ul>
        <div style={{padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          <button onClick={handleLogout} style={{width: '100%', background: '#fff', color: 'var(--brand-dark)', border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer'}}>Kirjaudu ulos</button>
        </div>
      </nav>

      {/* Hampurilaisikoni mobiilissa */}
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(open => !open)}>
        <span style={{fontSize: 32, color: 'var(--brand-dark)'}}>☰</span>
      </button>

      {/* Mobiilivalikko overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-menu" onClick={e => e.stopPropagation()}>
            <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>&times;</button>
            <h2 style={{margin: '0 0 1.5rem 0', color: 'var(--brand-dark)'}}>Rascal AI</h2>
            <ul className="nav-menu">
              <li className="nav-item"><Link to="/dashboard" className={`nav-link${location.pathname === '/dashboard' ? ' active' : ''}`} onClick={() => setMobileMenuOpen(false)}><span className="nav-icon">🏠</span>Etusivu</Link></li>
              <li className="nav-item"><Link to="/posts" className={`nav-link${location.pathname === '/posts' ? ' active' : ''}`} onClick={() => setMobileMenuOpen(false)}><span className="nav-icon">📝</span>Julkaisut</Link></li>
              <li className="nav-item"><Link to="/strategy" className={`nav-link${location.pathname === '/strategy' ? ' active' : ''}`} onClick={() => setMobileMenuOpen(false)}><span className="nav-icon">📊</span>Sisältöstrategia</Link></li>
              <li className="nav-item"><Link to="/calls" className={`nav-link${location.pathname === '/calls' ? ' active' : ''}`} onClick={() => setMobileMenuOpen(false)}><span className="nav-icon">📞</span>Puhelut</Link></li>
              <li className="nav-item"><Link to="/ai-chat" className={`nav-link${location.pathname === '/ai-chat' ? ' active' : ''}`} onClick={() => setMobileMenuOpen(false)}><span className="nav-icon">🤖</span>Assistentti</Link></li>
              <li className="nav-item"><Link to="/settings" className={`nav-link${location.pathname === '/settings' ? ' active' : ''}`} onClick={() => setMobileMenuOpen(false)}><span className="nav-icon">⚙️</span>Asetukset</Link></li>
            </ul>
            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} style={{width: '100%', background: 'var(--brand-dark)', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontWeight: 600, fontSize: 18, cursor: 'pointer', marginTop: 24}}>Kirjaudu ulos</button>
          </nav>
        </div>
      )}

      {/* Pääsisältö */}
      <main className={`main-content${location.pathname === '/ai-chat' ? ' no-padding' : ''}`}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage dashboardData={dashboardData} formatDate={formatDate} formatDateTime={formatDateTime} />} />
          <Route path="/posts" element={<ManagePostsPage />} />
          <Route path="/strategy" element={<ContentStrategyPage />} />
          <Route path="/email" element={<EmailMarketingPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/posts/:id" element={<PostDetailsPage />} />
          <Route path="/calls" element={<CallPanel />} />
          <Route path="/set-password" element={<SetPasswordForm />} />
          <Route path="/setpasswordform" element={<SetPasswordForm />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      <Analytics />
    </div>
  )
}
