import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import './MediaMonitoringPage.css'

const MediaMonitoringPage = () => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Kirjautuminen vaaditaan')
        setLoading(false)
        return
      }

      const response = await axios.get('/api/monitoring/feed', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      setNews(response.data || [])
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Uutisvirran lataus epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = (article) => {
    navigate('/monitoring/create', {
      state: {
        sourceUrl: article.url,
        title: article.title,
        body: article.contentSnippet,
        original: article
      }
    })
  }

  const handleMarkRead = async (id) => {
    // Piilota uutinen näkymästä (tulevaisuudessa voidaan merkitä luetuksi Minifluxissa)
    setNews(news.filter(item => item.id !== id))
  }

  return (
    <div className="monitoring-container">
      <div className="monitoring-header">
        <h2>{t('monitoring.title')}</h2>
        <p className="monitoring-subtitle">{t('monitoring.subtitle')}</p>
      </div>

      {loading ? (
        <div className="monitoring-loading">
          <div className="loading-spinner"></div>
          <p>{t('monitoring.loading')}</p>
        </div>
      ) : error ? (
        <div className="monitoring-error">
          <p>{error}</p>
          <Button onClick={fetchFeed} variant="secondary">
            {t('common.retry')}
          </Button>
        </div>
      ) : news.length === 0 ? (
        <div className="monitoring-empty">
          <p>{t('monitoring.empty')}</p>
        </div>
      ) : (
        <div className="monitoring-grid">
          {news.map((item) => (
            <div key={item.id} className="monitoring-card">
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="monitoring-card-image"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              )}
              
              <div className="monitoring-card-content">
                <span className="monitoring-card-source">
                  {item.feedTitle}
                </span>
                <h3 className="monitoring-card-title">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="monitoring-card-link"
                  >
                    {item.title}
                  </a>
                </h3>
                {item.contentSnippet && (
                  <p className="monitoring-card-snippet">
                    {item.contentSnippet}
                  </p>
                )}
              </div>

              <div className="monitoring-card-actions">
                <Button 
                  onClick={() => handleCreatePost(item)}
                  className="monitoring-card-button"
                >
                  ✨ {t('monitoring.createPost')}
                </Button>
                <button 
                  onClick={() => handleMarkRead(item.id)}
                  className="monitoring-card-close"
                  title={t('monitoring.hide')}
                  aria-label={t('monitoring.hide')}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MediaMonitoringPage
