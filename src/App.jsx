import { useState, useEffect } from 'react'
import { getMockDashboardData } from './services/api'
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

  useEffect(() => {
    if (isAuthenticated) {
    fetchDashboardData()
    }
  }, [isAuthenticated])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const mockData = getMockDashboardData()
      setDashboardData(mockData)
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

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    )
  }

  return (
    <div className="app">
      {/* Vasen sivupalkki */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Rascal AI</h2>
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/dashboard" className={`nav-link${location.pathname === '/dashboard' ? ' active' : ''}`}><span className="nav-icon">🏠</span>Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link to="/posts" className={`nav-link${location.pathname === '/posts' ? ' active' : ''}`}><span className="nav-icon">📝</span>Manage Posts</Link>
          </li>
          <li className="nav-item">
            <Link to="/strategy" className={`nav-link${location.pathname === '/strategy' ? ' active' : ''}`}><span className="nav-icon">📊</span>Content Strategy</Link>
          </li>
          <li className="nav-item">
            <Link to="/email" className={`nav-link${location.pathname === '/email' ? ' active' : ''}`}><span className="nav-icon">📧</span>Email Marketing</Link>
          </li>
          <li className="nav-item">
            <Link to="/reports" className={`nav-link${location.pathname === '/reports' ? ' active' : ''}`}><span className="nav-icon">📈</span>Reports</Link>
          </li>
          <li className="nav-item">
            <Link to="/ai-chat" className={`nav-link${location.pathname === '/ai-chat' ? ' active' : ''}`}><span className="nav-icon">🤖</span>AI Chat</Link>
          </li>
          <li className="nav-item">
            <Link to="/settings" className={`nav-link${location.pathname === '/settings' ? ' active' : ''}`}><span className="nav-icon">⚙️</span>Settings</Link>
          </li>
        </ul>
        <div style={{padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          <button onClick={handleLogout} style={{width: '100%', background: '#fff', color: 'var(--brand-dark)', border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer'}}>Kirjaudu ulos</button>
        </div>
      </nav>

      {/* Pääsisältö */}
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage dashboardData={dashboardData} formatDate={formatDate} formatDateTime={formatDateTime} />} />
          <Route path="/posts" element={<ManagePostsPage />} />
          <Route path="/strategy" element={<ContentStrategyPage />} />
          <Route path="/email" element={<EmailMarketingPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/posts/:id" element={<PostDetailsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  )
}
