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
        const res = await fetch('/api/get-testimonials')
        const json = await res.json()
        setItems(json.data || [])
      } catch (e) {
        console.error('Failed to load testimonials', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="landing-page">
      <PageMeta title="Asiakkaat – Rascal AI" description="Asiakastarinoita ja suosituksia Rascal AI:n käyttäjiltä." />
      <div className="layout-container">
        <SiteHeader />

        <div className="landing-main-content">
          <div className="content-container">
            <div className="section">
              <div className="section-header" style={{ textAlign: 'center' }}>
                <h1 className="section-title">Asiakkaat</h1>
                <p className="section-description">Koottuja suosituksia ja tuloksia Rascal AI:n asiakkailta.</p>
              </div>

              {loading ? (
                <div className="articles-loading"><p>Ladataan suosituksia…</p></div>
              ) : items.length === 0 ? (
                <div className="no-articles"><p>Ei suosituksia vielä.</p></div>
              ) : (
                <div className="testimonials-grid">
                  {items.map(item => (
                    <div key={item.id} className="testimonial-card">
                      <div className="testimonial-header">
                        <div className="avatar" style={{ backgroundImage: `url(${item.avatar_url || '/placeholder.png'})` }}></div>
                        <div>
                          <div className="name">{item.name}</div>
                          <div className="title">{[item.title, item.company].filter(Boolean).join(', ')}</div>
                        </div>
                      </div>
                      <p className="quote">“{item.quote}”</p>
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


