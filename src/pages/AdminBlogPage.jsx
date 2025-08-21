import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import PageMeta from '../components/PageMeta'
import './AdminBlogPage.css'

export default function AdminBlogPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    image_url: '',
    published_at: new Date().toISOString().split('T')[0],
    published: true
  })
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [tempImageFile, setTempImageFile] = useState(null) // Väliaikainen kuva

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/get-articles?scope=admin')
      
      if (!response.ok) {
        throw new Error('Artikkeleita ei voitu ladata')
      }
      
      const data = await response.json()
      if (data.success) {
        setArticles(data.articles || [])
      } else if (Array.isArray(data)) {
        // fallback jos backend palauttaa suoraan taulukon
        setArticles(data)
      } else {
        throw new Error(data.error || 'Virhe artikkeleiden haussa')
      }
    } catch (err) {
      console.error('Virhe artikkeleiden haussa:', err)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setUploading(true)
      
      // Rakennetaan FormData (artikkelikentät + mahdollinen kuva)
      const fd = new FormData()
      fd.append('action', editingArticle ? 'update' : 'create')
      if (editingArticle?.id) fd.append('articleId', String(editingArticle.id))
      fd.append('title', formData.title || '')
      fd.append('slug', formData.slug || '')
      fd.append('excerpt', formData.excerpt || '')
      fd.append('content', formData.content || '')
      fd.append('category', formData.category || '')
      fd.append('published_at', formData.published_at || '')
      fd.append('published', String(formData.published ?? true))

      // Jos käyttäjä valitsi kuvan, lähetetään binarynä
      if (tempImageFile?.file) {
        fd.append('image', tempImageFile.file, tempImageFile.fileName || tempImageFile.file.name)
      }

      const response = await fetch('/api/blog-article-management', {
        method: 'POST',
        body: fd
      })

      if (!response.ok) {
        throw new Error('Artikkelia ei voitu tallentaa')
      }

      const result = await response.json()
      
      if (result.success) {
        resetForm()
        setTempImageFile(null)
        await fetchArticles()
        setShowForm(false)
        
        alert(editingArticle ? 'Artikkeli päivitetty!' : 'Artikkeli lisätty!')
      } else {
        throw new Error(result.error || 'Tuntematon virhe')
      }
    } catch (err) {
      console.error('Virhe artikkelin tallennuksessa:', err)
      alert('Virhe: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || article.mainbody || '',
      category: article.category || '',
      image_url: article.image_url || article.media_url || '',
      published_at: article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      published: article.published !== false
    })
    setShowForm(true)
  }

  const handleDelete = async (articleId) => {
    if (!confirm('Oletko varma, että haluat poistaa tämän artikkelin?')) {
      return
    }

    try {
      const response = await fetch('/api/blog-article-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          articleId: articleId
        })
      })

      if (!response.ok) {
        throw new Error('Artikkelia ei voitu poistaa')
      }

      const result = await response.json()
      if (result.success) {
        await fetchArticles()
        alert('Artikkeli poistettu!')
      } else {
        throw new Error(result.error || 'Virhe artikkelin poistossa')
      }
    } catch (err) {
      console.error('Virhe artikkelin poistossa:', err)
      alert('Virhe: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      image_url: '',
      published_at: new Date().toISOString().split('T')[0],
      published: true
    })
    setEditingArticle(null)
    setTempImageFile(null) // Clear temporary image
  }

  const openNewForm = () => {
    resetForm()
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = [...e.dataTransfer.files]
    if (files && files[0]) {
      uploadImage(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = [...e.target.files]
    if (files && files[0]) {
      uploadImage(files[0])
    }
  }

  const uploadImage = async (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Vain kuvatiedostot ovat sallittuja')
      return
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Kuva on liian suuri. Maksimikoko on 5MB.')
      return
    }

    try {
      setUploading(true)

      // Convert file to base64 and store temporarily
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          // Store the file and base64 data temporarily
          setTempImageFile({
            file: file,
            base64: reader.result,
            fileName: file.name
          })
          
          // Show preview in form
          setFormData(prev => ({
            ...prev,
            image_url: reader.result // Base64 preview
          }))

          alert('Kuva valittu! Se lähetetään kun tallennat artikkelin.')
        } catch (error) {
          console.error('Image processing error:', error)
          alert('Virhe kuvan käsittelyssä: ' + error.message)
        } finally {
          setUploading(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Virhe kuvan käsittelyssä: ' + error.message)
      setUploading(false)
    }
  }

  return (
    <>
      <PageMeta 
        title="Blogi-hallinta - RascalAI.fi" 
        description="Hallitse blogi-artikkeleita" 
      />
      
      <div className="admin-blog-page">
        <div className="layout-container">
          {/* Header */}
          <header className="admin-header">
            <div className="header-content">
              <h1 className="page-title">Blogi-hallinta</h1>
              <p className="page-description">
                Hallitse blogi-artikkeleita ja sisältöä
              </p>
            </div>
            <button 
              onClick={openNewForm}
              className="btn btn-primary add-article-btn"
            >
              + Lisää uusi artikkeli
            </button>
          </header>

          {/* Form Modal */}
          {showForm && (
            <div className="form-modal-overlay" onClick={closeForm}>
              <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingArticle ? 'Muokkaa artikkelia' : 'Lisää uusi artikkeli'}</h2>
                  <button onClick={closeForm} className="close-btn">×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="article-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="title">Otsikko *</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Artikkelin otsikko"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="slug">URL-slug *</label>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        required
                        placeholder="artikkelin-url-slug"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Kategoria</label>
                      <input
                        type="text"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="esim. Myynti, Markkinointi"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="published_at">Julkaisupäivä *</label>
                      <input
                        type="date"
                        id="published_at"
                        name="published_at"
                        value={formData.published_at}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Artikkelin kuva</label>
                    
                    {/* Drag & Drop Area */}
                    <div 
                      className={`image-upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {uploading ? (
                        <div className="upload-progress">
                          <div className="upload-spinner"></div>
                          <p>Ladataan kuvaa...</p>
                        </div>
                      ) : formData.image_url ? (
                        <div className="uploaded-image">
                          <img src={formData.image_url} alt="Ladattu kuva" />
                          <div className="image-actions">
                            <button 
                              type="button" 
                              onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                              className="btn btn-small btn-danger"
                            >
                              Poista kuva
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon">📷</div>
                          <h3>Raahaa kuva tähän tai klikkaa valitaksesi</h3>
                          <p>Tuetut formaatit: JPG, PNG, GIF (max 5MB)</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="file-input"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Manual URL input as fallback */}
                    <details className="manual-url-section">
                      <summary>Tai syötä kuvan URL manuaalisesti</summary>
                      <input
                        type="url"
                        id="image_url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://your-project.supabase.co/storage/v1/object/public/blog-covers/kuva.jpg"
                        className="manual-url-input"
                      />
                    </details>
                    
                    <small className="form-help">
                      Kuvat ladataan automaattisesti Supabase Storage:en blog-covers bucketiin
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="excerpt">Lyhyt kuvaus</label>
                    <textarea
                      id="excerpt"
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Lyhyt kuvaus artikkelista (näkyy listauksessa)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="content">Sisältö (Markdown-muodossa) *</label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows="15"
                      required
                      placeholder="Artikkelin sisältö Markdown-muodossa..."
                    />
                    <small className="form-help">
                      Käytä Markdown-syntaksia: **lihavointi**, *kursiivi*, ## otsikko, - lista, [linkki](url)
                    </small>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={closeForm} className="btn btn-secondary">
                      Peruuta
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingArticle ? 'Päivitä artikkeli' : 'Lisää artikkeli'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Articles List */}
          <main className="admin-main">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ladataan artikkeleita...</p>
              </div>
            ) : (
              <div className="articles-list">
                <h2>Artikkelit ({articles.length})</h2>
                
                {articles.length === 0 ? (
                  <div className="no-articles">
                    <p>Ei artikkeleita vielä. Lisää ensimmäinen artikkeli yllä olevalla painikkeella.</p>
                  </div>
                ) : (
                  <div className="articles-table">
                    <div className="table-header">
                      <div className="header-cell">Otsikko</div>
                      <div className="header-cell">Kategoria</div>
                      <div className="header-cell">Julkaistu</div>
                      <div className="header-cell">Toiminnot</div>
                    </div>
                    
                    {articles.map((article) => (
                      <div key={article.id} className="table-row">
                        <div className="cell title-cell">
                          <div className="article-info">
                            <h3>{article.title || 'Ei otsikkoa'}</h3>
                            <p className="article-slug">/{article.slug || 'ei-slugia'}</p>
                          </div>
                        </div>
                        <div className="cell category-cell">
                          {article.category || '-'}
                        </div>
                        <div className="cell date-cell">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString('fi-FI') : 'Ei päivää'}
                        </div>
                        <div className="cell actions-cell">
                          <button 
                            onClick={() => handleEdit(article)}
                            className="btn btn-small btn-secondary"
                          >
                            Muokkaa
                          </button>
                          <button 
                            onClick={() => handleDelete(article.id)}
                            className="btn btn-small btn-danger"
                          >
                            Poista
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
