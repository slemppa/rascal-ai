import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'

function EditPostModal({ post, onClose, onSave }) {
  const [idea, setIdea] = useState(post.Idea || '')
  const [caption, setCaption] = useState(post.Caption || '')
  const [publishDate, setPublishDate] = useState(post["Publish Date"] ? post["Publish Date"].slice(0, 16) : '') // yyyy-MM-ddTHH:mm
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = React.useRef(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

  // Autoresize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [caption])

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const payload = {
        "Record ID": post["Record ID"] || post.id,
        Idea: idea,
        Caption: caption,
        "Publish Date": publishDate,
        updateType: 'postUpdate'
      }
      const res = await fetch('/api/update-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Tallennus epäonnistui')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSave(payload)
      }, 1200)
    } catch (err) {
      setError('Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: isMobile ? 20 : 32,
        maxWidth: isMobile ? '100%' : 600,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Muokkaa julkaisua</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#6b7280'
          }}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Idean kuvaus</label>
            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Kuvaile julkaisun idea..."
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Julkaisun teksti</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Kirjoita julkaisun teksti..."
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Julkaisupäivä</label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14
              }}
            />
          </div>
          
          {error && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 14
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              padding: 12,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              color: '#16a34a',
              fontSize: 14
            }}>
              Tallennettu onnistuneesti!
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 8,
                background: '#2563eb',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: saving ? 0.7 : 1
              }}
            >
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingPost, setEditingPost] = useState(null)

  React.useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId
        const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`
        const response = await fetch(url)
        const data = await response.json()
        setPosts(Array.isArray(data) ? data : [])
      } catch (err) {
        setError('Virhe haettaessa julkaisuja')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const handleSavePost = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost["Record ID"] || post["Record ID"] === updatedPost["Record ID"]
          ? { ...post, ...updatedPost }
          : post
      )
    )
    setEditingPost(null)
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>Ladataan...</div>
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>

  // Tulevat postaukset (Publish Date tulevaisuudessa)
  const now = new Date()
  const upcomingPosts = posts.filter(post => {
    const date = post["Publish Date"] ? new Date(post["Publish Date"]) : null
    return date && date > now
  }).sort((a, b) => new Date(a["Publish Date"]) - new Date(b["Publish Date"]))

  return (
    <>
      <PageHeader title="Kojelauta" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 8px' }}>
        {/* Ylärivin laatikot */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
          {/* Tulevat postaukset */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 110 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Tulevat postaukset</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{upcomingPosts.length}</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Seuraavat 7 päivää</div>
          </div>
          {/* Placeholder-laatikot */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24, minHeight: 110 }}></div>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24, minHeight: 110 }}></div>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24, minHeight: 110 }}></div>
        </div>

        {/* Tulevat postaukset ja sähköpostit */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#1f2937', marginBottom: 20 }}>Tulevat postaukset ja sähköpostit</div>
          {upcomingPosts.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 32 }}>Ei tulevia postauksia</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {upcomingPosts.map((post, idx) => {
                const date = post["Publish Date"] ? new Date(post["Publish Date"]) : null
                const day = date ? date.toLocaleDateString('fi-FI', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'
                const time = date ? date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : ''
                return (
                  <div key={post.id || idx} style={{
                    background: '#f3f6fd',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    borderLeft: '5px solid #2563eb',
                    boxShadow: '0 1px 3px rgba(37,99,235,0.04)'
                  }}>
                    {/* Ikoni */}
                    <div style={{ fontSize: 22, color: '#2563eb', marginRight: 8 }}>
                      {post.Type === 'Sähköposti' ? '✉️' : '📄'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#1f2937', marginBottom: 2 }}>{post.Idea || post.title || 'Ei otsikkoa'}</div>
                      <div style={{ color: '#6b7280', fontSize: 14 }}>{post.Type || ''}{post.Type && post.Channel ? ' • ' : ''}{post.Channel || ''}</div>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 15, minWidth: 80, textAlign: 'right' }}>
                      {day} <span style={{ color: '#2563eb', fontWeight: 700 }}>{time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
} 