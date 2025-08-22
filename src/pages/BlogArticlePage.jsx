import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PageMeta from '../components/PageMeta'
import SiteHeader from '../components/SiteHeader'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'
import { supabase } from '../lib/supabase'
import './BlogArticlePage.css'
import './BlogPage.css'

export default function BlogArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [prevArticle, setPrevArticle] = useState(null)
  const [nextArticle, setNextArticle] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showMagicModal, setShowMagicModal] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchArticle(slug)
    }
  }, [slug])

  const fetchArticle = async (articleSlug) => {
    try {
      setLoading(true)
      
      // Käytä Supabase clientia suoraan, kuten muutkin sivut
      const { data: article, error } = await supabase
        .from('blog_posts')
        .select('id,title,slug,excerpt,content,category,image_url,published_at,published,created_at,updated_at')
        .eq('slug', articleSlug)
        .eq('published', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Artikkelia ei löytynyt')
        }
        throw new Error('Virhe artikkelin haussa: ' + error.message)
      }

      setArticle(article)
      computeNeighbors(article.slug)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const computeNeighbors = async (currentSlug) => {
    try {
      // Käytä Supabase clientia suoraan
      const { data: articles, error } = await supabase
        .from('blog_posts')
        .select('id,title,slug')
        .eq('published', true)
        .order('published_at', { ascending: false })

      if (error || !Array.isArray(articles)) return
      
      const idx = articles.findIndex(a => (a.slug || '').trim() === (currentSlug || '').trim())
      if (idx === -1) return
      
      const prev = idx > 0 ? articles[idx - 1] : null // edellinen (uudempi)
      const next = idx < articles.length - 1 ? articles[idx + 1] : null // seuraava (vanhempi)
      setPrevArticle(prev)
      setNextArticle(next)
    } catch (_) {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="blog-article-page">
        <div className="layout-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Ladataan artikkelia...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="blog-article-page">
        <div className="layout-container">
          <div className="error-container">
            <h2>Virhe</h2>
            <p>{error || 'Artikkelia ei löytynyt'}</p>
            <Link to="/blog" className="btn btn-primary">
              Takaisin artikkeleihin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageMeta 
        title={`${article.title || 'Artikkeli'} - RascalAI.fi`} 
        description={article.excerpt || (article.content ? article.content.substring(0, 160) : '')} 
        image={article.image_url || article.media_url || "/hero-v3.jpg"} 
      />
      
      <div className="blog-article-page">
        <SiteHeader onOpenSignIn={() => setShowSignInModal(true)} />

        <div className="layout-container">
          <div className="back-button-container">
            <Link to="/blog" className="back-button">← Takaisin artikkeleihin</Link>
          </div>

          <header className="article-header">
            <h1 className="article-title">{article.title || 'Ei otsikkoa'}</h1>
          </header>

          {(article.image_url || article.media_url) && (
            <div className="article-hero-image">
              <img 
                src={article.image_url || article.media_url}
                alt={article.title || 'Artikkeli'}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = '/placeholder.png' }}
              />
            </div>
          )}

          <main className="article-content">
            <div className="content-wrapper">
              <div className="article-body">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="markdown-h1" {...props} />,
                    h2: ({node, ...props}) => <h2 className="markdown-h2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
                    p: ({node, ...props}) => <p className="markdown-p" {...props} />,
                    ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
                    ol: ({node, ...props}) => <ol className="markdown-ol" {...props} />,
                    li: ({node, ...props}) => <li className="markdown-li" {...props} />,
                    strong: ({node, ...props}) => <strong className="markdown-strong" {...props} />,
                    em: ({node, ...props}) => <em className="markdown-em" {...props} />,
                    a: ({node, ...props}) => <a className="markdown-link" target="_blank" rel="noopener noreferrer" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="markdown-blockquote" {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? 
                        <code className="markdown-inline-code" {...props} /> : 
                        <pre className="markdown-pre"><code className="markdown-code" {...props} /></pre>,
                  }}
                >
                  {article.content || ''}
                </ReactMarkdown>
              </div>
            </div>
          </main>

          {(prevArticle || nextArticle) && (
            <div className="article-nav">
              {prevArticle ? (
                <Link to={`/blog/${prevArticle.slug}`} className="btn btn-secondary">← Edellinen artikkeli</Link>
              ) : <span />}
              {nextArticle && (
                <Link to={`/blog/${nextArticle.slug}`} className="btn btn-primary">Seuraava artikkeli →</Link>
              )}
            </div>
          )}
        </div>
      </div>

      {showSignInModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setShowSignInModal(false) }}>
          <div className="modal-container">
            <SignIn 
              onClose={() => setShowSignInModal(false)}
              onForgotClick={() => { setShowSignInModal(false); setShowForgotModal(true) }}
              onMagicLinkClick={() => { setShowSignInModal(false); setShowMagicModal(true) }}
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

      {showMagicModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) { setShowMagicModal(false); setShowSignInModal(true) } }}>
          <div className="modal-container">
            <MagicLink onClose={() => { setShowMagicModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}
    </>
  )
}
