import { useEffect, useState } from 'react'
import PageMeta from '../components/PageMeta'
import SiteHeader from '../components/SiteHeader'
import './LandingPage.css'
import './CustomersPage.css'

export default function CustomersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('testimonials')
          .select('id, name, title, company, quote, avatar_url, published, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching testimonials:', error)
          return
        }

        setItems(data || [])
      } catch (e) {
        console.error('Failed to load testimonials', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderAvatar = (item) => {
    if (item.avatar_url) {
      return (
        <div 
          className="avatar" 
          style={{ backgroundImage: `url(${item.avatar_url})` }}
        />
      )
    }
    return (
      <div className="avatar avatar-placeholder">
        {getInitials(item.name)}
      </div>
    )
  }

  return (
    <div className="landing-page">
      <PageMeta title="Asiakkaat – Rascal AI" description="Asiakastarinoita ja suosituksia Rascal AI:n käyttäjiltä." />
      <div className="layout-container">
        <SiteHeader />

        <div className="landing-main-content">
          <div className="content-container">
            <div className="section">
              <div className="testimonials-intro">
                <h1>Asiakkaat</h1>
                <p>Koottuja suosituksia ja tuloksia Rascal AI:n asiakkailta. Kuule suoraan heiltä, miten tekoäly on muuttanut heidän työtään.</p>
                
                <div className="testimonials-stats">
                  <div className="stat-item">
                    <span className="stat-number">{items.length}</span>
                    <span className="stat-label">Suositus</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">100%</span>
                    <span className="stat-label">Tyytyväisyys</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">24/7</span>
                    <span className="stat-label">Tuki</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="articles-loading">
                  <p>Ladataan suosituksia…</p>
                </div>
              ) : items.length === 0 ? (
                <div className="no-articles">
                  <p>Ei suosituksia vielä.</p>
                </div>
              ) : (
                <div className="testimonials-grid">
                  {items.map(item => (
                    <div key={item.id} className="testimonial-card">
                      <div className="testimonial-header">
                        {renderAvatar(item)}
                        <div>
                          <div className="name">{item.name}</div>
                          <div className="title">
                            {[item.title, item.company].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      </div>
                      <p className="quote">{item.quote}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-bottom">
              <p className="footer-copyright">© 2025 Rascal AI · Rascal Company - More than meets the eye</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}


