import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PageMeta from '../components/PageMeta'
import './BlogArticlePage.css'

export default function BlogArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (slug) {
      fetchArticle(slug)
    }
  }, [slug])

  const fetchArticle = async (articleSlug) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/get-article/${articleSlug}`)
      if (!response.ok) {
        throw new Error('Artikkelia ei voitu ladata')
      }
      const data = await response.json()
      setArticle(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
        <div className="layout-container">
          {/* Back Button */}
          <div className="back-button-container">
            <Link to="/blog" className="back-button">
              ← Takaisin artikkeleihin
            </Link>
          </div>

          {/* Article Header */}
          <header className="article-header">
            <div className="article-meta">
                                      <span className="article-date">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString('fi-FI') : 'Ei päivää'}
                        </span>
                        {article.category && (
                          <span className="article-category">{article.category}</span>
                        )}
            </div>
            <h1 className="article-title">{article.title || 'Ei otsikkoa'}</h1>
            {(article.excerpt || article.meta_description) && (
              <p className="article-excerpt">{article.excerpt || article.meta_description}</p>
            )}
          </header>

          {/* Article Image */}
          {(article.image_url || article.media_url) && (
            <div className="article-hero-image">
              <img 
                src={article.image_url || article.media_url} 
                alt={article.title || 'Artikkeli'}
                loading="lazy"
              />
            </div>
          )}

          {/* Article Content */}
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

          {/* Article Footer */}
          <footer className="article-footer">
            <div className="footer-content">
              <div className="share-section">
                <h3>Jaa artikkeli</h3>
                <div className="share-buttons">
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-button facebook"
                  >
                    Facebook
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title || 'Artikkeli')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-button twitter"
                  >
                    Twitter
                  </a>
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-button linkedin"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
              
              <div className="back-to-blog">
                <Link to="/blog" className="btn btn-secondary">
                  Katso kaikki artikkelit
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
