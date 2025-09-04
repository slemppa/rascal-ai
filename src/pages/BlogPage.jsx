import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SiteHeader from '../components/SiteHeader'
import SignIn from '../components/auth/SignIn' // Keep for modal rendering
import ForgotPassword from '../components/auth/ForgotPassword' // Keep for modal rendering
import './BlogPage.css'
import '../styles/article-cards.css' // Page specific styles

export default function BlogPage() {
  const { t, i18n } = useTranslation('common')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Käytä backend-endpointtia Supabase-kutsun sijaan
      const response = await fetch('/api/get-articles')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const articles = await response.json()
      setArticles(articles || [])
    } catch (err) {
      console.error('Error fetching articles:', err)
      setError(t('blog.error'))
    } finally {
      setLoading(false)
    }
  }



  return (
    <>
      <PageMeta 
        title={`${t('blog.title')} - RascalAI`} 
        description={t('blog.description')} 
        image="/hero-v3.jpg" 
      />
      
            <div className="blog-page">
        {/* Shared Site Header */}
        <SiteHeader onOpenSignIn={() => setShowSignInModal(true)} />

        <div className="layout-container">
          {/* Page Title Section */}
          <section className="blog-title-section">
            <div className="blog-title-content">
              <h1 className="blog-title">{t('blog.title')}</h1>
              <p className="blog-description">{t('blog.description')}</p>
            </div>
          </section>

          {/* Articles Grid */}
          <main className="blog-main">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>{t('blog.loading')}</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <h2>{t('blog.errorTitle')}</h2>
                <p>{error}</p>
                <button onClick={fetchArticles} className="btn btn-primary">
                  {t('blog.retry')}
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="no-articles">
                <h3>{t('blog.emptyTitle')}</h3>
                <p>{t('blog.emptyDesc')}</p>
              </div>
            ) : (
              <div className="articles-grid">
                {articles.map((article) => (
                  <article key={article.id} className="article-card">
                    <div className="article-image">
                      {(article.image_url || article.media_url) ? (
                        <img 
                          src={article.image_url || article.media_url} 
                          alt={article.title || 'Artikkeli'}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = '/placeholder.png' }}
                        />
                      ) : (
                        <div className="article-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.5 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V9.5L14.5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      
                      {/* Kategoriat omissa laatikoissaan (max 3) */}
                      {Array.isArray(article.category) && article.category.length > 0 ? (
                        <div className="article-categories-container">
                          {article.category.slice(0, 3).map((cat, index) => (
                            <div key={index} className="article-category-badge">
                              {cat}
                            </div>
                          ))}
                        </div>
                      ) : article.category ? (
                        <div className="article-category">
                          {article.category}
                        </div>
                      ) : (
                        <div className="article-category">{t('articles.general').toUpperCase()}</div>
                      )}
                    </div>
                    <div className="article-content">
                      <h3 className="article-title" style={{
                        fontSize: article.title && article.title.length > 20 
                          ? `${Math.max(1.2, 1.9 - (article.title.length * 0.015))}rem`
                          : '1.8rem'
                      }}>
                        <a href={`/blog/${article.slug || 'ei-slugia'}`} className="article-link">
                          {article.title || t('blog.noTitle')}
                        </a>
                      </h3>
                      <p className="article-excerpt">
                        {article.excerpt || (article.content ? article.content.substring(0, 150) + '...' : t('blog.noExcerpt'))}
                      </p>
                      <div className="article-meta">
                        <span className="article-date">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fi-FI') : t('articles.noDate')}
                        </span>
                        <a href={`/blog/${article.slug || 'ei-slugia'}`} className="read-more-link">
                          {t('articles.readMore')}
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showSignInModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setShowSignInModal(false) }}>
          <div className="modal-container">
            <SignIn 
              onClose={() => setShowSignInModal(false)}
              onForgotClick={() => { setShowSignInModal(false); setShowForgotModal(true) }}
            />
          </div>
        </div>
      )}

      {showForgotModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) { setShowForgotModal(false); setShowSignInModal(true) } }}>
          <div className="modal-container">
            <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}

    </>
  )
}
